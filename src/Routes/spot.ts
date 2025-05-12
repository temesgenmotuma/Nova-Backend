import express from "express";
import {
  createSpot,
  getSpot,
  updateSpot,
} from "../Controllers/spot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.post("/", protect(["provider"]), createSpot);
router.get("/:id", protect(["provider"]), getSpot);
router.patch("/:id", protect(["provider"]), updateSpot); //Remember to protect this routes



export default router;
