import express from "express";
import { createReview, getReviews } from "../Controllers/review.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const router = express.Router();

// Route to create a new review
router.post("/", protect(["customer"]), createReview);

// Route to retrieve reviews for a specific lot
router.get("/", protect(["customer", "provider"]), getReviews);

export default router;
