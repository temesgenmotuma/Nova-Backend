import { getLotsByProvider } from "../Controllers/provider.controller";
import { Router } from "express";

const router = Router();

router.get('/:providerId/lots', getLotsByProvider);


export default router;