import Express from 'express';
import { respuestasController } from '../controllers/respuestasController.js';

const router = Express.Router();
router.get('/', respuestasController.BringRespuestas);
router.get('/pdf', respuestasController.generarPDF);     
router.get('/excel', respuestasController.descargarExcel); 

router.get('/', respuestasController.BringRespuestas);
router.post('/', respuestasController.CreateRespuestas);
router.put('/:id', respuestasController.UpdateRespuestas);
router.delete('/:id', respuestasController.DeleteRespuestas);

export default router;