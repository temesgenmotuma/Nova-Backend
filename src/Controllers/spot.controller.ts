import { Request, Response } from "express";
import joi from "joi";

import spotModel from "../Models/spot.model";

const createSpotSchema = joi.object({
  name: joi.string().optional(),
  number: joi.number().integer().positive().required(),
  floor: joi.number().integer().allow(null).default(null),
  startingNumber: joi.number().integer().empty("").default(1),
  lotId: joi.string().uuid(),
});

export const createSpot = async (req: Request, res: Response) => {
  const { value, error } = createSpotSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: "Invalid request", error: error.message });
    return;
  }

  const { number, name, floor, startingNumber, lotId } = value;
  try {
    const spot = await spotModel.createSpot(
      name,
      number,
      floor,
      startingNumber,
      lotId
    );
    res.status(201).json({ message: "Spot created successfully.", spot});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating spot" });
  }
};


