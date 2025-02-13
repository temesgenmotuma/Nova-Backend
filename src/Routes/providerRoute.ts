import express from 'express';
import { create } from '../Controllers/provider.controller';

const router = express.Router();
router.post('/register', create);

export default router;