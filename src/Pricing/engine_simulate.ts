// simulation.ts
import {
    CostConfig,
    CapacityProvider,
    ParameterConfig,
    DynamicPricingEngine,
} from './engine'; // Adjust the path as needed

import { createObjectCsvWriter } from 'csv-writer';

// --- Mock Implementations (No Database Access) ---

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

// --- Demo Scenario Functions ---

async function runDemoScenario(
    scenarioName: string,
    costConfig: CostConfig,
    capacityProvider: CapacityProvider,
    parameterConfig: ParameterConfig,
    csvWriter: ReturnType<typeof createObjectCsvWriter>
) {
    const engine = new DynamicPricingEngine(costConfig, capacityProvider, parameterConfig);

    console.log(`\n--- Running Scenario: ${scenarioName} ---`);

    const hourlyPrices = await engine.computeHourlyPrices();

    console.log(`Hourly Prices (Pₕ) for ${scenarioName}:`);
    let priceOutput = '';
    for (let h = 0; h < 24; h++) {
        priceOutput += `Hour ${h.toString().padStart(2, '0')}: $${hourlyPrices[h].toFixed(2)} | `;
        if ((h + 1) % 6 === 0) { // Format for readability, break every 6 hours
            console.log(priceOutput);
            priceOutput = '';
        }
    }
    if (priceOutput) console.log(priceOutput); // Print any remaining

    // Example Booking 1: Off-peak hours
    const offPeakStart = 2; // 2 AM
    const offPeakEnd = 6;   // 6 AM
    const offPeakValet = false;
    const offPeakPrice = await engine.computeTotalPrice(offPeakStart, offPeakEnd, offPeakValet);
    console.log(`\nExample Booking (Off-peak: ${offPeakStart}:00 - ${offPeakEnd}:00, Valet: ${offPeakValet ? 'Yes' : 'No'}): $${offPeakPrice.toFixed(2)}`);

    // Example Booking 2: Peak hours
    const peakStart = 9;  // 9 AM
    const peakEnd = 13;   // 1 PM
    const peakValet = true;
    const peakPrice = await engine.computeTotalPrice(peakStart, peakEnd, peakValet);
    console.log(`Example Booking (Peak: ${peakStart}:00 - ${peakEnd}:00, Valet: ${peakValet ? 'Yes' : 'No'}): $${peakPrice.toFixed(2)}`);

    // Prepare record for CSV
    const historicalAvail = await capacityProvider.getHistoricalAvailability();
    const currentAvail = await capacityProvider.getCurrentAvailability();

    const record: any = {
        run: scenarioName, // Use scenario name as run identifier in CSV
        totalMonthlyCost: costConfig.totalMonthlyCost,
        targetProfitMargin: costConfig.targetProfitMargin,
        minPrice: costConfig.minPrice,
        maxPrice: costConfig.maxPrice,
        valetPrice: costConfig.valetPrice,
        totalCapacity: await capacityProvider.getTotalCapacity(),
        daysInMonth: await capacityProvider.getDaysInMonth(),
        occupancyClampMin: parameterConfig.occupancyClampMin,
        occupancyClampMax: parameterConfig.occupancyClampMax,
        alpha: parameterConfig.alpha,
        beta: parameterConfig.beta,
        weight: parameterConfig.weight,
    };

    historicalAvail.forEach((avail, h) => {
        record[`historical_h${h}`] = avail;
    });
    currentAvail.forEach((avail, h) => {
        record[`current_h${h}`] = avail;
    });
    hourlyPrices.forEach((price, h) => {
        record[`price_h${h}`] = price;
    });

    record.exampleBookingStartHour_offPeak = offPeakStart;
    record.exampleBookingEndHour_offPeak = offPeakEnd;
    record.exampleBookingValet_offPeak = offPeakValet;
    record.exampleTotalPrice_offPeak = offPeakPrice;
    record.exampleBookingStartHour_peak = peakStart;
    record.exampleBookingEndHour_peak = peakEnd;
    record.exampleBookingValet_peak = peakValet;
    record.exampleTotalPrice_peak = peakPrice;

    return record;
}

// --- Main Demo Logic ---

async function main() {
    const TOTAL_CAPACITY = 100;
    const DAYS_IN_MONTH = new Date(2025, 6, 0).getDate(); // Get days in current month (July 2025 for demo)

    // --- Fixed Cost Configuration for the Demo ---
    const fixedCostConfig = new MockCostConfig(
        100000, // totalMonthlyCost (e.g., $100,000)
        0.25,   // targetProfitMargin (25%)
        5,      // minPrice ($5/spot-hour)
        60,     // maxPrice ($60/spot-hour) - Increased for more dramatic range
        15      // valetPrice ($15) - Increased for noticeable impact
    );

    // --- Tuned Parameters for Visible Differences ---
    const tunedParameterConfig = new MockParameterConfig(
        0.5, // occupancyClampMin
        1.5, // occupancyClampMax
        0.4, // alpha (Increased from 0.2 to 0.4: low availability raises price more aggressively)
        0.05, // beta (Decreased from 0.1 to 0.05: less smoothing, allowing sharper changes)
        0.7  // weight (Increased from 0.5 to 0.7: slightly more emphasis on profit-maximizing)
    );

    // --- Historical Availability (Consistent Across Scenarios) ---
    // Simulates a typical day: lower availability during day, higher at night.
    const historicalAvailabilityPattern: number[] = new Array(24).fill(0);
    for (let h = 0; h < 24; h++) {
        if (h >= 8 && h <= 17) { // 8 AM to 5 PM (business hours)
            historicalAvailabilityPattern[h] = Math.floor(TOTAL_CAPACITY * 0.4); // 40% available (60% occupied historically)
        } else if (h >= 20 || h <= 6) { // 8 PM to 6 AM (off-peak)
            historicalAvailabilityPattern[h] = Math.floor(TOTAL_CAPACITY * 0.8); // 80% available (20% occupied historically)
        } else { // Shoulder hours (7 AM, 6 PM, 18-19)
            historicalAvailabilityPattern[h] = Math.floor(TOTAL_CAPACITY * 0.6); // 60% available
        }
    }

    // --- CSV Writer Setup ---
    const csvWriter = createObjectCsvWriter({
        path: 'pricing_demo_results.csv',
        header: [
            { id: 'run', title: 'Scenario' },
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
            { id: 'exampleBookingStartHour_offPeak', title: 'Off-Peak Booking Start Hour' },
            { id: 'exampleBookingEndHour_offPeak', title: 'Off-Peak Booking End Hour' },
            { id: 'exampleBookingValet_offPeak', title: 'Off-Peak Booking Valet' },
            { id: 'exampleTotalPrice_offPeak', title: 'Off-Peak Total Price' },
            { id: 'exampleBookingStartHour_peak', title: 'Peak Booking Start Hour' },
            { id: 'exampleBookingEndHour_peak', title: 'Peak Booking End Hour' },
            { id: 'exampleBookingValet_peak', title: 'Peak Booking Valet' },
            { id: 'exampleTotalPrice_peak', title: 'Peak Total Price' },
        ],
    });

    const allRecords: any[] = [];

    // --- DEMO SCENARIO 1: TYPICAL DAY ---
    // Current availability closely mirrors historical patterns, with slight variations.
    const currentAvailabilityTypical = [...historicalAvailabilityPattern]; // Start with historical
    currentAvailabilityTypical[9] = Math.floor(TOTAL_CAPACITY * 0.35); // Slightly lower at 9 AM
    currentAvailabilityTypical[12] = Math.floor(TOTAL_CAPACITY * 0.38); // Slightly lower at 12 PM
    currentAvailabilityTypical[22] = Math.floor(TOTAL_CAPACITY * 0.75); // Slightly lower at 10 PM

    const capacityProviderTypical = new MockCapacityProvider(
        TOTAL_CAPACITY,
        DAYS_IN_MONTH,
        historicalAvailabilityPattern,
        currentAvailabilityTypical
    );
    const record1 = await runDemoScenario(
        "Scenario 1: Typical Day",
        fixedCostConfig,
        capacityProviderTypical,
        tunedParameterConfig,
        csvWriter
    );
    allRecords.push(record1);

    // --- DEMO SCENARIO 2: HIGH DEMAND EVENT (e.g., Concert / Major Sporting Event) ---
    // Current availability drops significantly during peak hours (e.g., 10 AM - 2 PM).
    const currentAvailabilityEvent = [...historicalAvailabilityPattern];
    for (let h = 10; h <= 14; h++) { // 10 AM to 2 PM (inclusive)
        currentAvailabilityEvent[h] = Math.floor(TOTAL_CAPACITY * 0.05); // Only 5% spots available!
    }
    currentAvailabilityEvent[9] = Math.floor(TOTAL_CAPACITY * 0.2); // Pre-event drop
    currentAvailabilityEvent[15] = Math.floor(TOTAL_CAPACITY * 0.1); // Post-event lingering demand

    const capacityProviderEvent = new MockCapacityProvider(
        TOTAL_CAPACITY,
        DAYS_IN_MONTH,
        historicalAvailabilityPattern,
        currentAvailabilityEvent
    );
    const record2 = await runDemoScenario(
        "Scenario 2: High Demand Event",
        fixedCostConfig,
        capacityProviderEvent,
        tunedParameterConfig,
        csvWriter
    );
    allRecords.push(record2);

    // Write all records to CSV
    await csvWriter.writeRecords(allRecords);
    console.log(`\nDemo complete. Results written to pricing_demo_results.csv`);
}

main().catch(console.error);