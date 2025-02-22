import express from "express";

import { createLot, getSpotsByLot } from "../Controllers/lot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.post("/", protect, createLot);
// router.get("/", protect, getLotSpots);
router.get("/:lotId/spots", protect, getSpotsByLot);


export default router;
