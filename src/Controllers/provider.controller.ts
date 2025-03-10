import { Request, Response } from "express";
import providerModel from "../Models/provider.model";


export const getLotsByProvider = async (req: Request, res: Response) => {
    const {providerId} = req.params;
    try {
      const Lots = await providerModel.getLotsByProvider(providerId);
      res.json(Lots);
    } catch (error) {
      console.error(error);
      res.status(500).json({message: "Error fetching Lots.", error});
    }
  }