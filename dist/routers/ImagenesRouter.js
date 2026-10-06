import Express from 'express';
import { ImagenesController } from '../controllers/ImagenesController.js';
const router = Express.Router();
router.get('/', ImagenesController.BringImagenes);
router.post('/', ImagenesController.CreateImagenes);
export default router;
