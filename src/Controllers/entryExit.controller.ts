import { Request, Response } from "express";
import { z } from "zod";
import ticketModel from "../Models/entryExit.model";
import ModelError from "../Models/ModelError";

//TODO: May be make all the letters in license plates uppercase
const baseNonResEntrySchema = z.object({
  phoneNumber: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  licensePlate: z
    .string()
    .regex(
      /^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/
    ),
  lotId: z.string().uuid().optional(),
  zoneId: z.string().uuid(),
  vehicle: z
    .object({
      make: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
});

const resEntrySchema = z.object({
  licensePlate: z.string().regex(
    /^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/
  ),
  phone: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  lotId: z.string().uuid().optional().default(""),
});

const nonResExitSchema = z.object({
  phoneNumber: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  lotId: z.string().uuid().optional(),
});

const resExitSchema = z.object({
  phoneNumber: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  lotId: z.string().uuid().optional(),
});

/* const nonResEntrySchema = baseNonResEntrySchema.refine(
  (data) => new Date(data.entryTime) >= new Date(),
  {
    message: "Entry time must not be in the past",
    path: ["entryTime"],
  }
); */

export type nonResEntryType = z.infer<typeof baseNonResEntrySchema>;

export const nonReservationEntry = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role !== "attendant" && role !== "admin") {
    res.status(403).json({ message: "Access denied. Only attendants can access this resource."});
    return;
  }
  
  const result = baseNonResEntrySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({  message: "Invalid request",  errors: result.error.flatten().fieldErrors,});
    return;
  }

  if(role === "admin" && !result.data.lotId) {  
    res.status(400).json({message: "lotId is required"});
    return;
  }

  const lotId  = req.user?.lotId || result.data.lotId;
  try {
    // The attendent assigns spot
    const spot = await ticketModel.findNonReservationSpot(lotId, result.data.zoneId);
    if(!spot){
      res.status(404).json({message: "No free spot found in this parking lot."});
      return;
    }

    //The ticket is created and sent to the customer
    const ticket = await ticketModel.nonReservationEntry(spot.id, lotId,result.data);

    res.status(200).json({ticket});
  } catch (error) {
    if(error instanceof ModelError){
      res.status(error.statusCode).json({message: error.message});
    }
    console.error(error);
    res.status(500).json({  message: "Internal server error",  error: (error as Error).message,});
  }
};

export const nonReservationExit = async (req:Request, res:Response) => {
  const role = req.user?.role;
  if (role !== "attendant" && role !== "admin") {
    res.status(403).json({ message: "Access denied. Only attendants can access this resource."});
    return;
  }
  
  const result = nonResExitSchema.safeParse(req.body);
  if(!result.success){
    res.status(400).json({message: "Invalid request", error: result.error.flatten().fieldErrors});
    return;
  }

  if(role === "admin" && !result.data.lotId){  
    res.status(400).json({message: "lotId is required"});
    return;
  }

  const lotId = req.user?.lotId! || result.data.lotId!;

  try {
    await ticketModel.nonReservationExit(lotId, result.data.phoneNumber);
    res.status(204).json({message: "Exit successful"});
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error", error: (error as Error).message,});
  }
};

export const reservationEntry = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role !== "attendant" && role !== "admin") {
    res.status(403).json({ message: "Access denied. Only attendants can access this resource."});
    return;
  }

  const result = resEntrySchema.safeParse(req.body);
  if(!result.success){
    res.status(400).json({message: "Invalid request", error: result.error.flatten().fieldErrors});
    return;
  }
  
  if(role==="admin" && !result.data.lotId){  
    res.status(400).json({message: "lotId is required"});
    return;
  }
  
  const lotId = req.user?.lotId || result.data.lotId!;
  const {licensePlate, phone } = result.data;
  try {
    const ticket = await ticketModel.reservationEntry(licensePlate, phone, lotId);
    res.status(201).json({ticket});
  } catch (error) {
    if(error instanceof ModelError){
      res.status(error.statusCode).json({message: error.message});
      return;
    }
    console.error(error);
    res.status(500).json({  message: "Internal server error",  error: (error as Error).message,});
  }
};

export const reservationExit = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role !== "attendant" && role !== "admin") {
    res.status(403).json({ message: "Access denied. Only attendants can access this resource."});
    return;
  }
  
  const result = resExitSchema.safeParse(req.body);
  if(!result.success){
    res.status(400).json({message: "Invalid request", error: result.error.flatten().fieldErrors});
    return;
  }

  if(role==="admin" && !result.data?.lotId){  
    res.status(400).json({message: "lotId is required"});
    return;
  }

  const lotId = req.user?.lotId! || result.data.lotId!;
  try {
    await ticketModel.reservationExit(lotId, result.data.phoneNumber);
  } catch (error) {
    console.error(error);
    if( error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error",  error: (error as Error).message,});
  }
};