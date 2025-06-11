import { Request, Response } from "express";
import { z } from "zod";
import ticketModel from "../Models/entryExit.model";
import ModelError from "../Models/ModelError";

//TODO: May be make all the letters in license plates uppercase
const nonResEntrySchema = z.object({
  // phoneNumber: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
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
  // phone: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  lotId: z.string().uuid().optional().default(""),
});

const nonResExitSchema = z.object({
  // phoneNumber: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  licensePlate: z.string().regex(
    /^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/
  ),
  lotId: z.string().uuid().optional(),
});

const resExitSchema = z.object({
  // phoneNumber: z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
  lotId: z.string().uuid().optional(),
  licensePlate: z
    .string()
    .regex(
      /^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/
    ),
});

export type nonResEntryType = z.infer<typeof nonResEntrySchema>;
export type nonResExitType = z.infer<typeof nonResExitSchema>;
export type resEntryType = z.infer<typeof resEntrySchema>;
export type resExitType = z.infer<typeof resExitSchema>;

export const nonReservationEntry = async (req: Request, res: Response) => {
  const role = req.user?.role;
  const providerId = req.user?.providerId!;
  if (role !== "attendant" && role !== "admin") {
    res.status(403).json({ message: "Access denied. Only attendants can access this resource."});
    return;
  }
  
  const result = nonResEntrySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({  message: "Invalid request",  errors: result.error.flatten().fieldErrors,});
    return;
  }

  let lotId: string;
  if(role === "admin"  ) {
    if(!result.data.lotId) {
      res.status(400).json({message: "lotId is required"});
      return;
    }
    lotId = result.data.lotId!;
  }
  else{
    lotId = req.user?.lotId!;
  }

  try {
    //If admin check that the lot is one of the lots of the provider
    //If attendant check that the lot is exactly the one the attendant works in  
    
    const validLot = await ticketModel.isValidLot(lotId, providerId, result.data.zoneId);
    if(!validLot){
      res.status(404).json({message: "Non existant parking lot and/or zone."});
      return;
    }

    const spot = await ticketModel.findNonReservationSpot(lotId, result.data, result.data.zoneId);
    if(!spot){
      res.status(404).json({message: "No free spot found in this parking lot."});
      return;
    }

    //The ticket is created and sent to the customer
    const ticket = await ticketModel.nonReservationEntry(spot.id, lotId, result.data);

    res.status(200).json({ticket});
  } catch (error) {
    if(error instanceof ModelError){
      res.status(error.statusCode).json({message: error.message});
      return;
    }
    console.error(error);
    res.status(500).json({  message: "Internal server error",  error: (error as Error).message,});
  }
};

export const nonReservationExit = async (req:Request, res:Response) => {
  const providerId = req.user?.providerId!;
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

  let lotId: string = req.user?.lotId!;

  if(role === "admin"){
    if( !result.data.lotId) {
      res.status(400).json({ message: "lotId is required" });
      return;
    }
    lotId = result.data.lotId!;
  }

  try {
    const validLot = await ticketModel.isValidLot(lotId, providerId);
    if(!validLot){
      res.status(404).json({message: "Parking lot doesn't exist."});
      return;
    }

    await ticketModel.nonReservationExit(lotId, result.data);
    res.status(200).json({message: "Exit successful"});
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
  const providerId = req.user?.providerId!;
  if (role !== "attendant" && role !== "admin") {
    res.status(403).json({ message: "Access denied. Only attendants can access this resource."});
    return;
  }

  const result = resEntrySchema.safeParse(req.body);
  if(!result.success){
    res.status(400).json({message: "Invalid request", error: result.error.flatten().fieldErrors});
    return;
  }
  
  let lotId: string = req.user?.lotId!;
  if(role === "admin"){
    if( !result.data.lotId) {
      res.status(400).json({ message: "lotId is required" });
      return;
    }
    lotId = result.data.lotId!;
  }

  try {
    const validLot = await ticketModel.isValidLot(lotId, providerId);
    if(!validLot){
      res.status(404).json({message: "Parking lot doesn't exist."});
      return;
    }
    const ticket = await ticketModel.reservationEntry(lotId, result.data);
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
    await ticketModel.reservationExit(lotId, result.data);
  } catch (error) {
    console.error(error);
    if( error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error",  error: (error as Error).message,});
  }
};