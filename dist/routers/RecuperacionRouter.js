import Express from 'express';
import { RecuperacionController } from '../controllers/RecuperacionController.js';
const router = Express.Router();
router.post('/solicitar', RecuperacionController.SolicitarRecuperacion);
router.post('/restablecer', RecuperacionController.RestablecerPassword);
export default router;
