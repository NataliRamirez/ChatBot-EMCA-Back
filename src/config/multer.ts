import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename) // Apunta a backend/src/routers

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sube un nivel ('..') para salir de routers/ y entrar a src/uploads
    const uploadPath = path.join(__dirname, '..', 'uploads')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `file-${Date.now()}${ext}`)
  }
})

export const upload = multer({ storage })