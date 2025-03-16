import { Request, Response } from "express";
import joi from "joi";
import {z} from "zod";

import spotModel from "../Models/spot.model";
import vehicleModel from "Models/vehicle.model";

const createSpotSchema = joi.object({
  name: joi.string().optional(),
  number: joi.number().integer().positive().required(),
  floor: joi.number().integer().allow(null).default(null),
  startingNumber: joi.number().integer().empty("").default(1),
  lotId: joi.string().uuid(),
});

const updateSpotSchema = joi.object({
  name: joi.string().optional().empty("").default(null),
  floor: joi.number().integer().optional().empty("").default(null),
});

const idSchema = joi.string().uuid();

const reserveQuerySchema = z.object({
  vehicleId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  lotId: z.string().uuid(),
});

export type ReserveQueryType = z.infer<typeof reserveQuerySchema>;

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

export const reserve = async (req: Request, res: Response) => {
  const customerId = req?.user?.id as string;
  const result = reserveQuerySchema.safeParse(req.body);
  if(!result.success){
    res.status(400).json({message: "Invalid request", error: result.error});
    return;
  } 
  try {
    /** THESE 2 ARE DONE ON THE FRONTEND 
    //check if customer has a vehicle
    //if not, prompt user to register a vehicle 
    */
    

    //check spot availability during the time the customer wants to reserve
    //If a spot is available somehow choose a parking spot
    const {lotId, startTime, endTime} = result.data;
    const freeSpot = await spotModel.checkAvailability(lotId, startTime, endTime);
    if(!freeSpot){
      res.status(404).json({message: "Sorry. This lot is fully booked for the requested time."});
      return;
    }
    
    //lock the spot
    //wait until the user makes a payment.
    const reservation = await spotModel.reserve(freeSpot.id, result.data)
    res.status(201).json(reservation);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error booking spot.", error: (error as Error).message});
  }  
};



