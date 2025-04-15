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
  vehicle: z
    .object({
      make: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
  // entryTime: z.string().datetime(),
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
  const result = baseNonResEntrySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({  message: "Invalid request",  errors: result.error.flatten().fieldErrors,});
    return;
  }

  try {
    const  lotId  = req.user?.lotId || result.data.lotId;

    // The attendent assigns spot
    const spot = await ticketModel.findNonReservationSpot(lotId);
    if(!spot){
      res.status(404).json({message: "No free spot found in this parking lot."});
      return;
    }

    //The ticket is created and sent to the customer
    const ticket = await ticketModel.nonReservationEntry(spot.id, lotId,result.data);

    res.status(200).json({ticket});
  } catch (err) {
    console.error(err);
    if(err instanceof ModelError){
      res.status(err.statusCode).json({message: err.message});
    }
    res.status(500).json({  message: "Internal server error",  error: (err as Error).message,});
  }
};
