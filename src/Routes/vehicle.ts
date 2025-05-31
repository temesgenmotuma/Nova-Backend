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

router.post("/entry/walk-in", protect(["provider"]), nonReservationEntry);
router.post("/entry/reservation", protect(["provider"]), reservationEntry);
router.patch("/exit/walk-in", protect(["provider"]), nonReservationExit);
router.patch("/exit/reservation", protect(["provider"]), reservationExit);

router.get("", protect(["customer"]), getVehicles);
router.post("", protect(["customer"]), createVehicle);

router.get("/:vehicleId/reservations", protect(["customer"]), getReservationsByVehicle);

router.get("/:vehicleId", protect(["customer"]), getVehicle);
router.delete("/:vehicleId", protect(["customer"]), deleteVehicle);

export default router;
