
export interface ICostConfig {
    /** Total cost for a calendar month (Cₘ) */
    totalMonthlyCost: number;
    /** Target profit margin (M), a value between 0 and 1 */
    targetProfitMargin: number;
    /** Minimum allowed price per spot-hour (Pₘᵢₙ) */
    minPrice: number;
    /** Maximum allowed price per spot-hour (Pₘₐₓ) */
    maxPrice: number;
    /** Fixed valet fee (Pᵥ), added if valet service is requested */
    valetPrice: number;
}

/**
 * Provides capacity and occupancy data.
 * Implementations can fetch from a database, an API, or in-memory stores.
 */
export interface ICapacityProvider {
    /** Total capacity of the lot (Tᴄ) */
    getTotalCapacity(): number;
    /** Number of days in the current month (D) */
    getDaysInMonth(): number;
    /**
     * Historical availability array (Hᴬₕ), length = 24.
     * Hᴬₕ[h] = number of available spots at historical hour h (0 ≤ h ≤ 23).
     */
    getHistoricalAvailability(): number[];
    /**
     * Current availability array (Cᴬₕ), length = 24.
     * Cᴬₕ[h] = number of currently available spots for future hour h (0 ≤ h ≤ 23),
     * relative to “hour 0” being the current hour.
     */
    getCurrentAvailability(): number[];
}

/**
 * Tunable parameters for the dynamic pricing algorithm.
 */
export interface IParameterConfig {
    /**
     * Minimum relative‐occupancy factor (Oₘᵢₙ).
     * Used to clamp Oₕ so that we don’t over‐inflate the multiplier when Hₕ ≫ H_avg.
     */
    occupancyClampMin: number;
    /**
     * Maximum relative‐occupancy factor (Oₘₐₓ).
     * Used to clamp Oₕ so that we don’t over‐inflate the multiplier when Hₕ ≫ H_avg.
     */
    occupancyClampMax: number;
    /**
     * Alpha (α) controls how strongly we raise price when availability is low.
     * Default suggestion: 0.2
     */
    alpha: number;
    /**
     * Beta (β) controls smoothing for customer satisfaction (punishes spikes).
     * Default suggestion: 0.1
     */
    beta: number;
    /**
     * Weight (w) between profit‐maximizing price and satisfaction‐maximizing price.
     * Range [0, 1]. w = 1 → all profit; w = 0 → all satisfaction.
     */
    weight: number;
}

/**
 * Main engine that computes dynamic prices per hour and total booking price.
 */
export class DynamicPricingEngine {
    private costConfig: ICostConfig;
    private capacityProvider: ICapacityProvider;
    private params: IParameterConfig;

    /**
     * Number of hours in a day; used for array lengths.
     */
    private static readonly HOURS_IN_DAY = 24;

    constructor(
        costConfig: ICostConfig,
        capacityProvider: ICapacityProvider,
        params: IParameterConfig
    ) {
        this.costConfig = costConfig;
        this.capacityProvider = capacityProvider;
        this.params = params;
    }

    /**
     * Computes the array of hourly prices (Pₕ) for the next 24 hours.
     * Returns an array ‘prices’ of length 24, where prices[h] is Pₕ for hour h (0 ≤ h ≤ 23).
     */
    public computeHourlyPrices(): number[] {
        const { totalMonthlyCost: C_m, targetProfitMargin: M, minPrice: P_min, maxPrice: P_max } =
            this.costConfig;
        const TC = this.capacityProvider.getTotalCapacity();
        const D = this.capacityProvider.getDaysInMonth();
        const historicalAvail = this.capacityProvider.getHistoricalAvailability();
        const currentAvail = this.capacityProvider.getCurrentAvailability();
        const { occupancyClampMin: O_min, occupancyClampMax: O_max, alpha, beta, weight: w } =
            this.params;

        // 1) Compute historical occupancy ratio Hₕ = (TC - Hᴬₕ) / TC for each hour h
        //    H_h ∈ [0, 1]. If Hᴬₕ = 0 (full occupancy historically), Hₕ = 1.
        const H: number[] = new Array(DynamicPricingEngine.HOURS_IN_DAY);
        for (let h = 0; h < DynamicPricingEngine.HOURS_IN_DAY; h++) {
            const HA_h = historicalAvail[h];
            // Guard against division by zero or invalid data
            if (TC <= 0) {
                throw new Error("Total capacity must be > 0");
            }
            H[h] = (TC - HA_h) / TC;
        }

        // 2) Compute simple average occupancy ratio across all 24 hours:
        //    H_avg = (1/24) * Σ_{h=0..23} Hₕ
        const H_sum = H.reduce((sum, val) => sum + val, 0);
        const H_avg = H_sum / DynamicPricingEngine.HOURS_IN_DAY;

        // 3) Compute target revenue for the month: Rₘ = (1 + M) × Cₘ
        const R_m = (1 + M) * C_m;

        // 4) Compute expected total “occupied spot‐hours” for next month:
        //    E_occ = H_avg × TC × D × 24
        const E_occ = H_avg * TC * D * DynamicPricingEngine.HOURS_IN_DAY;

        // 5) Compute base price P_b = Rₘ / E_occ
        //    This is the uniform price that, if occupancy matched H_avg every hour, would hit the revenue target.
        if (E_occ <= 0) {
            throw new Error("Expected occupied spot‐hours (E_occ) must be > 0");
        }
        const P_b = R_m / E_occ;

        // 6) Precompute Oₕ' (clamped relative‐occupancy factor) and Aₕ' (availability factor) per hour:
        //    For each h:
        //      Oₕ = Hₕ / H_avg
        //      Oₕ' = clamp(Oₕ, O_min, O_max)
        //      Aₕ = Cᴬₕ / TC
        //      Aₕ' = 1 + α × (1 - Aₕ)
        const O_prime: number[] = new Array(DynamicPricingEngine.HOURS_IN_DAY);
        const A_prime: number[] = new Array(DynamicPricingEngine.HOURS_IN_DAY);
        for (let h = 0; h < DynamicPricingEngine.HOURS_IN_DAY; h++) {
            const H_h = H[h];
            // Relative‐occupancy factor Oₕ
            const O_h = H_avg > 0 ? H_h / H_avg : 1;
            // Clamp to avoid extreme multipliers
            O_prime[h] = Math.min(Math.max(O_h, O_min), O_max);

            const CA_h = currentAvail[h];
            // Current availability ratio: Aₕ = Cᴬₕ / TC
            const A_h = CA_h / TC;
            // Availability‐based multiplier: Aₕ' = 1 + α × (1 - Aₕ)
            A_prime[h] = 1 + alpha * (1 - A_h);
        }

        // 7) Compute ΔEₕ = |Hₕ - H_{h-1}| for h=0..23. For h=0, compare to h=23 (wrap-around).
        const deltaE: number[] = new Array(DynamicPricingEngine.HOURS_IN_DAY);
        for (let h = 0; h < DynamicPricingEngine.HOURS_IN_DAY; h++) {
            const prevIndex = h === 0 ? DynamicPricingEngine.HOURS_IN_DAY - 1 : h - 1;
            deltaE[h] = Math.abs(H[h] - H[prevIndex]);
        }

        // 8) Compute profit-maximizing price Pₕ^(profit) and satisfaction-maximizing price Pₕ^(satis)
        //    Then combine them: Pₕ = w × Pₕ^(profit) + (1 - w) × Pₕ^(satis), then clamp to [P_min, P_max].
        const hourlyPrices: number[] = new Array(DynamicPricingEngine.HOURS_IN_DAY);
        for (let h = 0; h < DynamicPricingEngine.HOURS_IN_DAY; h++) {
            // Profit‐maximizing: Pₕ^(profit) = P_b × Oₕ' × Aₕ'
            const P_h_profit = P_b * O_prime[h] * A_prime[h];

            // Satisfaction‐maximizing:
            //   Pₕ^(satis) = P_b × [1 - β × |Oₕ' - 1| - δEₕ]
            const occupancyDeviation = Math.abs(O_prime[h] - 1);
            const P_h_satis = P_b * (1 - beta * occupancyDeviation - deltaE[h]);

            // Combine with weight w:
            const combined = w * P_h_profit + (1 - w) * P_h_satis;

            // Finally clamp to [P_min, P_max]
            const P_h = Math.min(Math.max(combined, P_min), P_max);
            hourlyPrices[h] = P_h;
        }

        return hourlyPrices;
    }

    /**
     * Computes the total booking price from startHour to endHour (exclusive of endHour).
     *
     * @param startHour - Integer in [0, 23], representing “Hour 0” as current hour.
     * @param endHour - Integer in [startHour+1, 24], representing the hour index to stop (non-inclusive).
     *                   For example, if a driver books from “Hour 2” to “Hour 5”, we sum prices at indices 2, 3, 4.
     * @param valetRequested - If true, adds the fixed valet fee Pᵥ to the total.
     * @returns Total price as a number.
     *
     * @throws Error if indices are invalid or endHour ≤ startHour.
     */
    public computeTotalPrice(
        startHour: number,
        endHour: number,
        valetRequested: boolean
    ): number {
        if (
            startHour < 0 ||
            endHour > DynamicPricingEngine.HOURS_IN_DAY ||
            startHour >= endHour
        ) {
            throw new Error("Invalid startHour/endHour. Must satisfy 0 ≤ start < end ≤ 24.");
        }

        const hourlyPrices = this.computeHourlyPrices();
        let total = 0;
        // Sum prices for hours h ∈ {startHour, startHour+1, …, endHour - 1}
        for (let h = startHour; h < endHour; h++) {
            total += hourlyPrices[h];
        }

        // Add valet fee if requested
        if (valetRequested) {
            total += this.costConfig.valetPrice;
        }

        return total;
    }
}
