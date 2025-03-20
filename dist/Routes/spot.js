"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const spot_controller_1 = require("../Controllers/spot.controller");
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const router = express_1.default.Router();
router.post("/", supabaseAuthMiddleware_1.default, spot_controller_1.createSpot);
router.get("/:id", supabaseAuthMiddleware_1.default, spot_controller_1.getSpot);
router.patch("/:id", supabaseAuthMiddleware_1.default, spot_controller_1.updateSpot); //Remember to protect this routes
router.post("/reservations", supabaseAuthMiddleware_1.default, spot_controller_1.reserve);
router.delete("/reservations/:id", supabaseAuthMiddleware_1.default, spot_controller_1.cancelReservation);
exports.default = router;
//# sourceMappingURL=spot.js.map