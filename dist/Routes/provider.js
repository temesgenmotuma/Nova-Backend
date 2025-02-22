"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const provider_controller_js_1 = require("../Controllers/provider.controller.js");
const router = express_1.default.Router();
router.post('/auth/register', provider_controller_js_1.createProvider);
// router.post('/auth/login', login);
exports.default = router;
//# sourceMappingURL=provider.js.map