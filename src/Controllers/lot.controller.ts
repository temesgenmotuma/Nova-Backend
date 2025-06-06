import joi from "joi";
import {z} from "zod";
import { Request, Response } from "express";
import lotModel from "../Models/lot.model";
import { hasPermission } from "../utils/permission";
import ModelError from "../Models/ModelError";

const spotSchema = joi.object({
  numberOfSpots: joi.number().integer().empty("").default(0),
  startingNumber: joi.number().integer().default(1).empty(""),
  name: joi.string().default("P").empty(""),
  floor: joi.number().integer().empty("").optional(),
});

//TODO: numberOfSpots < capacity
export const createLotSchema = z.object({
  name: z.string(),
  capacity: z.coerce.number(),
  location: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val; 
      }
    }
    return val; 
  }, z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
  })),
  description: z.string().optional().nullable().default(""),
  hasValet: z.coerce.boolean().optional().default(false),
});

const nearbyLotsQuerySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radius: z.coerce.number().optional().default(500), 
  sortBy: z.enum(["distance", "price"]).optional().default("distance"),
});

const uuidSchema = z.string().uuid();

export type createLotType = z.infer<typeof createLotSchema>;
export type nearbyLotsQueryType = z.infer<typeof nearbyLotsQuerySchema>;

export const getLotsOfCurrProvider = async (req: Request, res: Response) => {
  const providerId = req.user?.providerId!;
  
  if(req.user?.role !== "admin") {
    res.status(403).json({ message: "Unauthorized access." });
    return;
  }
  try {
    const lots = await lotModel.getLotsOfCurrProvider(providerId);
    res.status(200).json(lots);    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching lots" });
  }
};

export const createLot = async (req: Request, res: Response) => {
  const providerId = req.user?.providerId!;
  const value = createLotSchema.safeParse(req.body);
  if (!value.success) {
    res.status(400).json({ error: value.error.errors });
    return;
  }
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const lot = await lotModel.createLot(value.data, providerId, files);
    res.status(201).json(lot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating lot." });
  }
};

export const getSpotsByLot = async (req: Request, res: Response) => {
  const provId = req.user?.providerId as string;
  const lotId = req.params.lotId as string;
  if (!lotId) {
    res.status(400).json({ message: "lotId is required" });
    return;
  }
  try {
    const spots = await lotModel.getSpotsByLot(provId, lotId);
    res.status(200).json({ spots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching spots" });
  }
};

export const getNearbylots = async (req: Request, res: Response) => {
  const value = nearbyLotsQuerySchema.safeParse(req.query);
  if(!value.success){
    res.status(400).json({message: "Invalid request", error: value.error});
    return;
  }
  try {
    const nearbySpots = await lotModel.getLotsWithinDistance(value.data);
    res.json(nearbySpots);
  } catch (error) {
    console.error(error);
    if(error instanceof ModelError){
      res.status(error.statusCode).json({message: error.message});
      return;
    }
    res.status(500).json({message: "Error fetching nearby parking lots.", error: (error as Error).message});
  }
};

export const getZonesByLot = async (req: Request, res: Response) => {
  const parsedLotId = uuidSchema.safeParse(req.params.lotId);
  if (!parsedLotId.success) {
    res.status(400).json({ message: "Missing or Invalid lotId" });
    return;
  }
  const lotId = parsedLotId.data;
  try {
    const zones = await lotModel.getZonesByLot(lotId);
    res.status(200).json(zones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching zones" });
  }
};

export const favoriteLot = async (req: Request, res: Response) => {
  const parsedLotId = uuidSchema.safeParse(req.params.lotId);
  if (!parsedLotId.success) {
    res.status(400).json({ message: "Invalid lotId" });
    return;
  }
  const lotId = parsedLotId.data;
  const customerId = req.user?.id!;
  try {
    await lotModel.addFavoriteLot(customerId, lotId);
    res.status(201).json({ message: "Lot favorited successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error favoriting lot." });
  }
};

export const unfavoriteLot = async (req: Request, res: Response) => {
  const parsedLotId = uuidSchema.safeParse(req.params.lotId);
  if (!parsedLotId.success) {
    res.status(400).json({ message: "Invalid lotId" });
    return;
  }
  const lotId = parsedLotId.data;
  const customerId = req.user?.id!;
  try {
    await lotModel.removeFavoriteLot(customerId, lotId);
    res.status(200).json({ message: "Lot unfavorited successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unfavoriting lot." });
  }
};

export const getFavoriteLots = async (req: Request, res: Response) => {
  const customerId = req.user?.id!;
  try {
    const favoriteLots = await lotModel.getFavoriteLots(customerId);
    res.status(200).json(favoriteLots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching favorite lots." });
  }
};