import { Request, Response } from "express";
import { z } from "zod";
import zoneModel from "../Models/zone.model";

const createZoneSchema = z
  .object({
    name: z.string().regex(/^[A-Za-z][A-Za-z0-9 ]*$/).min(1).max(20),
    capacity: z.number().min(1),
    vehicleType: z
      .string()
      .transform( value => value === undefined ? null : value)
      .optional()
      .nullable(),
    spot: z
      .object({
        name: z.string(),
        numberOfSpots: z.number().gte(1),
        floor: z.number().default(0),
        startingNumber: z.number().gte(0).default(1),
      }).optional(),
  })
  .refine(
    (data) => {
      if (data.spot) {return data.spot.numberOfSpots <= data.capacity;}
      return true;
    },
    {
      message: "Number of spots cannot be greater than capacity",
    }
  );

const uuidSchema = z.string().uuid();

export type zoneCreateSpot = z.infer<typeof createZoneSchema>["spot"];
export type uuid = z.infer<typeof uuidSchema>;

export const createZone = async (req: Request, res: Response) => {
  const result = createZoneSchema.safeParse(req.body);
  const idResult = uuidSchema.safeParse(req.params.lotId);
  if (!idResult.success) {
    res.status(400).json({ message: "Missing or Invalid id" });
    return;
  }

  if(!result.success) {
    res.status(400).json({ message: "Invalid data", errors: result.error.errors });
    return;
  }
  const { name, capacity, spot } = result.data;
  const lotId = idResult.data;  
  try {
    const zone = await zoneModel.createZone(spot, name, capacity, lotId);
    res.status(201).json({zone});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
