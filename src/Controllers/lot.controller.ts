import joi from "joi";
import {z} from "zod";
import { Request, Response } from "express";
import lotModel from "../Models/lot.model";

const spotSchema = joi.object({
  numberOfSpots: joi.number().integer().empty("").default(0),
    startingNumber: joi.number().integer().default(1).empty(""),
    name: joi.string().default("P").empty(""),
    floor: joi.number().integer().empty("").optional(),
});

//TODO: numberOfSpots < capacity
export const createLotSchema = joi.object({
  name: joi.string().required(),
  capacity: joi.number().required(),
  location: joi.object({
    latitude: joi.number().required(),
    longitude: joi.number().required(),
  }),
  // address: joi.object({
  //   region: joi.string(),
  //   city: joi.string(),
  //   woreda: joi.string(),
  // }),
  // spot: joi.alternatives().try(spotSchema).default({}).optional(),
});

const nearbyLotsQuerySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radius: z.coerce.number().optional().default(500), // default radius in meters
});

const uuidSchema = z.string().uuid();

export type nearbyLotsQueryType = z.infer<typeof nearbyLotsQuerySchema>;

export const getLotsOfCurrProvider = async (req: Request, res: Response) => {
  const providerId = req.user?.providerId!;
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
  const { value, error } = createLotSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  try {
    const lot = await lotModel.createLot(value, providerId);
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
    //get spots of a the current provider and a particular lot.
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
}