import { Request, Response } from "express";
import { z } from "zod";

import vehicleModel from "../Models/vehicle.model";

const vehicleCreateSchema = z.object({
  make: z.string(),
  model: z.string(),
  color: z.string(),
  licensePlateNumber: z.string(),
});

export type vehicleCreateType = z.infer<typeof vehicleCreateSchema>;

export const getVehicles = async (req: Request, res: Response) => {
  const customerId = req?.user?.id as string;
  try {
    const vehicles = await vehicleModel.getVehicles(customerId);
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Error fetching vehicles",
        error: (error as Error).message,
      });
  }
};

export const getVehicle = async (req: Request, res: Response) => {
    const customerId = req?.user?.id as string;
    const { vehicleId } = req.params;
    if(!vehicleId){
      res.status(400).json({message: "Invalid user input."});
      return; 
    }
    try {
        const vehicle = await vehicleModel.getVehicle(vehicleId, customerId);
        if (!vehicle) {
            res.status(404).json({ message: "Vehicle not found" });
            return;
        }
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching vehicle", error: (error as Error).message,});
    }
};

export const createVehicle = async (req: Request, res: Response) => {
  const customerId = req?.user?.id as string;
  const value = vehicleCreateSchema.safeParse(req.body);
  if (!value.success) {
    res.status(400).json({ error: value.error });
    return;
  }
  try {
    const vehicle = await vehicleModel.createVehicle(customerId, value.data);
    res.status(201).json({
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.model,
      licensePlateNumber: vehicle.licensePlateNumber,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Error creating vehicle",
        error: (error as Error).message,
      });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  const customerId = req?.user?.id as string;
  const { vehicleId } = req.params;
  if(!vehicleId){
    res.status(400).json({message: "Invalid user input."});
    return; 
  }
  try {
    const vehicle = await vehicleModel.getVehicle( vehicleId, customerId);
    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found or is deleted." });
      return;
    }
    await vehicleModel.deleteVehicle(vehicle.id);
    res.json({ message: "Vehicle deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({  message: "Error deleting vehicle",  error: (error as Error).message,});
  }
};
