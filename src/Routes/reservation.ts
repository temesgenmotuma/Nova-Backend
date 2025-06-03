import { Router } from "express";
import {
  cancelReservation,
  getReservations,
  reserve,
  getReservationsHistory,
} from "../Controllers/reservation.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.post("", protect(["customer"]), reserve);
router.get("", protect(["provider"]), getReservations); 
router.delete("/:id", protect(["customer"]), cancelReservation);
router.get("/history", protect(["customer"]), getReservationsHistory);

export default router;
