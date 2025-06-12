import { Request, Response } from "express";
import {z} from "zod";
import reservationModel from "../Models/reservation.model";
import ModelError from "../Models/ModelError";
import {uuid} from "./zone.controller";
import jwt from "jsonwebtoken";
import axios from "axios";
import {getPriceForLot} from "./price.controller";

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
    phoneNumber: z.string().regex(/^\+251\d{9}$/),
    requestedValet: z.boolean().optional().default(false),
});

const reservationQuerySchema = z
  .object({
    zoneId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    lotId: z.string().uuid().optional(),
    status: z
      .enum(["active", "cancelled", "complete"])
      .transform((value) => value.toUpperCase())
      .optional(),
    limit: z.coerce.number().positive().optional().default(10),
    offset: z.coerce.number().optional().default(0),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.from < data.to;
      }
      return true;
    },
    {
      message: "From must be before to.",
      path: ["from", "to"],
    }
  );

const reservationHistoryQuerySchema = z.object({
  limit: z.coerce.number().positive().optional().default(10),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export type ReserveQueryType = z.infer<typeof reserveQuerySchema>;

const futureIdSchema = z.string().uuid();

const PRIVATE_KEY_IN_PEM = `
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEILd62Ot4hMSxIwO1TRZQnAD02FHV5Hxvc7PbHU3nWQWwoAoGCCqGSM49
AwEHoUQDQgAEBy11auaVru1GUhPavhEub2tfx8P6EvdVnq+BL/fDEe83IwgOrkvg
bTa6BEUQkKoqsn+8bpJ3BIYAI2Iqa+KzZw==
-----END EC PRIVATE KEY-----
`;

const GATEWAY_MERCHANT_ID = "9e2dab64-e2bb-4837-9b85-d855dd878d2b";

function getSignedToken(amount: number, merchantId: uuid){
    const payload = {
        amount: amount,
        paymentReason: "payment",
        merchantId: merchantId,
        generated: Math.floor(Date.now() / 1000)
    };
    return jwt.sign(payload, PRIVATE_KEY_IN_PEM, { algorithm: 'ES256' });
}

async function getSantimRedirectURL(amount: number,phoneNumber: string) {
    const payload = {
        id: Math.floor(Math.random() * 10000000000).toString(),
        amount: amount,
        reason: "payment",
        merchantId: GATEWAY_MERCHANT_ID,
        signedToken: getSignedToken(amount, GATEWAY_MERCHANT_ID),
        successRedirectUrl: "https://inventory.medrafa.et",
        failureRedirectUrl: "https://inventory.medrafa.et",
        notifyUrl: "https://inventory.medrafa.et",
        cancelRedirectUrl: "https://inventory.medrafa.et",
        phoneNumber: phoneNumber,
    };
    try {
        const response = await axios.post("https://services.santimpay.com/api/v1/gateway/initiate-payment", payload);
        if (response.status === 200) {
            return response.data.url as string;
        } else {
            throw new Error("Failed to initiate payment");
        }
    } catch (err) {
        console.error(err);
        throw new ModelError("Failed to initiate payment",500);
    }
}


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
      const {lotId, zoneId, startTime, endTime, vehicleId, requestedValet, phoneNumber} = result.data;
      const freeSpot = await reservationModel.checkAvailability(lotId, zoneId, startTime, endTime, vehicleId);
      if(!freeSpot){
        res.status(404).json({message: "Sorry. This lot is fully booked for the requested time."});
        return;
      }

      const priceInfo = await getPriceForLot(
          lotId,
          new Date(startTime).getHours(),
          new Date(endTime).getHours(),
          requestedValet,
      );

      const url = await getSantimRedirectURL(priceInfo.total, phoneNumber);
      res.json({url});

      // TODO: accept notify URL or check after 30 seconds
      // const reservation = await reservationModel(
    } catch (error) {
      if(error instanceof ModelError){
        res.status(error.statusCode).json({message: error.message});
        return;
      }
      console.error(error);
      res.status(500).json({message: "Error booking spot.", error: (error as Error).message});
    }  
  };

  export const getReservations = async (req: Request, res: Response) => {
    const result = reservationQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ message: "Invalid request", error: result.error });
      return;
    }
    const providerId = req?.user?.providerId!;
    let { zoneId, from, to, lotId, limit, offset, status } = result.data;
    try {
      const reservations = await reservationModel.getReservations(
        providerId,
        lotId,
        zoneId,
        from,
        to,
        status,
        limit,
        offset
      );
      res.json(reservations);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          message: "Error getting reservations.",
          error: (error as Error).message,
        });
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
      // if(!reservation){
      //   res.status(404).json({message: "Reservation not found."});
      //   return; 
      // }
      res.status(204).json({message: "Reservation canceled."});
    } catch (error ) {
      console.error(error);
      if(error instanceof ModelError){
        res.status(error.statusCode).json({message: error.message});
        return;
      }
      res.status(500).json({message: "Error canceling reservation.", error: (error as Error).message})
    }
  }

  export const getReservationsByVehicle = async (req: Request, res: Response) => {
    const customerId = req?.user?.id as string;
    const vehicleId = req.params.vehicleId!;
    if(!vehicleId){
      res.status(400).json({message: "Invalid request."});
      return;
    }
    try {
      const reservations = await reservationModel.getReservationsByVehicle(vehicleId, customerId);
      res.json(reservations);
    } catch (error) {
      console.error(error);
      res.status(500).json({message: "Error getting reservations.", error: (error as Error).message});
    }
  }

  export const getReservationsHistory = async (req: Request, res: Response) => {
    const customerId = req?.user?.id as string;
    const result = reservationHistoryQuerySchema.safeParse(req.query);
  
    if (!result.success) {
      res.status(400).json({ message: "Invalid request", error: result.error });
      return;
    }
  
    const { limit, offset } = result.data;
  
    try {
      const reservations = await reservationModel.getReservationsHistory(
        customerId,
        limit,
        offset
      );
      res.json(reservations);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error fetching reservation history.",
        error: (error as Error).message,
      });
    }
  };
