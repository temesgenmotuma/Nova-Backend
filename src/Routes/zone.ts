import { Router } from "express";
import { createZone } from "../Controllers/zone.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.get("/:zoneId/spots", protect, )


export default router;