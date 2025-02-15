import express from 'express';
import { createLot } from 'Controllers/lot.controller';

const router = express.Router();

router.post('/', createLot);


export default router;