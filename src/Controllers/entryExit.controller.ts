import { Request, Response } from "express";
import { z } from "zod";
import ticketModel from "../Models/entryExit.model";

const nonResEntryQuerySchema = z
  .object({
    licensePlate: z
      .string()
      .regex(
        /^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD)([A-C]\d{5}|\d{5}|\d{4})$/
      ),
    entryTime: z.string().datetime(),
  })
  .refine((data) => new Date(data.entryTime) >= new Date(), {
    message: "Entry time must not be in the past",
    path: ["entryTime"],
  });

const plateNumbercodes = ["AA", "ET", "UN", "AU", "AF", "AM", "BG"];

export const nonReservationEntry = async (req: Request, res: Response) => {
  const result = nonResEntryQuerySchema.safeParse(req.body);
  if(!result.success){
    res.status(400).json({message: "Invalid request", errors: result.error.flatten().fieldErrors});
    return;
  }

  try {
    const { licensePlate, entryTime } = result.data;
    const {lotId} = req.user!;

    // The attendent assigns spot
    // const spot = await ticketModel.assignSpot();
    //The ticket is created and sent to the customer
    const ticket  = await ticketModel.nonReservationEntry();

    res.status(200).json({ message: "Entry successful", data: { licensePlate, entryTime } });
  } catch (err) {
    console.error(err);
    res.status(500).json({  message: "Internal server error",  error: (err as Error).message});
  }
};
