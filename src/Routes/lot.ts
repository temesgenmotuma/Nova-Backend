import express from "express";
import upload from "../Middleware/upload";

import {
  createLot,
  getNearbylots,
  getSpotsByLot,
  getLotsOfCurrProvider,
  getZonesByLot,
  favoriteLot,
  getFavoriteLots,
  unfavoriteLot,
  isLotFavorited,
  updateLot,
  searchLots
} from "../Controllers/lot.controller";
import { createZone } from "../Controllers/zone.controller";
import protect from "../Middleware/supabaseAuthMiddleware";


const router = express.Router();


router.get("/", protect(["provider"]), getLotsOfCurrProvider);
router.post("/", protect(["provider"]), upload.array('images'), createLot);
router.patch("/:lotId", protect(["provider"]), upload.array('images'), updateLot);
router.get("/nearby", protect(["customer"]), getNearbylots)
router.get('/search', protect(["customer"]), searchLots);

router.get("/:lotId/spots", protect(["provider"]), getSpotsByLot);

router.post("/:lotId/zones", protect(["provider"]), createZone);
router.get("/:lotId/zones", protect(["provider", "customer"]), getZonesByLot);

router.post("/:lotId/favorite", protect(["customer"]), favoriteLot);
router.delete("/:lotId/favorite", protect(["customer"]), unfavoriteLot);
router.get("/favorites", protect(["customer"]), getFavoriteLots);
router.get("/:lotId/favorite", protect(["customer"]), isLotFavorited);

export default router;
