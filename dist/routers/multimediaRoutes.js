import express from 'express';
import { multimediaController } from '../controllers/multimediaController.js';
import { upload } from '../config/multer.js';
const multimediaRouter = express.Router();
// Soporta subida de archivos física o enlace directo
multimediaRouter.post('/', upload.single('file'), multimediaController.createMultimedia);
multimediaRouter.get('/', multimediaController.BringMultimedia);
multimediaRouter.put('/:id', multimediaController.updateMultimedia);
multimediaRouter.delete('/:id', multimediaController.deleteMultimedia);
export default multimediaRouter;
