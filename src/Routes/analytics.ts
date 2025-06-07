import express from "express";
import {
  getPeakHour,
  getTotalActiveReservations,
  getCurrentlyAssignedValets,
  aggregateAnalytics,
} from "../Controllers/analytics.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

router.get("/aggregate", protect(["admin"]), aggregateAnalytics)
router.get("/peak-hours", protect(["provider"]), getPeakHour);
router.get("/active-reservations", protect(["provider"]), getTotalActiveReservations);
router.get("/assigned-valets", protect(["provider"]), getCurrentlyAssignedValets);

export default router;
