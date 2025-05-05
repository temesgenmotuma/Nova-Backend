import { Request, Response } from "express";
import {z} from "zod";
import reservationModel from "../Models/reservation.model";
import ModelError from "../Models/ModelError";

const reserveQuerySchema = z.object({
    vehicleId: z.string().uuid(),
    zoneId: z.string().uuid(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    // licensePlate: z
    // .string()
    // .regex(
    //   /^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/
    // ),
    lotId: z.string().uuid(),
});

export type ReserveQueryType = z.infer<typeof reserveQuerySchema>;

const futureIdSchema = z.string().uuid();

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
      const {lotId, zoneId, startTime, endTime} = result.data;
      const freeSpot = await reservationModel.checkAvailability(lotId, zoneId, startTime, endTime);
      if(!freeSpot){
        res.status(404).json({message: "Sorry. This lot is fully booked for the requested time."});
        return;
      }
      
      //lock the spot
      //wait until the user makes a payment.
      const reservation = await reservationModel.reserve(freeSpot.id, result.data)
      res.status(201).json(reservation);
      
    } catch (error) {
      if(error instanceof ModelError){
        res.status(400).json({message: error.message});
        return;
      }
      console.error(error);
      res.status(500).json({message: "Error booking spot.", error: (error as Error).message});
    }  
  };
  
  export const cancelReservation = async(req: Request, res: Response) => {
    const {id} = req.params;
    const result = futureIdSchema.safeParse(id);
    if(!result.success){
      res.status(400).json({message: "Invalid request", error: result.error});
      return;
    }
    
    try {
      const reservation = await reservationModel.cancelReservation(id);
      if(!reservation){
        res.status(404).json({message: "Reservation not found."});
        return; 
      }
      res.status(204).json({message: "Reservation canceled."});
    } catch (error ) {
      console.error(error);
      res.status(500).json({message: "Error canceling reservation.", error: (error as Error).message})
    }
  }

  export const getReservations = async (req: Request, res: Response) => {
    const customerId = req?.user?.id as string;
    const {id} = req.params;
    if(!id){
      res.status(400).json({message: "Invalid request."});
      return;
    }
    try {
      const reservations = await reservationModel.getReservationsByVehicle(id, customerId);
      res.json(reservations);
    } catch (error) {
      console.error(error);
      res.status(500).json({message: "Error getting reservations.", error: (error as Error).message});
    }
  }
