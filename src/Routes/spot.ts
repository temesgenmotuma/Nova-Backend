import express from "express";
import {
  createSpot,
  getSpot,
  updateSpot,
} from "../Controllers/spot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.post("/", protect, createSpot);
router.get("/:id", protect, getSpot);
router.patch("/:id", protect, updateSpot); //Remember to protect this routes



export default router;
