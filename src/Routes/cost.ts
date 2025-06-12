import express from "express";
import {createCost, deleteCost, getCostById, getCosts} from "../Controllers/cost.contoller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.get('/:id', protect(["admin"]), getCostById);
router.post('', protect(["admin"]), createCost);
router.get('', protect(["admin"]), getCosts);
router.delete('/:id', protect(["admin"]), deleteCost);

export default router;