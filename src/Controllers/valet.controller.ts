import { Request, Response } from "express";
import { z } from "zod";

import valetModel from "../Models/valet.model";
import sendEmail from "../services/email/sendEmail";
import ModelError from "../Models/ModelError";
import { hasPermission } from "../utils/permission";

const createValetTicketSchema = z.object({
  vehicle: z.object({
    licensePlate: z.string(),
    make: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
  }),
  //TODO: make this optional or remove it since no email noti
  customer: z.object({
    email: z.string(),
  }),
  zoneId: z.string().uuid(),
});

const ticketIdSchema = z.object({
  ticketId: z.string().uuid(),
});


export type vehicleType = z.infer<typeof createValetTicketSchema>["vehicle"];
export type customerType = z.infer<typeof createValetTicketSchema>["customer"];

export const createValetTicket = async (req: Request, res: Response) => {
  const { id: valetId, role, lotId } = req.user!;
  
  if (!hasPermission(req.user!, "create:valetTicket")) {
    res.status(403).json({ message: "Only valets can create valetTickets." });
    return;
  }
  const parsedBody = createValetTicketSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: parsedBody.error.errors });
    return;
  }

  const zoneId = parsedBody.data.zoneId;
  if (!valetId || !lotId) {
    res.status(401).json({ message: "Unauthorized- forbidden to create valet ticket" });
    return;
  }
  try {
    const { vehicle, customer } = parsedBody.data;
    const valetParking = await valetModel.createValetTicket(valetId, lotId, zoneId, vehicle, customer);
    const vehicleId = valetParking.ticket.vehicle.id;
    // await sendEmail(
    //   customer.email,
    //   "Valet Ticket Created",
    //   `Here is the link: http:localhost:3000/vehicles?id=${vehicleId}`
    // );
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

export const makeRetreivalRequest = async (req: Request, res: Response) => {
  const ticketBody = ticketIdSchema.safeParse(req.params);
  if (!ticketBody.success) {
    res.status(400).json({ message: ticketBody.error });
    return;
  }
  const {ticketId} = ticketBody.data;
  try {
    const ticket = await valetModel.requestVehicleRetrieval(ticketId);
    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getRetrievalRequests = async (req: Request, res: Response) => {
  const { id: valetId, role, lotId } = req.user!;
  if (!hasPermission(req.user!, "view:valetTicket") || !lotId) {
    res.status(403).json({ message: "The user is not a valet." });
    return;
  }
  try {
    const retrievalRequests = await valetModel.getActiveVehicleRequests(lotId);
    res.json(retrievalRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const claimRetrievalRequest = async (req: Request, res: Response) => {
  const parsedBody = ticketIdSchema.safeParse(req.params);
  if (!parsedBody.success) {
    res.status(400).json({ message: parsedBody.error.errors });
    return;
  }
  const { id: valetId } = req.user!;
  try {
    const {ticketId} = parsedBody.data;
    const ticket = await valetModel.claimRetrievalRequest(ticketId, valetId);
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

//TODO: NOT COMPLETED AND NOT TESTED
export const completeRetrievalRequest = async (req: Request, res: Response) => {
  const parsedBody = ticketIdSchema.safeParse(req.params);
  if (!parsedBody.success) {
    res.status(400).json({ message: parsedBody.error.errors });
    return;
  }
  const { id: valetId } = req.user!;
  try {
    const {ticketId} = parsedBody.data;
    const ticket = await valetModel.completeVehicleRetrieval(ticketId);
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
}