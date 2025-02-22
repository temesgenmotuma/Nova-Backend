import express from "express";
import { createSpot } from "../Controllers/spot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.post ("/", protect, createSpot);
// router.get ("/", protect, getSpots);

export default router;