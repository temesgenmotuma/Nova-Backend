import { Request, Response } from "express";
import joi from "joi";
import {z} from "zod";

import spotModel from "../Models/spot.model";
import vehicleModel from "Models/vehicle.model";
import  ModelError  from "../Models/ModelError";

const createSpotSchema = joi.object({
  name: joi.string().optional(),
  number: joi.number().integer().positive().required(),
  floor: joi.number().integer().allow(null).default(null),
  startingNumber: joi.number().integer().empty("").default(1),
  zoneId: joi.string().uuid(),
});

const updateSpotSchema = joi.object({
  name: joi.string().optional().empty("").default(null),
  floor: joi.number().integer().optional().empty("").default(null),
}).or("name", "floor");

const idSchema = joi.string().uuid();

export const createSpot = async (req: Request, res: Response) => {
  const { value, error } = createSpotSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: "Invalid request", error: error.message });
    return;
  }

  const { number, name, floor, startingNumber, zoneId } = value;
  try {
    const spot = await spotModel.createSpot(
      name,
      number,
      floor,
      startingNumber,
      zoneId
    );
    res.status(201).json({ message: "Spot created successfully.", spot});
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({message: error.message});
      return;
    }
    res.status(500).json({ message: "Error creating spot" });
  }
};

export const getSpot = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = idSchema.validate(id);
  if (error) {
    res.status(400).json({ message: "Invalid id.", error: error.message });
    return;
  }
  try {
    //decide whether lotid filter must be here 
    const spot = await spotModel.getSpotById(id);
    if (!spot) {
      res.status(404).json({ message: "Spot not found." });
      return;
    }
    res.json({ spot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting spot.", error });
  }
}

export const updateSpot = async (req: Request, res: Response) => {
  const {spotId} = req.params;

  const {error: idError} = idSchema.validate(spotId);
  const {value, error: updateError} = updateSpotSchema.validate(req.body);
  if(idError || updateError){
    res.status(400).json({message: "Invalid or no spotId provided."});
    return;
  }

  try {
    const {name, floor} = value;
    const updatedSpot = await spotModel.updateSpot(spotId, name, floor);
    res.json(updatedSpot);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "error updating the spot"})
  }
}

export const  checkAvailability = async (req: Request, res: Response) => {
  const {lotId} = req.params;
  try {
    /* const foundSpot = await spotModel.checkAvailability(lotId);
    if(!foundSpot){
      res.status(404).json({message: "No spots available"});
      return;
    }
    res.json({message: "Spot available", spot: foundSpot.id}) */;
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error fetching availability information.", error: (error as Error).message})
  }
};







