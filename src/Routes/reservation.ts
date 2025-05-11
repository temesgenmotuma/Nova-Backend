import { Router } from "express";
import {
  cancelReservation,
  reserve,
} from "../Controllers/reservation.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.post("", protect(["customer"]), reserve);
router.delete("/:id", protect(["customer"]), cancelReservation);

export default router;
