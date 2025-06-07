import { Router } from "express";
import { createZone, getSpotsOfZone, getZoneById } from "../Controllers/zone.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.get("/:zoneId/spots", protect(["provider"]), getSpotsOfZone);
router.get("/:zoneId", protect(["provider"]), getZoneById);

export default router;