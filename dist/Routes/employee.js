"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import { getLotsByProvider } from "../Controllers/lot.controller";
const supabaseAuthMiddleware_1 = __importDefault(require("../Middleware/supabaseAuthMiddleware"));
const employee_controller_1 = require("../Controllers/employee.controller");
const router = express_1.default.Router();
router.post("/register", employee_controller_1.createProvider);
router.post("/login", employee_controller_1.login);
router.post("/invite", supabaseAuthMiddleware_1.default, employee_controller_1.inviteEmployee);
router.post("/send-reset", employee_controller_1.sendResetEmail);
router.post("", employee_controller_1.createEmployee);
exports.default = router;
//# sourceMappingURL=employee.js.map