import { Router } from "express";
import { getVehicles, createVehicle, getVehicle, deleteVehicle } from "../Controllers/vehicle.controller";
import { nonReservationEntry, reservationEntry } from "../Controllers/entryExit.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = Router();

router.get("", protect, getVehicles);
router.get("/:vehicleId", protect, getVehicle);
router.post("", protect, createVehicle);
router.delete("/:vehicleId", protect, deleteVehicle);
router.post("/entry/walk-in", protect, nonReservationEntry);
router.post("/entry/reservation", protect, reservationEntry);

export default router;
