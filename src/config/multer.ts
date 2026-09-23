import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

 /**
  * @author Juan David Nieto
  * Ruta del archivo actual
  * En módulos ES no existe la variable global __filename, por lo que se obtiene a partir de import.meta.url.
 *
 * @type {string}
 */
const __filename = fileURLToPath(import.meta.url)

 /**
  *  En este caso apunta al directorio donde se encuentra el router o configuración de carga de archivos.
 *
 * @type {string}
 */
const __dirname = path.dirname(__filename) // Apunta a backend/src/routers

/**
 * Configuración de almacenamiento para Multer.
 *
 * Define la ubicación física donde se guardarán los archivos subidos al servidor y establece un nombre 
 * único para evitar conflictos entre archivos con el mismo nombre.
 *
 * @type {multer.StorageEngine}
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `file-${Date.now()}${ext}`)
  }
})

/**
 * Middleware de carga de archivos.
 *
 * Permite procesar archivos enviados mediante formularios multipart/form-data utilizando
 * la configuración de almacenamiento definida.
 *
 * @type {multer.Multer}
 */
export const upload = multer({ storage })