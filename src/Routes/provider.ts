import express from 'express';
import { createProvider} from '../Controllers/provider.controller.js';

const router = express.Router();
router.post('/auth/register', createProvider);
// router.post('/auth/login', login);


export default router;