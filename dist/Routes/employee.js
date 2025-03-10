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
router.post("/auth/register", employee_controller_1.createProvider);
router.post("/auth/login", employee_controller_1.login);
router.post("/auth/invite", supabaseAuthMiddleware_1.default, employee_controller_1.inviteEmployee);
router.post("/auth/employees", employee_controller_1.createEmployee);
router.post("/auth/employees/send-reset", employee_controller_1.sendResetEmail);
exports.default = router;
//# sourceMappingURL=employee.js.map