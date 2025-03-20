import {Router} from "express";
import {cancelReservation, reserve} from "../Controllers/reservation.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.post("/reservations", protect, reserve);
router.delete("/reservations/:id", protect, cancelReservation);

export default router;