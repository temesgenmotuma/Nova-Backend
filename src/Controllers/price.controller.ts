import { Request, Response } from 'express';
import { z } from 'zod';
import pricingModel from '../Models/price.model';
import {
    PrismaCapacityProvider,
    ConstParameterConfig,
    DatabaseCostConfigProvider,
    DynamicPricingEngine,
} from '../Pricing/engine';

// Schema for PUT /pricing/:lotId
export const upsertLotPricingSchema = z.object({
    maxPrice: z.number().positive(),
    minPrice: z.number().positive(),
    valetPrice: z.number().positive(),
});

export type UpsertLotPricingType = z.infer<typeof upsertLotPricingSchema>;

/**
 * Handles the PUT /pricing/:lotId request to create or update pricing configuration for a lot.
 */
export const upsertLotPricing = async (req: Request, res: Response) => {
    const { lotId } = req.params;

    if (!z.string().uuid().safeParse(lotId).success) {
        res.status(400).json({
            message: 'Invalid lot ID format. Must be a UUID.',
        });
        return;
    }

    const { error, success, data } = upsertLotPricingSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({
            message: 'Invalid request body',
            errors: error.errors,
        });
        return;
    }

    try {
        const pricing = await pricingModel.upsertLotPricing(lotId, data);
        res.status(200).json({
            message: 'Lot pricing configuration updated successfully',
            data: pricing,
        });
    } catch (error) {
        console.error('Error upserting lot pricing:', error);
        res.status((error as any).statusCode || 500).json({
            message: (error as Error).message || 'Failed to update lot pricing. Please try again later.',
        });
    }
};

/**
 * Handles the GET /pricing/:lotId request to retrieve the current pricing configuration for a lot.
 */
export const getLotPricing = async (req: Request, res: Response) => {
    const { lotId } = req.params;

    if (!z.string().uuid().safeParse(lotId).success) {
        res.status(400).json({
            message: 'Invalid lot ID format. Must be a UUID.',
        });
        return;
    }

    try {
        const pricing = await pricingModel.getLotPricing(lotId);
        res.status(200).json({
            data: pricing,
        });
    } catch (error) {
        console.error('Error fetching lot pricing:', error);
        res.status((error as any).statusCode || 500).json({
            message: (error as Error).message || 'Failed to retrieve lot pricing. Please try again later.',
        });
    }
};

const pricingQuerySchema = z.object({
    lotId: z.string().uuid("Invalid lotId format. Must be a UUID."),
    startTime: z.string().datetime({ message: "Invalid startTime format. Must be an ISO 8601 date string." })
        .transform((str) => new Date(str).getHours()) // Convert to Date object, then get the hour (0-23)
        .refine(val => val >= 0 && val <= 23, {
            message: "startTime must represent an hour between 0 and 23.",
        }),
    endTime: z.string().datetime({ message: "Invalid endTime format. Must be an ISO 8601 date string." })
        .transform((str) => new Date(str).getHours() === 0 ? 24 : new Date(str).getHours()) // Convert to Date object, then get the hour (1-24, where 00:00 becomes 24 for end of day)
        .refine(val => val >= 1 && val <= 24, {
            message: "endTime must represent an hour between 1 and 24.",
        }),
    valetRequested: z.enum(['true', 'false']).transform(val => val === 'true'),
}).refine(data => data.endTime > data.startTime, {
    message: "endTime must be greater than startTime.",
    path: ["endTime"], // Associate error with endTime field
});

export const getPrice = async (req: Request, res: Response) => {
    const validationResult = pricingQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
        res.status(400).json({
            error: 'Invalid query parameters',
            details: validationResult.error.errors,
        });
        return;
    }

    const { lotId, startTime, endTime } = validationResult.data;

    const priceInfo = await getPriceForLot(
        lotId,
        startTime,
        endTime,
        validationResult.data.valetRequested,
    );

    res.json(priceInfo);
};

export async function getPriceForLot(lotId: string, startTime: number, endTime: number, valetRequested: boolean){
    valetRequested = !!(await pricingModel.lotProvidesValet(lotId) && valetRequested);

    const capacityProvider = new PrismaCapacityProvider(lotId);
    const costConfigProvider = new DatabaseCostConfigProvider(lotId);
    const params = new ConstParameterConfig(); // Using the constant parameters

    const costConfig = await costConfigProvider.getCostConfig();
    const engine = new DynamicPricingEngine(costConfig, capacityProvider, params);

    const min_price = costConfig.minPrice;

    const { subtotalParkingPrice, fixedValetPrice } = await engine.computeParkingAndValetPrices(
        startTime,
        endTime,
    );

    let subtotal_price = subtotalParkingPrice; // This is the base parking cost
    let valet_price = 0;
    let total = subtotal_price;

    // Conditionally add valet fee based on request AND lot capability
    if (valetRequested) {
        valet_price = fixedValetPrice;
        total += valet_price; // Add to total only if applied
    }

    return {
        min_price: parseFloat(min_price.toFixed(2)),
        subtotal_price: parseFloat(subtotal_price.toFixed(2)),
        valet_price: parseFloat(valet_price.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    }
}