import { Request, Response } from 'express';
import { z } from 'zod';
import costModel from '../Models/cost.model'; // Assuming the model is in src/models/cost.model.ts

// --- Schemas for Zod Validation ---

// Schema for POST /cost
export const createCostSchema = z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1900), // Adjust min year as needed
    amount: z.number().positive(),
    margin: z.number(),
    lotId: z.string().uuid(),
});

export type CreateCostType = z.infer<typeof createCostSchema>;

// Schema for GET /cost?year
export const getCostsQuerySchema = z.object({
    year: z.preprocess(
        (a) => parseInt(z.string().parse(a), 10),
        z.number().int().min(1900) // Adjust min year as needed
    ).optional(),
    limit: z.preprocess(
        (a) => parseInt(z.string().parse(a), 10),
        z.number().int().positive().default(10)
    ).optional(),
    offset: z.preprocess(
        (a) => parseInt(z.string().parse(a), 10),
        z.number().int().nonnegative().default(0)
    ).optional(),
});

export type GetCostsQueryType = z.infer<typeof getCostsQuerySchema>;

// --- Controller Functions ---

/**
 * Handles the POST /cost request to create a new cost entry.
 */
export const createCost = async (req: Request, res: Response) => {
    const { error, success, data } = createCostSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({
            message: 'Invalid request body',
            errors: error.errors,
        });
        return;
    }

    try {
        const newCost = await costModel.createCost(data);
        res.status(201).json({
            message: 'Cost created successfully',
            data: newCost,
        });
    } catch (error) {
        console.error('Error creating cost:', error);
        res.status((error as any).statusCode || 500).json({
            message: (error as Error).message || 'Failed to create cost. Please try again later.',
        });
    }
};

/**
 * Handles the GET /cost/:id request to retrieve a single cost entry.
 */
export const getCostById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!z.string().uuid().safeParse(id).success) {
        res.status(400).json({
            message: 'Invalid ID format. Must be a UUID.',
        });
        return;
    }

    try {
        const cost = await costModel.getCostById(id);
        if (!cost) {
            res.status(404).json({
                message: 'Cost not found.',
            });
            return;
        }
        res.status(200).json({
            data: cost,
        });
    } catch (error) {
        console.error('Error fetching cost by ID:', error);
        res.status((error as any).statusCode || 500).json({
            message: (error as Error).message || 'Failed to retrieve cost. Please try again later.',
        });
    }
};

/**
 * Handles the GET /cost?year request to retrieve cost entries by year.
 */
export const getCosts = async (req: Request, res: Response) => {
    const { error, success, data } = getCostsQuerySchema.safeParse(req.query);

    if (!success) {
        res.status(400).json({
            message: 'Invalid query parameters',
            errors: error.errors,
        });
        return;
    }

    try {
        const { year, limit = 10, offset = 0 } = data;

        const { count, costs } = await costModel.getCostsByYear(year, limit, offset);
        res.status(200).json({
            count,
            data: costs,
        });
        return;
    } catch (error) {
        console.error('Error fetching costs:', error);
        res.status((error as any).statusCode || 500).json({
            message: (error as Error).message || 'Failed to retrieve costs. Please try again later.',
        });
    }
};

/**
 * Handles the DELETE /cost/:id request to delete a cost entry.
 */
export const deleteCost = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!z.string().uuid().safeParse(id).success) {
        res.status(400).json({
            message: 'Invalid ID format. Must be a UUID.',
        });
        return;
    }

    try {
        const deletedCost = await costModel.deleteCost(id);
        res.status(200).json({
            message: 'Cost deleted successfully',
            data: deletedCost,
        });
    } catch (error) {
        console.error('Error deleting cost:', error);
        res.status((error as any).statusCode || 500).json({
            message: (error as Error).message || 'Failed to delete cost. Please try again later.',
        });
    }
};