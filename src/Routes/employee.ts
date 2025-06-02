import express from "express";
// import { getLotsByProvider } from "../Controllers/lot.controller";
import protect from "../Middleware/supabaseAuthMiddleware";
import {
  createProvider,
  login,
  inviteEmployee,
  createEmployee,
  sendResetEmail,
  getEmployees
} from "../Controllers/employee.controller";

const router = express.Router();

router.post("/auth/register", createProvider);
router.post("/auth/login", login);
router.post("/invite", protect(["provider"]), inviteEmployee);
router.post("/send-reset", sendResetEmail);
router.post("", createEmployee);
router.get("/", protect(["provider"]), getEmployees);

export default router;
