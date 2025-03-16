import express from "express";

import {
  createLot,
  getNearbylots,
  getSpotsByLot,
} from "../Controllers/lot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.post("/", protect, createLot);
router.get("/:lotId/spots", protect, getSpotsByLot);
router.get("/nearby", protect, getNearbylots)

export default router;
