import { Request, Response } from 'express';
import { z } from 'zod';
import pricingModel from 'Models/price.model';

// --- Schemas for Zod Validation ---

// Schema for PUT /pricing/:lotId
export const upsertLotPricingSchema = z.object({
    maxPrice: z.number().positive(),
    minPrice: z.number().positive(),
    valetPrice: z.number().positive(),
});

export type UpsertLotPricingType = z.infer<typeof upsertLotPricingSchema>;

// --- Controller Functions ---

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