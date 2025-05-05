"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lot_controller_1 = require("../Controllers/lot.controller");
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const zone_controller_1 = require("../Controllers/zone.controller");
const router = express_1.default.Router();
router.get("/", supabaseAuthMiddleware_1.default, lot_controller_1.getLotsOfCurrProvider);
router.post("/", supabaseAuthMiddleware_1.default, lot_controller_1.createLot);
router.get("/:lotId/spots", supabaseAuthMiddleware_1.default, lot_controller_1.getSpotsByLot);
router.get("/nearby", supabaseAuthMiddleware_1.default, lot_controller_1.getNearbylots);
router.post("/:lotId/zones", zone_controller_1.createZone);
exports.default = router;
//# sourceMappingURL=lot.js.map