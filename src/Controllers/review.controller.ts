import { Request, Response } from "express";
import reviewModel from "../Models/review.model";
import ModelError from "../Models/ModelError";
import { z } from "zod";

const reviewSchema = z.object({
  lotId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

const reviewQuerySchema = z.object({
  lotId: z.string().uuid(),
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const createReview = async (req: Request, res: Response): Promise<void> => {
  const parseResult = reviewSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }
  const value = parseResult.data;

  const { lotId, rating, comment } = value;
  const customerId = req.user?.id;

  try {
    if (!customerId) throw new ModelError("Unauthorized: Customer ID missing", 401);

    const review = await reviewModel.createReview(customerId, lotId, rating, comment);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(err instanceof ModelError ? err.statusCode : 500).json({ error: (err as Error).message });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  const parseResult = reviewQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }
  const { lotId, limit, offset } = parseResult.data;

  try {
    const reviews = await reviewModel.getReviews(lotId, limit, offset);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(err instanceof ModelError ? err.statusCode : 500).json({ error: (err as Error).message });
  }
};
