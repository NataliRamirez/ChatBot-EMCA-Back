import express from 'express';
import { informeController } from '../controllers/informeController.js';

const router = express.Router();

// 1. Rutas base
router.get('/', informeController.BringInforme);
router.post('/', informeController.createInforme);

// 2. Rutas estáticas específicas (SIEMPRE antes de /:id)
router.get('/pdf', informeController.generarPDF);
router.get('/excel', informeController.generarExcel);

// 3. Rutas dinámicas por ID
router.put('/:id', informeController.updateInforme);
router.delete('/:id', informeController.deleteInforme);

export default router;