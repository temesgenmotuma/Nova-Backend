import express from "express";
import protect from "../Middleware/supabaseAuthMiddleware";
import {getLotPricing, getPrice, upsertLotPricing} from "../Controllers/price.controller";

const router = express.Router();

router.put('/:lotId', protect(["admin"]), upsertLotPricing);
router.get('/:lotId', protect(["admin"]), getLotPricing);
router.get('/calculate', protect(["admin"]), getPrice);

export default router;