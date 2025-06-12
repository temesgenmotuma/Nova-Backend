// @ts-nocheck
// Disabling TypeScript checks for simplicity in this self-contained test file,
// as we are manually mocking external dependencies like Prisma.

// --- Original Interfaces and Classes (from your provided code) ---

/**
 * PrismaClient import is commented out as we are providing a mock for testing purposes.
 * import { PrismaClient } from '@prisma/client';
 * const prisma = new PrismaClient();
 */

export interface CostConfig {
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
export interface CapacityProvider {
  /** Total capacity of the lot (Tᴄ) */
  getTotalCapacity(): Promise<number>;
  /** Number of days in the current month (D) */
  getDaysInMonth(): Promise<number>;
  /**
   * Historical availability array (Hᴬₕ), length = 24.
   * Hᴬₕ[h] = number of available spots at historical hour h (0 ≤ h ≤ 23).
   */
  getHistoricalAvailability(): Promise<number[]>;
  /**
   * Current availability array (Cᴬₕ), length = 24.
   * Cᴬₕ[h] = number of currently available spots for future hour h (0 ≤ h ≤ 23),
   * relative to “hour 0” being the current hour.
   */
  getCurrentAvailability(): Promise<number[]>;
}

/**
 * Tunable parameters for the dynamic pricing algorithm.
 */
export interface ParameterConfig {
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

export class ConstParameterConfig implements ParameterConfig {
  readonly occupancyClampMin: number = 0.5;
  readonly occupancyClampMax: number = 1.5;
  readonly alpha: number = 0.2;
  readonly beta: number = 0.1;
  readonly weight: number = 0.5;
}

// --- Mock Prisma Client for Testing ---
// This mock simulates the behavior of PrismaClient for our tests.
class MockPrismaClient {
  public lot: any;
  public spot: any;
  public pricing: any;
  public cost: any;
  public $queryRaw: any;

  private _mockLotFindUniqueResult: any = null;
  private _mockSpotFindManyResult: any = null;
  private _mockQueryRawResult: any = null;
  private _mockPricingFindUniqueResult: any = null;
  private _mockCostFindFirstResult: any = null;

  constructor() {
    this.lot = {
      findUnique: ({ where }: { where: { id: string } }) => Promise.resolve(this._mockLotFindUniqueResult),
    };
    this.spot = {
      findMany: ({ where }: { where: { zone: { lotId: string } } }) => Promise.resolve(this._mockSpotFindManyResult),
    };
    this.$queryRaw = (query: TemplateStringsArray) => Promise.resolve(this._mockQueryRawResult);
    this.pricing = {
      findUnique: ({ where }: { where: { lotId: string } }) => Promise.resolve(this._mockPricingFindUniqueResult),
    };
    this.cost = {
      findFirst: ({ where }: { where: { lotId: string; year: number; month: number } }) => Promise.resolve(this._mockCostFindFirstResult),
    };
  }

  // Helper methods to configure mock results for each test
  setMockLotFindUniqueResult(result: any) { this._mockLotFindUniqueResult = result; }
  setMockSpotFindManyResult(result: any) { this._mockSpotFindManyResult = result; }
  setMockQueryRawResult(result: any) { this._mockQueryRawResult = result; }
  setMockPricingFindUniqueResult(result: any) { this._mockPricingFindUniqueResult = result; }
  setMockCostFindFirstResult(result: any) { this._mockCostFindFirstResult = result; }

  // Resets all mock results to null
  resetMocks() {
    this._mockLotFindUniqueResult = null;
    this._mockSpotFindManyResult = null;
    this._mockQueryRawResult = null;
    this._mockPricingFindUniqueResult = null;
    this._mockCostFindFirstResult = null;
  }
}

// Create a global mock instance of PrismaClient.
// This `prisma` variable will be used by `PrismaCapacityProvider` and `DatabaseCostConfigProvider`.
let prisma: MockPrismaClient = new MockPrismaClient();


export class PrismaCapacityProvider implements CapacityProvider {
  private readonly lotId: string;

  constructor(lotId: string) {
    this.lotId = lotId;
  }

  async getTotalCapacity(): Promise<number> {
    const lot = await prisma.lot.findUnique({
      where: { id: this.lotId },
      select: { capacity: true },
    });
    if (!lot) {
      throw new Error(`Lot with ID ${this.lotId} not found.`);
    }
    return lot.capacity;
  }

  async getDaysInMonth(): Promise<number> {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  async getHistoricalAvailability(): Promise<number[]> {
    const spots = await prisma.spot.findMany({
      where: {
        zone: { lotId: this.lotId },
      },
      select: { id: true },
    });

    const spotIds = spots.map((spot: { id: any; }) => spot.id);

    // Simulate historical availability (e.g., average availability per hour)
    const historicalData = await prisma.$queryRaw<{ hour: number; avg_availability: number }[]>`
            SELECT hour, AVG(available_spots) AS avg_availability
            FROM (
                SELECT
                    EXTRACT(HOUR FROM "createdAt") AS hour,
                    COUNT(*) FILTER (WHERE status = 'Available') AS available_spots
                FROM "Spot"
                WHERE id = ANY(${spotIds})
                GROUP BY EXTRACT(HOUR FROM "createdAt")
            ) subquery
            GROUP BY hour
            ORDER BY hour;
        `;

    const availability = new Array(24).fill(0);
    historicalData.forEach((row: { hour: number; avg_availability: number }) => {
      availability[row.hour] = row.avg_availability;
    });

    return availability;
  }

  async getCurrentAvailability(): Promise<number[]> {
    const spots = await prisma.spot.findMany({
      where: { zone: { lotId: this.lotId } },
      select: { id: true, status: true },
    });

    const availability = new Array(24).fill(0);
    spots.forEach((spot: { status: string; }) => {
      if (spot.status === 'Available') {
        availability[0]++; // Assume current availability is for hour 0
      }
    });

    return availability;
  }
}

export class DatabaseCostConfigProvider {
  private readonly lotId: string;

  constructor(lotId: string) {
    this.lotId = lotId;
  }

  async getCostConfig(): Promise<CostConfig> {
    const pricing = await prisma.pricing.findUnique({
      where: { lotId: this.lotId },
      select: { maxPrice: true, minPrice: true, valetPrice: true },
    });

    if (!pricing) {
      throw new Error(`Pricing configuration for lot ID ${this.lotId} not found.`);
    }

    const today = new Date();
    const cost = await prisma.cost.findFirst({
      where: {
        lotId: this.lotId,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
      },
      select: { amount: true, margin: true },
    });

    if (!cost) {
      throw new new Error(`Cost configuration for lot ID ${this.lotId} not found.`);
    }

    return {
      totalMonthlyCost: Number(cost.amount),
      targetProfitMargin: Number(cost.margin),
      minPrice: Number(pricing.minPrice),
      maxPrice: Number(pricing.maxPrice),
      valetPrice: Number(pricing.valetPrice),
    };
  }
}

/**
 * Main engine that computes dynamic prices per hour and total booking price.
 */
export class DynamicPricingEngine {
  private readonly costConfig: CostConfig;
  private readonly capacityProvider: CapacityProvider;
  private readonly params: ParameterConfig;

  /**
   * Number of hours in a day; used for array lengths.
   */
  private static readonly HOURS_IN_DAY = 24;

  constructor(
      costConfig: CostConfig,
      capacityProvider: CapacityProvider,
      params: ParameterConfig
  ) {
    this.costConfig = costConfig;
    this.capacityProvider = capacityProvider;
    this.params = params;
  }

  /**
   * Computes the array of hourly prices (Pₕ) for the next 24 hours.
   * Returns an array ‘prices’ of length 24, where prices[h] is Pₕ for hour h (0 ≤ h ≤ 23).
   */
  public async computeHourlyPrices(): Promise<number[]> {
    const { totalMonthlyCost: C_m, targetProfitMargin: M, minPrice: P_min, maxPrice: P_max } =
        this.costConfig;
    const TC = await this.capacityProvider.getTotalCapacity();
    const D = await this.capacityProvider.getDaysInMonth();
    const historicalAvail = await this.capacityProvider.getHistoricalAvailability();
    const currentAvail = await this.capacityProvider.getCurrentAvailability();
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
      //    Pₕ^(satis) = P_b × [1 - β × |Oₕ' - 1| - δEₕ]
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
   * For example, if a driver books from “Hour 2” to “Hour 5”, we sum prices at indices 2, 3, 4.
   * @returns Total price as a number.
   *
   * @throws Error if indices are invalid or endHour ≤ startHour.
   */
  public async computeParkingAndValetPrices(
      startHour: number,
      endHour: number,
  ) {
    if (
        startHour < 0 ||
        endHour > DynamicPricingEngine.HOURS_IN_DAY ||
        startHour >= endHour
    ) {
      throw new Error("Invalid startHour/endHour. Must satisfy 0 ≤ start < end ≤ 24.");
    }

    const hourlyPrices = await this.computeHourlyPrices();
    let subtotal = 0;
    // Sum prices for hours h ∈ {startHour, startHour+1, …, endHour - 1}
    for (let h = startHour; h < endHour; h++) {
      subtotal += hourlyPrices[h];
    }

    const fixedValetPrice = this.costConfig.valetPrice;

    return {
      subtotalParkingPrice: subtotal,
      fixedValetPrice: fixedValetPrice
    };
  }
}


// --- Mock Implementations for CapacityProvider ---
class MockCapacityProvider implements CapacityProvider {
  private _totalCapacity: number;
  private _daysInMonth: number;
  private _historicalAvailability: number[];
  private _currentAvailability: number[];

  constructor(
      totalCapacity: number,
      daysInMonth: number,
      historicalAvailability: number[],
      currentAvailability: number[]
  ) {
    this._totalCapacity = totalCapacity;
    this._daysInMonth = daysInMonth;
    this._historicalAvailability = historicalAvailability;
    this._currentAvailability = currentAvailability;
  }

  async getTotalCapacity(): Promise<number> { return this._totalCapacity; }
  async getDaysInMonth(): Promise<number> { return this._daysInMonth; }
  async getHistoricalAvailability(): Promise<number[]> { return this._historicalAvailability; }
  async getCurrentAvailability(): Promise<number[]> { return this._currentAvailability; }
}


// --- Test Runner Utility ---
async function runTest(testName: string, testFunction: () => Promise<void>) {
  console.log(`\n--- Test Case: ${testName} ---`);
  try {
    await testFunction();
    console.log(`Status: Test execution completed. Please check the 'Actual result' against 'Expected result' and fill 'Pass/Fail'.`);
  } catch (error: any) {
    console.log(`Status: Test execution failed with an error.`);
    console.error(`Error: ${error.message}`);
  }
  console.log(`--- End of Test Case: ${testName} ---\n`);
}

// --- Test Cases Implementation ---

// Test Case 1: Compute Hourly Prices - Basic Scenario with Average Occupancy
async function testComputeHourlyPricesBasic() {
  const costConfig: CostConfig = {
    totalMonthlyCost: 10000,
    targetProfitMargin: 0.2,
    minPrice: 1,
    maxPrice: 10,
    valetPrice: 5,
  };
  const TC = 100;
  const D = 30;
  const historicalAvail = new Array(24).fill(50); // 50 available spots consistently
  const currentAvail = new Array(24).fill(50);   // 50 available spots consistently

  const capacityProvider = new MockCapacityProvider(TC, D, historicalAvail, currentAvail);
  const params = new ConstParameterConfig(); // Default parameters

  const engine = new DynamicPricingEngine(costConfig, capacityProvider, params);

  // Expected calculations:
  const H_h = (TC - 50) / TC; // 0.5
  const H_avg = H_h; // 0.5
  const R_m = (1 + costConfig.targetProfitMargin) * costConfig.totalMonthlyCost; // 1.2 * 10000 = 12000
  const E_occ = H_avg * TC * D * DynamicPricingEngine.HOURS_IN_DAY; // 0.5 * 100 * 30 * 24 = 36000
  const P_b = R_m / E_occ; // 12000 / 36000 = 0.3333...

  const O_h_prime = 1; // H_h / H_avg = 1, clamped to [0.5, 1.5]
  const A_h = currentAvail[0] / TC; // 50 / 100 = 0.5
  const A_h_prime = 1 + params.alpha * (1 - A_h); // 1 + 0.2 * (1 - 0.5) = 1 + 0.1 = 1.1

  const P_h_profit = P_b * O_h_prime * A_h_prime; // 0.3333... * 1 * 1.1 = 0.3666...
  const occupancyDeviation = Math.abs(O_h_prime - 1); // 0
  const deltaE = 0; // H_h is constant

  const P_h_satis = P_b * (1 - params.beta * occupancyDeviation - deltaE); // 0.3333... * (1 - 0 - 0) = 0.3333...
  const combined = params.weight * P_h_profit + (1 - params.weight) * P_h_satis; // 0.5 * 0.3666... + 0.5 * 0.3333... = 0.1833... + 0.1666... = 0.35

  const expectedHourlyPrice = Math.min(Math.max(combined, costConfig.minPrice), costConfig.maxPrice); // Math.min(Math.max(0.35, 1), 10) = 1

  const expectedResult = new Array(24).fill(expectedHourlyPrice);

  console.log(`Expected result: ${JSON.stringify(expectedResult.map(p => parseFloat(p.toFixed(2))))}`);
  const actualResult = await engine.computeHourlyPrices();
  console.log(`Actual result:   ${JSON.stringify(actualResult.map(p => parseFloat(p.toFixed(2))))}`);
}

// Test Case 2: Compute Hourly Prices - High Occupancy Impact
async function testComputeHourlyPricesHighOccupancy() {
  const costConfig: CostConfig = {
    totalMonthlyCost: 10000,
    targetProfitMargin: 0.2,
    minPrice: 2,
    maxPrice: 10,
    valetPrice: 5,
  };
  const TC = 100;
  const D = 30;
  const historicalAvail = new Array(24).fill(0.6); // High occupancy (10 available)
  const currentAvail = new Array(24).fill(0.2);   // High occupancy (10 available)

  const capacityProvider = new MockCapacityProvider(TC, D, historicalAvail, currentAvail);
  const params = new ConstParameterConfig();

  const engine = new DynamicPricingEngine(costConfig, capacityProvider, params);

  // Expected calculations:
  const H_h = (TC - 10) / TC; // 0.9
  const H_avg = H_h; // 0.9
  const R_m = (1 + costConfig.targetProfitMargin) * costConfig.totalMonthlyCost; // 1.2 * 10000 = 12000
  const E_occ = H_avg * TC * D * DynamicPricingEngine.HOURS_IN_DAY; // 0.9 * 100 * 30 * 24 = 64800
  const P_b = R_m / E_occ; // 12000 / 64800 = 0.185185...

  const O_h_prime = 1; // H_h / H_avg = 1, clamped
  const A_h = currentAvail[0] / TC; // 10 / 100 = 0.1
  const A_h_prime = 1 + params.alpha * (1 - A_h); // 1 + 0.2 * (1 - 0.1) = 1 + 0.18 = 1.18

  const P_h_profit = P_b * O_h_prime * A_h_prime; // 0.185185... * 1 * 1.18 = 0.2185...
  const occupancyDeviation = Math.abs(O_h_prime - 1); // 0
  const deltaE = 0; // H_h is constant

  const P_h_satis = P_b * (1 - params.beta * occupancyDeviation - deltaE); // 0.185185... * (1 - 0 - 0) = 0.185185...
  const combined = params.weight * P_h_profit + (1 - params.weight) * P_h_satis; // 0.5 * 0.2185... + 0.5 * 0.185185... = 0.10925 + 0.09259 = 0.20184...

  const expectedHourlyPrice = Math.min(Math.max(combined, costConfig.minPrice), costConfig.maxPrice); // Math.min(Math.max(0.20184, 1), 10) = 1

  const expectedResult = new Array(24).fill(expectedHourlyPrice);

  console.log(`Expected result: ${JSON.stringify(expectedResult.map(p => parseFloat(p.toFixed(2))))}`);
  const actualResult = await engine.computeHourlyPrices();
  console.log(`Actual result:   ${JSON.stringify(actualResult.map(p => parseFloat(p.toFixed(2))))}`);
}

// Test Case 3: Compute Hourly Prices - Low Occupancy Impact
async function testComputeHourlyPricesLowOccupancy() {
  const costConfig: CostConfig = {
    totalMonthlyCost: 10000,
    targetProfitMargin: 0.2,
    minPrice: 1,
    maxPrice: 10,
    valetPrice: 5,
  };
  const TC = 100;
  const D = 30;
  const historicalAvail = new Array(24).fill(90); // Low occupancy (90 available)
  const currentAvail = new Array(24).fill(90);   // Low occupancy (90 available)

  const capacityProvider = new MockCapacityProvider(TC, D, historicalAvail, currentAvail);
  const params = new ConstParameterConfig();

  const engine = new DynamicPricingEngine(costConfig, capacityProvider, params);

  // Expected calculations:
  const H_h = (TC - 90) / TC; // 0.1
  const H_avg = H_h; // 0.1
  const R_m = (1 + costConfig.targetProfitMargin) * costConfig.totalMonthlyCost; // 1.2 * 10000 = 12000
  const E_occ = H_avg * TC * D * DynamicPricingEngine.HOURS_IN_DAY; // 0.1 * 100 * 30 * 24 = 7200
  const P_b = R_m / E_occ; // 12000 / 7200 = 1.6666...

  const O_h_prime = 1; // H_h / H_avg = 1, clamped
  const A_h = currentAvail[0] / TC; // 90 / 100 = 0.9
  const A_h_prime = 1 + params.alpha * (1 - A_h); // 1 + 0.2 * (1 - 0.9) = 1 + 0.02 = 1.02

  const P_h_profit = P_b * O_h_prime * A_h_prime; // 1.6666... * 1 * 1.02 = 1.7
  const occupancyDeviation = Math.abs(O_h_prime - 1); // 0
  const deltaE = 0; // H_h is constant

  const P_h_satis = P_b * (1 - params.beta * occupancyDeviation - deltaE); // 1.6666... * (1 - 0 - 0) = 1.6666...
  const combined = params.weight * P_h_profit + (1 - params.weight) * P_h_satis; // 0.5 * 1.7 + 0.5 * 1.6666... = 0.85 + 0.8333... = 1.6833...

  const expectedHourlyPrice = Math.min(Math.max(combined, costConfig.minPrice), costConfig.maxPrice); // Math.min(Math.max(1.6833..., 1), 10) = 1.6833...

  const expectedResult = new Array(24).fill(expectedHourlyPrice);

  console.log(`Expected result: ${JSON.stringify(expectedResult.map(p => parseFloat(p.toFixed(2))))}`);
  const actualResult = await engine.computeHourlyPrices();
  console.log(`Actual result:   ${JSON.stringify(actualResult.map(p => parseFloat(p.toFixed(2))))}`);
}

// Test Case 4: Compute Parking and Valet Prices - Valid Range
async function testComputeParkingAndValetPricesValidRange() {
  const startHour = 2;
  const endHour = 5;

  const costConfig: CostConfig = {
    totalMonthlyCost: 0, targetProfitMargin: 0, minPrice: 0, maxPrice: 0, // Not relevant for this test's specific calculation
    valetPrice: 5,
  };

  // Mock CapacityProvider to ensure computeHourlyPrices returns predictable values
  const mockHourlyPrices = new Array(24).fill(0);
  mockHourlyPrices[2] = 2; // Price for hour 2
  mockHourlyPrices[3] = 3; // Price for hour 3
  mockHourlyPrices[4] = 4; // Price for hour 4

  const capacityProvider = new MockCapacityProvider(100, 30, [], []); // Dummy values, as computeHourlyPrices is effectively mocked
  // Override computeHourlyPrices for this specific test
  class MockEngine extends DynamicPricingEngine {
    public async computeHourlyPrices(): Promise<number[]> {
      return Promise.resolve(mockHourlyPrices);
    }
  }

  const engine = new MockEngine(costConfig, capacityProvider, new ConstParameterConfig());

  const expectedSubtotal = 2 + 3 + 4; // Sum of prices for hours 2, 3, 4
  const expectedValetPrice = costConfig.valetPrice;
  const expectedResult = { subtotalParkingPrice: expectedSubtotal, fixedValetPrice: expectedValetPrice };

  console.log(`Expected result: ${JSON.stringify(expectedResult)}`);
  const actualResult = await engine.computeParkingAndValetPrices(startHour, endHour);
  console.log(`Actual result:   ${JSON.stringify(actualResult)}`);
}

// Test Case 5: Compute Parking and Valet Prices - Invalid Range (startHour >= endHour)
async function testComputeParkingAndValetPricesInvalidRangeEqual() {
  const startHour = 5;
  const endHour = 5;

  const costConfig: CostConfig = { totalMonthlyCost: 0, targetProfitMargin: 0, minPrice: 0, maxPrice: 0, valetPrice: 0 };
  const capacityProvider = new MockCapacityProvider(0, 0, [], []);
  const engine = new DynamicPricingEngine(costConfig, capacityProvider, new ConstParameterConfig());

  const expectedErrorMsg = "Invalid startHour/endHour. Must satisfy 0 ≤ start < end ≤ 24.";

  console.log(`Expected result: Throws Error "${expectedErrorMsg}"`);
  try {
    await engine.computeParkingAndValetPrices(startHour, endHour);
    console.log(`Actual result:   No error was thrown.`);
  } catch (error: any) {
    console.log(`Actual result:   Threw Error "${error.message}"`);
  }
}

// Test Case 6: Compute Parking and Valet Prices - Invalid Range (startHour < 0 or endHour > 24)
async function testComputeParkingAndValetPricesInvalidRangeOutOfBounds() {
  const startHour = -1;
  const endHour = 1;

  const costConfig: CostConfig = { totalMonthlyCost: 0, targetProfitMargin: 0, minPrice: 0, maxPrice: 0, valetPrice: 0 };
  const capacityProvider = new MockCapacityProvider(0, 0, [], []);
  const engine = new DynamicPricingEngine(costConfig, capacityProvider, new ConstParameterConfig());

  const expectedErrorMsg = "Invalid startHour/endHour. Must satisfy 0 ≤ start < end ≤ 24.";

  console.log(`Expected result: Throws Error "${expectedErrorMsg}"`);
  try {
    await engine.computeParkingAndValetPrices(startHour, endHour);
    console.log(`Actual result:   No error was thrown.`);
  } catch (error: any) {
    console.log(`Actual result:   Threw Error "${error.message}"`);
  }
}

// Test Case 7: PrismaCapacityProvider - Get Total Capacity
async function testPrismaCapacityProviderGetTotalCapacity() {
  const lotId = "testLot123";
  const expectedCapacity = 150;

  // Configure the mock Prisma client
  prisma.resetMocks(); // Ensure a clean state
  prisma.setMockLotFindUniqueResult({ id: lotId, capacity: expectedCapacity });

  const provider = new PrismaCapacityProvider(lotId);

  console.log(`Expected result: ${expectedCapacity}`);
  const actualResult = await provider.getTotalCapacity();
  console.log(`Actual result:   ${actualResult}`);
}

// Test Case 8: PrismaCapacityProvider - Get Days in Month
async function testPrismaCapacityProviderGetDaysInMonth() {
  // This test uses the actual Date object, so no Prisma mock needed.
  // We'll mock the global Date object to ensure consistent results for testing,
  // otherwise it depends on the current system date.
  const originalDate = Date;
  // Mock Date to be June 12, 2025
  global.Date = class extends originalDate {
    constructor(dateString?: string) {
      if (dateString) {
        return new originalDate(dateString);
      }
      return new originalDate('2025-06-12T10:00:00Z');
    }
  } as DateConstructor;


  const provider = new PrismaCapacityProvider("anyLotId"); // lotId doesn't affect this method
  const expectedDays = 30; // June 2025 has 30 days

  console.log(`Expected result: ${expectedDays}`);
  const actualResult = await provider.getDaysInMonth();
  console.log(`Actual result:   ${actualResult}`);

  // Restore original Date object after the test
  global.Date = originalDate;
}

// --- Run All Tests ---
async function runAllTests() {
  await runTest("Compute Hourly Prices - Basic Scenario", testComputeHourlyPricesBasic);
  await runTest("Compute Hourly Prices - High Occupancy Impact", testComputeHourlyPricesHighOccupancy);
  await runTest("Compute Hourly Prices - Low Occupancy Impact", testComputeHourlyPricesLowOccupancy);
  await runTest("Compute Parking and Valet Prices - Valid Range", testComputeParkingAndValetPricesValidRange);
  await runTest("Compute Parking and Valet Prices - Invalid Range (startHour >= endHour)", testComputeParkingAndValetPricesInvalidRangeEqual);
  await runTest("Compute Parking and Valet Prices - Invalid Range (startHour < 0 or endHour > 24)", testComputeParkingAndValetPricesInvalidRangeOutOfBounds);
  await runTest("PrismaCapacityProvider - Get Total Capacity", testPrismaCapacityProviderGetTotalCapacity);
  await runTest("PrismaCapacityProvider - Get Days in Month", testPrismaCapacityProviderGetDaysInMonth);

  console.log("\nAll tests completed. Please review the output for 'Actual result' and fill 'Pass/Fail' for each test case.");
}

runAllTests();
