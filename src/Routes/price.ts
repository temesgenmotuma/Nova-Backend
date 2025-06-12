import express from "express";
import protect from "../Middleware/supabaseAuthMiddleware";
import {getLotPricing, getPrice, upsertLotPricing} from "../Controllers/price.controller";

const router = express.Router();

router.put('/:lotId', protect(["provider"]), upsertLotPricing);
router.get('/:lotId', protect(["provider", "customer"]), getLotPricing);
router.get('/calculate', protect(["customer"]), getPrice);

export default router;