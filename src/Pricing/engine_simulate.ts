// simulation.ts
import {
    CostConfig,
    CapacityProvider,
    ParameterConfig,
    DynamicPricingEngine,
} from './engine'; // Adjust the path as needed

import { createObjectCsvWriter } from 'csv-writer';

// --- Helper Functions for Realistic Data Generation ---

/**
 * Generates a random number within a given range.
 */
function getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Generates an array of 24 numbers representing historical availability with a daily pattern.
 * - Lower availability during typical "busy" hours (e.g., 9 AM - 5 PM).
 * - Higher availability during "off-peak" hours.
 * Introduces some randomness.
 */
function generateRealisticHistoricalAvailability(totalCapacity: number): number[] {
    const historical = new Array(24).fill(0);
    const baseAvailable = totalCapacity * 0.8; // 80% available normally
    const peakHourAvailable = totalCapacity * 0.3; // 30% available during peak

    for (let h = 0; h < 24; h++) {
        if (h >= 8 && h <= 17) { // Peak hours: 8 AM to 5 PM
            historical[h] = Math.max(0, Math.floor(getRandomNumber(peakHourAvailable * 0.8, peakHourAvailable * 1.2)));
        } else if (h >= 0 && h < 6) { // Early morning/Late night
            historical[h] = Math.max(0, Math.floor(getRandomNumber(baseAvailable * 0.9, totalCapacity * 0.95)));
        } else { // Shoulder hours
            historical[h] = Math.max(0, Math.floor(getRandomNumber(baseAvailable * 0.7, baseAvailable * 1.1)));
        }
        // Ensure availability doesn't exceed total capacity
        historical[h] = Math.min(historical[h], totalCapacity);
    }
    return historical;
}

/**
 * Generates current availability based on historical, but with more real-time fluctuations.
 * Simulates current conditions being generally similar to historical but with immediate changes.
 */
function generateRealisticCurrentAvailability(
    totalCapacity: number,
    historicalAvailability: number[]
): number[] {
    const current = new Array(24).fill(0);
    const fluctuationFactor = 0.15; // Current availability can deviate by +/- 15% from historical

    // For simplicity, let's assume 'hour 0' of current availability is a more accurate reflection of the very next few hours.
    // The problem statement says Cᴬₕ[h] = number of currently available spots for future hour h (0 ≤ h ≤ 23),
    // relative to “hour 0” being the current hour. So, we'll try to make Cᴬ₀ very dynamic.
    const currentHourActualAvailability = Math.max(0, Math.floor(getRandomNumber(totalCapacity * 0.1, totalCapacity * 0.9))); // Very random for the current moment

    for (let h = 0; h < 24; h++) {
        let base = historicalAvailability[h];
        if (h === 0) { // Current hour (hour 0 in Cᴬₕ) is more volatile
            current[h] = currentHourActualAvailability;
        } else {
            // Fluctuate around historical for future hours
            current[h] = Math.max(0, Math.floor(
                base * (1 + getRandomNumber(-fluctuationFactor, fluctuationFactor))
            ));
        }
        // Ensure availability doesn't exceed total capacity
        current[h] = Math.min(current[h], totalCapacity);
    }
    return current;
}

// --- Simulation Implementations of Interfaces (NO DATABASE) ---

class MockCostConfig implements CostConfig {
    constructor(
        public totalMonthlyCost: number,
        public targetProfitMargin: number,
        public minPrice: number,
        public maxPrice: number,
        public valetPrice: number
    ) {}
}

class MockCapacityProvider implements CapacityProvider {
    constructor(
        private totalCapacity: number,
        private daysInMonth: number,
        private historicalAvailability: number[],
        private currentAvailability: number[]
    ) {
        if (historicalAvailability.length !== 24 || currentAvailability.length !== 24) {
            throw new Error('Availability arrays must be of length 24.');
        }
    }

    async getTotalCapacity(): Promise<number> {
        return this.totalCapacity;
    }

    async getDaysInMonth(): Promise<number> {
        return this.daysInMonth;
    }

    async getHistoricalAvailability(): Promise<number[]> {
        return this.historicalAvailability;
    }

    async getCurrentAvailability(): Promise<number[]> {
        return this.currentAvailability;
    }
}

class MockParameterConfig implements ParameterConfig {
    constructor(
        public occupancyClampMin: number,
        public occupancyClampMax: number,
        public alpha: number,
        public beta: number,
        public weight: number
    ) {}
}

// --- Simulation Logic ---

async function runSimulation(
    baseCostConfig: {
        totalMonthlyCost: number;
        targetProfitMargin: number;
        minPrice: number;
        maxPrice: number;
        valetPrice: number;
    },
    baseCapacity: {
        totalCapacity: number;
        daysInMonth: number;
    },
    parameterConfig: ParameterConfig, // Assuming these remain constant for the simulation
    simulationRuns: number,
    outputFileName: string = 'pricing_simulation_realistic.csv'
) {
    const csvWriter = createObjectCsvWriter({
        path: outputFileName,
        header: [
            { id: 'run', title: 'Simulation Run' },
            { id: 'totalMonthlyCost', title: 'Total Monthly Cost' },
            { id: 'targetProfitMargin', title: 'Target Profit Margin' },
            { id: 'minPrice', title: 'Min Price' },
            { id: 'maxPrice', title: 'Max Price' },
            { id: 'valetPrice', title: 'Valet Price' },
            { id: 'totalCapacity', title: 'Total Capacity' },
            { id: 'daysInMonth', title: 'Days In Month' },
            { id: 'occupancyClampMin', title: 'Occupancy Clamp Min' },
            { id: 'occupancyClampMax', title: 'Occupancy Clamp Max' },
            { id: 'alpha', title: 'Alpha' },
            { id: 'beta', title: 'Beta' },
            { id: 'weight', title: 'Weight' },
            ...Array.from({ length: 24 }, (_, i) => ({ id: `historical_h${i}`, title: `Historical Avail Hour ${i}` })),
            ...Array.from({ length: 24 }, (_, i) => ({ id: `current_h${i}`, title: `Current Avail Hour ${i}` })),
            ...Array.from({ length: 24 }, (_, i) => ({ id: `price_h${i}`, title: `Price Hour ${i}` })),
            { id: 'exampleBookingStartHour', title: 'Example Booking Start Hour' },
            { id: 'exampleBookingEndHour', title: 'Example Booking End Hour' },
            { id: 'exampleBookingValet', title: 'Example Booking Valet' },
            { id: 'exampleTotalPrice', title: 'Example Total Price' },
        ],
    });

    const records: any[] = [];

    for (let i = 0; i < simulationRuns; i++) {
        // 1. Vary CostConfig slightly
        const currentCostConfig = new MockCostConfig(
            baseCostConfig.totalMonthlyCost * getRandomNumber(0.98, 1.02), // +/- 2%
            baseCostConfig.targetProfitMargin * getRandomNumber(0.95, 1.05), // +/- 5%
            baseCostConfig.minPrice,
            baseCostConfig.maxPrice,
            baseCostConfig.valetPrice
        );

        // 2. Generate dynamic CapacityProvider data
        const currentTotalCapacity = baseCapacity.totalCapacity; // Keep total capacity stable for a single lot
        const currentDaysInMonth = baseCapacity.daysInMonth; // Or calculate based on a simulated month
        const historicalAvailability = generateRealisticHistoricalAvailability(currentTotalCapacity);
        const currentAvailability = generateRealisticCurrentAvailability(currentTotalCapacity, historicalAvailability);

        const currentCapacityProvider = new MockCapacityProvider(
            currentTotalCapacity,
            currentDaysInMonth,
            historicalAvailability,
            currentAvailability
        );

        const engine = new DynamicPricingEngine(
            currentCostConfig,
            currentCapacityProvider,
            parameterConfig
        );

        const hourlyPrices = await engine.computeHourlyPrices();

        // Example booking for demonstration (vary start/end hour)
        const exampleBookingStartHour = Math.floor(getRandomNumber(0, 22)); // 0 to 21
        const exampleBookingEndHour = Math.min(24, exampleBookingStartHour + Math.ceil(getRandomNumber(1, 6))); // 1 to 6 hours duration
        const exampleBookingValet = Math.random() > 0.6; // 40% chance of valet service

        let exampleTotalPrice = 0;
        try {
            exampleTotalPrice = await engine.computeTotalPrice(
                exampleBookingStartHour,
                exampleBookingEndHour,
                exampleBookingValet
            );
        } catch (e: any) {
            console.error(`Error computing total price for run ${i + 1}: ${e.message}`);
            // Set to a sentinel value or handle error appropriately in CSV
            exampleTotalPrice = -1;
        }


        const record: any = {
            run: i + 1,
            totalMonthlyCost: currentCostConfig.totalMonthlyCost,
            targetProfitMargin: currentCostConfig.targetProfitMargin,
            minPrice: currentCostConfig.minPrice,
            maxPrice: currentCostConfig.maxPrice,
            valetPrice: currentCostConfig.valetPrice,
            totalCapacity: await currentCapacityProvider.getTotalCapacity(),
            daysInMonth: await currentCapacityProvider.getDaysInMonth(),
            occupancyClampMin: parameterConfig.occupancyClampMin,
            occupancyClampMax: parameterConfig.occupancyClampMax,
            alpha: parameterConfig.alpha,
            beta: parameterConfig.beta,
            weight: parameterConfig.weight,
        };

        historicalAvailability.forEach((avail, h) => {
            record[`historical_h${h}`] = avail;
        });
        currentAvailability.forEach((avail, h) => {
            record[`current_h${h}`] = avail;
        });
        hourlyPrices.forEach((price, h) => {
            record[`price_h${h}`] = price;
        });

        record.exampleBookingStartHour = exampleBookingStartHour;
        record.exampleBookingEndHour = exampleBookingEndHour;
        record.exampleBookingValet = exampleBookingValet;
        record.exampleTotalPrice = exampleTotalPrice;

        records.push(record);
    }

    await csvWriter.writeRecords(records);
    console.log(`Simulation complete. Data written to ${outputFileName}`);
}

// --- Example Usage ---

async function main() {
    // Base values for your lot
    const baseCostConfig = {
        totalMonthlyCost: 100000, // Base monthly cost
        targetProfitMargin: 0.2, // Base profit margin (20%)
        minPrice: 5,             // Min price per spot-hour
        maxPrice: 50,            // Max price per spot-hour
        valetPrice: 10,          // Fixed valet fee
    };

    const baseCapacity = {
        totalCapacity: 100, // Total spots in the lot
        daysInMonth: 30,    // Average days in month for calculations (you could make this dynamic for each run if needed)
    };

    // Parameter config (assuming these are mostly fixed for the lot)
    const parameterConfig = new MockParameterConfig(
        0.5, // occupancyClampMin
        1.5, // occupancyClampMax
        0.2, // alpha
        0.1, // beta
        0.5  // weight (50% profit, 50% satisfaction)
    );

    const simulationRuns = 50; // More runs to see trends

    console.log("Starting realistic pricing simulation...");
    await runSimulation(baseCostConfig, baseCapacity, parameterConfig, simulationRuns);
}

main().catch(console.error);