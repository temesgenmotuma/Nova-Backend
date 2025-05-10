import express from "express";

import {
  createLot,
  getNearbylots,
  getSpotsByLot,
  getLotsOfCurrProvider,
  getZonesByLot,
} from "../Controllers/lot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";
import { createZone } from "../Controllers/zone.controller";

const router = express.Router();

router.get("/", protect, getLotsOfCurrProvider);
router.post("/", protect, createLot);
router.get("/nearby", protect, getNearbylots)

router.get("/:lotId/spots", protect, getSpotsByLot);

router.post("/:lotId/zones", protect, createZone);
router.get("/:lotId/zones", protect, getZonesByLot);


export default router;
