import Express from 'express';
import { ConfiguracionController } from '../controllers/ConfiguracionController.js';
const router = Express.Router();
router.post('/', ConfiguracionController.CreateConfiguracion);
router.get('/', ConfiguracionController.BringConfiguracion);
router.put('/:id', ConfiguracionController.UpdateConfiguracion);
router.delete('/:id', ConfiguracionController.DeleteConfiguracion);
export default router;
