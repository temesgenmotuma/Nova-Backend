"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../Controllers/vehicle.controller");
const entryExit_controller_1 = require("../Controllers/entryExit.controller");
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const valet_controller_1 = require("../Controllers/valet.controller");
const router = (0, express_1.Router)();
router.get("", supabaseAuthMiddleware_1.default, vehicle_controller_1.getVehicles);
router.get("/:vehicleId", supabaseAuthMiddleware_1.default, vehicle_controller_1.getVehicle);
router.post("", supabaseAuthMiddleware_1.default, vehicle_controller_1.createVehicle);
router.delete("/:vehicleId", supabaseAuthMiddleware_1.default, vehicle_controller_1.deleteVehicle);
router.post("/entry/walk-in", supabaseAuthMiddleware_1.default, entryExit_controller_1.nonReservationEntry);
router.post("/entry/reservation", supabaseAuthMiddleware_1.default, entryExit_controller_1.reservationEntry);
router.post("/valet-ticket", supabaseAuthMiddleware_1.default, valet_controller_1.createValetTicket);
exports.default = router;
//# sourceMappingURL=vehicle.js.map