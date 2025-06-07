import { Request, Response } from "express";
import { z } from "zod";
import ModelError from "../Models/ModelError";
import analyticsModel from "../Models/analytics.model";

export const getPeakHour = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Access denied. Only admins can access this resource."});
    return;
  }
  
  try {
    const peakHourData = await analyticsModel.getPeakHour();
    res.status(200).json(peakHourData);
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({  message: "Error retrieving peak hour data.", error: (error as Error).message,});
  }
};

export const getTotalActiveReservations = async (req: Request, res: Response) => {
  const providerId = req.user?.id!;
  try {
    const totalActiveReservations = await analyticsModel.getTotalActiveReservations(providerId);
    res.status(200).json({ totalActiveReservations });
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Error retrieving active reservations.", error: (error as Error).message });
  }
};

export const getCurrentlyAssignedValets = async (req: Request, res: Response) => {
  const { lotId } = req.params;

  try {
    const currentlyAssignedValets = await analyticsModel.getCurrentlyAssignedValets(lotId);
    res.status(200).json({ currentlyAssignedValets });
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Error retrieving currently assigned valets.", error: (error as Error).message });
  }
};

export const aggregateAnalytics = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Access denied. Only admins can access this resource."});
    return;
  }

  try {
    const one = await getPeakHour(req, res);
    const two = await getTotalActiveReservations(req, res);
    res.status(200).json({ one, two });
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500)
       .json({
         message: "Error retrieving analytics data.",
         error: (error as Error).message,
       });
  }
}
