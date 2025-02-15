import joi from "joi";
import { Request, Response } from "express";
import lotModel from "../Models/lot.model";

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
});

export const createLot = async (req: Request, res:Response) => {
    const {value, error} = createLotSchema.validate(req.body);
    if (error) {
      res.status(400).json({error: error.details[0].message});
      return;
    }
    try {
      const lot = await lotModel.createLot(value); 
    } catch (error) {
      console.error(error);
      res.status(500).json({error: "Error creating lot."});
    }
  };