"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const router = (0, express_1.Router)();
router.get("/:zoneId/spots", supabaseAuthMiddleware_1.default);
exports.default = router;
//# sourceMappingURL=zone.js.map