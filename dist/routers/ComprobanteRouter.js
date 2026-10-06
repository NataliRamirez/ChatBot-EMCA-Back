import Express from 'express';
import { ComprobanteController } from '../controllers/ComprobanteController.js';
const router = Express.Router();
router.post('/', ComprobanteController.CreateComprobante);
router.get('/', ComprobanteController.BringComprobante);
router.put('/:id', ComprobanteController.UpdateComprobante);
router.delete('/:id', ComprobanteController.DeleteComprobante);
export default router;
