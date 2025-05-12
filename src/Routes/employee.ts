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
router.post("/register", createProvider);
router.post("/login", login);
router.post("/invite", protect(["provider"]), inviteEmployee);
router.post("/send-reset", sendResetEmail);
router.post("", createEmployee);

export default router;
