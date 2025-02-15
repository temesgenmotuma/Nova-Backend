"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const provider_controller_js_1 = require("../Controllers/provider.controller.js");
const router = express_1.default.Router();
router.post('/register', provider_controller_js_1.create);
exports.default = router;
//# sourceMappingURL=providerRoute.js.map