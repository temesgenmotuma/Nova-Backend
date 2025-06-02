import { Router } from "express";
import protect from "../Middleware/supabaseAuthMiddleware";
import { getAlerts } from "../Controllers/alert.controller";

const router = Router();

router.get("/", protect(["provider"]), getAlerts);

export default router;