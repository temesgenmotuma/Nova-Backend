import express from "express";
import protect from "../Middleware/supabaseAuthMiddleware";
import {getLotPricing, upsertLotPricing} from "../Controllers/price.controller";

const router = express.Router();

router.put('/:lotId', protect(["admin"]), upsertLotPricing);
router.get('/:lotId', protect(["admin"]), getLotPricing);

export default router;