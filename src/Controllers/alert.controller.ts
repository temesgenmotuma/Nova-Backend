import { Request, Response } from "express";
import {z} from "zod";
import aletModel from "../Models/alert.model"; 

const getAlertsQuerySchema = z.object({
    type: z.enum(['reservationExpiry']).optional(),
    lotId: z.string().uuid().optional(),
    zoneId: z.string().uuid().optional(),
    limit: z.number().int().positive().default(10).optional(),
    offset: z.number().int().nonnegative().default(0).optional(),
});

export type GetAlertsQueryType = z.infer<typeof getAlertsQuerySchema>;

export const getAlerts = async (req: Request, res: Response) => {
  const { error, success, data } = getAlertsQuerySchema.safeParse(req.query);
  if (!success) {
    res.status(400).json({
      message: "Invalid query parameters",
      error: error.errors[0].message,
    });
    return;
  }
  try {
    const alerts = await aletModel.getAlerts(data);
    res.status(200).json({
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      message: "Failed to fetch alerts. Please try again later.",
    });
  }
};
