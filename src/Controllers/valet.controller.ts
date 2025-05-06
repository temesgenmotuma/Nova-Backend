import { Request, Response } from "express";
import { z } from "zod";

import valetModel from "../Models/valet.model";
import sendEmail from "../services/email/sendEmail";
import ModelError from "../Models/ModelError";

const createValetTicketSchema = z.object({
  vehicle: z.object({
    licensePlate: z.string(),
    make: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    lotId: z.string().uuid().optional(),
    //TODO: This field will be deleted and come from the auth user
  }),
  customer: z.object({
    email: z.string(),
  }),
});

const vehicleRetreivalSchema = z.object({
  ticketId: z.string().uuid(),
});

export type vehicleType = z.infer<typeof createValetTicketSchema>["vehicle"];
export type customerType = z.infer<typeof createValetTicketSchema>["customer"];

export const createValetTicket = async (req: Request, res: Response) => {
  const { id: valetId, role, lotId:id } = req.user!;
  
  //TODO: Maybe removed when permissions are implemented
  if (role !== "Valet") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  const parsedBody = createValetTicketSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: parsedBody.error.errors });
    return;
  }

  const lotId = id || req.body.vehicle.lotId;
  //TODO: Handle lotId value with diffrent roles.
  if (!valetId || !lotId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const { vehicle, customer } = parsedBody.data;
    const valetParking = await valetModel.createValetTicket(valetId, lotId,vehicle, customer);
    const vehicleId = valetParking.ticket.vehicle.id;
    await sendEmail(
      customer.email,
      "Valet Ticket Created",
      `Here is the link: http:localhost:3000/vehicles?id=${vehicleId}`
    );
    //http:localhost:3000/ticket?id=ticketId
    
    res.status(201).json({ message: "Confirmation email sent.", valetParking });
  } catch (error) {
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
      
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message,});
  }
};

export const createRetreivalRequest = async (req: Request, res: Response) => {
  const ticketBody = vehicleRetreivalSchema.safeParse(req.params);
  if (!ticketBody.success) {
    res.status(400).json({ message: ticketBody.error.errors });
    return;
  }
  const {ticketId} = ticketBody.data;
  try {
    const ticket = await valetModel.requestVehicleRetrieval(ticketId);
    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }
    res.json({ticket});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getRetrievalRequests = async (req: Request, res: Response) => {
  const { id: valetId, role } = req.user!;
  if (role !== "Valet") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  try {
    const retrievalRequests = await valetModel.getActiveVehicleRequests(valetId);
    res.json({ retrievalRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
