import { Router } from "express";
import { createValetTicket, makeRetreivalRequest, getRetrievalRequests, claimRetrievalRequest} from "../Controllers/valet.controller";
import protect from "../Middleware/supabaseAuthMiddleware";
const router = Router();


router.post("/valet-tickets", protect(["provider"]), createValetTicket);
router.get("/valet-tickets", protect(["provider"]), getRetrievalRequests);
router.patch("/valet-tickets/:ticketId", protect(["customer"]), makeRetreivalRequest);
router.patch("/valet-tickets/:ticketId/claim", protect(["provider"]), claimRetrievalRequest);

export default router;