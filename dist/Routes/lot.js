"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lot_controller_1 = require("../Controllers/lot.controller");
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const router = express_1.default.Router();
router.post("/", supabaseAuthMiddleware_1.default, lot_controller_1.createLot);
// router.get("/", protect, getLotSpots);
router.get("/:lotId/spots", supabaseAuthMiddleware_1.default, lot_controller_1.getSpotsByLot);
exports.default = router;
//# sourceMappingURL=lot.js.map