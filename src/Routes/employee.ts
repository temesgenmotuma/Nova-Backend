import express from "express";
// import { getLotsByProvider } from "../Controllers/lot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";
import {
  createProvider,
  login,
  inviteEmployee,
  createEmployee,
  sendResetEmail
} from "../Controllers/employee.controller";


const router = express.Router();
router.post("/auth/register", createProvider);
router.post("/auth/login", login);
router.post("/auth/invite", protect, inviteEmployee);
router.post("/auth/employees", createEmployee);
router.post("/auth/employees/send-reset", sendResetEmail);

export default router;
