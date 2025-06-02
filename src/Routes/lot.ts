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

router.get("/", protect(["provider"]), getLotsOfCurrProvider);
router.post("/", protect(["provider"]), createLot);
router.get("/nearby", protect(["customer"]), getNearbylots)

router.get("/:lotId/spots", protect(["provider"]), getSpotsByLot);

router.post("/:lotId/zones", protect(["provider"]), createZone);
router.get("/:lotId/zones", protect(["provider", "customer"]), getZonesByLot);


export default router;
