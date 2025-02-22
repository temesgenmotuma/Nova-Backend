import express from "express";
import {
  createProvider,
  login,
  addEmployee,
} from "../Controllers/employee.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();
router.post("/auth/register", createProvider);
router.post("/auth/login", login);
router.post("/auth/invite", protect, addEmployee);

export default router;
