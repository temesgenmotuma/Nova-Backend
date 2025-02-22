"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customer_controller_js_1 = require("../Controllers/customer.controller.js");
const router = express_1.default.Router();
router.post('/auth/signup', customer_controller_js_1.signup);
router.post('/auth/login', customer_controller_js_1.login);
exports.default = router;
//# sourceMappingURL=customer.js.map