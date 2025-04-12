"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservation_controller_1 = require("../Controllers/reservation.controller");
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const router = (0, express_1.Router)();
router.post("", supabaseAuthMiddleware_1.default, reservation_controller_1.reserve);
router.delete("/:id", supabaseAuthMiddleware_1.default, reservation_controller_1.cancelReservation);
exports.default = router;
//# sourceMappingURL=reservation.js.map