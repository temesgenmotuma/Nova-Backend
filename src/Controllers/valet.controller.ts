import { Request, Response } from "express";
import { z } from "zod";

import valetModel from "../Models/valet.model";

const createValetTicketSchema = z.object({
  vehicle: z.object({
    licensePlate: z.string(),
    make: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
  }),
  customer: z.object({
    email: z.string(),
  }),
});

export type vehicleType = z.infer<typeof createValetTicketSchema>["vehicle"];
export type customerType = z.infer<typeof createValetTicketSchema>["customer"];

export const createValetTicket = async (req: Request, res: Response) => {
  const { id: valetId, role } = req.user!;
  if (!valetId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (role !== "VALET") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsedBody = createValetTicketSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.errors });
    return;
  }
  try {
    const { vehicle, customer } = parsedBody.data;
    const ticket = await valetModel.createValetTicket(valetId ,vehicle, customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
