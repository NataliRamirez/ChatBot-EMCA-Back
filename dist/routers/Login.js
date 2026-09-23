import Express from 'express';
import { authController } from '../controllers/auth.controller.js';
const router = Express.Router();
router.post('/login', authController.login);
router.post('/register', authController.register);
export default router;
