import { Router } from "express";
import {
  getVehicles,
  createVehicle,
  getVehicle,
  deleteVehicle,
} from "../Controllers/vehicle.controller";

import {
  nonReservationEntry,
  reservationEntry,
  nonReservationExit,
  reservationExit,
} from "../Controllers/entryExit.controller";

import { getReservationsByVehicle } from "../Controllers/reservation.controller";
import protect from "../Middleware/supabaseAuthMiddleware";
import { createValetTicket } from "../Controllers/valet.controller";

const router = Router();

router.post("/entry/walk-in", protect, nonReservationEntry);
router.post("/entry/reservation", protect, reservationEntry);
router.patch("/exit/walk-in", protect, nonReservationExit);
router.patch("/exit/reservation", protect, reservationExit);

router.post("/valet-ticket", protect, createValetTicket);

router.get("", protect, getVehicles);
router.post("", protect, createVehicle);

router.get("/:vehicleId/reservations", protect, getReservationsByVehicle);

router.get("/:vehicleId", protect, getVehicle);
router.delete("/:vehicleId", protect, deleteVehicle);

export default router;
