import {z} from "zod";
import { Request, Response } from "express";

import lotModel from "../Models/lot.model";
import ModelError from "../Models/ModelError";
import  {reverseGeocode}  from "../utils/reverseGeocode";
import { hasPermission } from "../utils/permission";

const createLotSchema = z.object({
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

const updateLotSchema = z.object({
  name: z.string().optional(),
  capacity: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) {
      return undefined;
    }
    const num = Number(val);
    if (isNaN(num)) {
      return undefined;
    }
    return num;
  }, z.number().optional().nullable().default(null)),
  description: z.string().optional().nullable(),
  hasValet: z.preprocess( // <--- Specific preprocessing for hasValet
    (val) => {
      const sVal = String(val).toLowerCase().trim();
      if (sVal === 'true' || sVal === '1') {
        return true;
      }
      if (sVal === 'false' || sVal === '0' || sVal === '') {
        return false;
      }
      return undefined;
    },
    z.boolean().optional() 
  ),
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
  const role = req.user?.role;
  if (!hasPermission(req.user!, "create:lot")) {
    res.status(403).json({ message: `${role} is not authorized to access this.` });
    return;
  }
  
  const providerId = req.user?.providerId!;
  const value = createLotSchema.safeParse(req.body);
  if (!value.success) {
    res.status(400).json({ error: value.error.errors });
    return;
  }

  try {
    // const address = await reverseGeocode(value.data.location.latitude, value.data.location.longitude);
    const files = Array.isArray(req.files) ? req.files : [];
    const lot = await lotModel.createLot(value.data, providerId/* , address */, files);
    res.status(201).json(lot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating lot." });
  }
};

export const getSpotsByLot = async (req: Request, res: Response) => {
  const provId = req.user?.providerId!;
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

export const updateLot = async (req: Request, res: Response) => {
  const role = req.user?.role;
  const providerId = req.user?.providerId!;
  if (!hasPermission(req.user!, "update:lot")) {
    res.status(403).json({ message: `${role} is not authorized to access this.` });
    return;
  }
  
  const lotIdData = uuidSchema.safeParse(req.params.lotId!);
  if (!lotIdData.success) {
    res.status(400).json({ message: "lotId is required" });
    return;
  }
  const lotId = lotIdData.data;

  const value = updateLotSchema.safeParse(req.body);
  if (!value.success) {
    res.status(400).json({ error: value.error.errors });
    return;
  }

  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const updatedLot = await lotModel.updateLot(lotId, providerId,value.data, files);
    res.status(200).json(updatedLot);
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ error: "Error updating lot." });
  }
}

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

export const searchLots = async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== "string" || query.trim() === "") {
    res.status(400).json({ message: "Search query must be a non-empty string." });
    return;
  }

  try {
    const results = await lotModel.searchLotsByName(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Lot search failed:", error);
    res.status(500).json({ message: "Internal server error" });
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

export const isLotFavorited = async (req: Request, res: Response) => {
  const parsedLotId = uuidSchema.safeParse(req.params.lotId);
  if (!parsedLotId.success) {
    res.status(400).json({ message: "Invalid lotId" });
    return;
  }
  const lotId = parsedLotId.data;
  const customerId = req.user?.id!;
  
  try {
    const isFavorited = await lotModel.isLotFavoritedByCustomer(customerId, lotId);
    res.status(200).json({ isFavorited });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking if lot is favorited." });
  }
};
