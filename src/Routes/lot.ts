import express from "express";

import {
  createLot,
  getNearbylots,
  getSpotsByLot,
  getLotsOfCurrProvider,
} from "../Controllers/lot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";
import { createZone } from "../Controllers/zone.controller";

const router = express.Router();

router.get("/", protect, getLotsOfCurrProvider);
router.post("/", protect, createLot);
router.get("/:lotId/spots", protect, getSpotsByLot);
router.get("/nearby", protect, getNearbylots)
router.post("/:lotId/zones", createZone);


export default router;
