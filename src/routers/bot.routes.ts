import { Router } from 'express';
import { BotController } from '../controllers/bot.controller.js';

const router = Router();


router.get('/users', BotController.getAllUsers); 
router.get('/user/:telefono', BotController.checkUser);
router.get('/history/:telefono', BotController.getChatHistory);
router.post('/users/register', BotController.registerUser);
router.post('/messages/guardar', BotController.guardarMensaje);
router.post('/save', BotController.saveData);
router.post('/action', BotController.handleBotAction);
router.post('/send-message', BotController.sendMessage);
router.post('/reactivar', BotController.reactivarBot);
router.post('/solicitar-asesor', BotController.solicitarAsesor);
router.post('/meta-webhook', BotController.metaWebhook);

export default router;