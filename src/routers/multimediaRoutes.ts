import express from 'express'
import { multimediaController } from '../controllers/multimediaController.js'
import { upload } from '../config/multer.js'

const multimediaRouter = express.Router()

// Manejo del campo 'archivo' coincidente con el FormData del Frontend
multimediaRouter.post('/', upload.single('archivo'), multimediaController.createMultimedia)
multimediaRouter.get('/', multimediaController.BringMultimedia)
multimediaRouter.put('/:id', multimediaController.updateMultimedia)  
multimediaRouter.delete('/:id', multimediaController.deleteMultimedia) 

export default multimediaRouter