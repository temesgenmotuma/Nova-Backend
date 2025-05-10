import { Router } from "express";
import { createZone, getSpotsOfZone } from "../Controllers/zone.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.get("/:zoneId/spots", protect, getSpotsOfZone);


export default router;