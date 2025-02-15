import express from'express'
import {signup, login} from '../Controllers/customer.controller.js';

const router = express.Router();

router.post('/auth/signup', signup);
router.post('/auth/login', login);


export default router;
