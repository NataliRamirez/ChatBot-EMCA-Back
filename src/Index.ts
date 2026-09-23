import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import helmet from 'helmet'
import { fileURLToPath } from 'url'

// Routers
import AdminRouter from './routers/adminRouter.js'
import bitacorasrouter from './routers/bitacorasRouter.js'
import contenPrincipalrouter from './routers/contenPrincipalRouter.js'
import employeRouter from './routers/employeRouter.js'
import reportrouter from './routers/reportesRouter.js'
import AyudaRouter from './routers/AyudaRouter.js'
import Perfilrouter from './routers/PerfilRouter.js'
import Solicitudesrouter from './routers/SolicitudesRouter.js'
import botRoutes from './routers/bot.routes.js'
import Loginrouter from './routers/loginRouter.js'
import multimediaRouter from './routers/multimediaRoutes.js'
import ImaganesRouter from './routers/ImagenesRouter.js'
import informesRouter from './routers/informesRouters.js'
import respuestasRouter from './routers/respuestasRouter.js'
import RecuperacionRouter from './routers/RecuperacionRouter.js'
import ComprobanteRouter from './routers/ComprobanteRouter.js'
import ConfiguracionRouter from './routers/ConfiguracionRouter.js'

// 1. Configuración de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// 2. Middlewares Base (CORS primero para cubrir uploads y API)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 3. Inicialización y Limpieza de Directorio /uploads
// 🔴 CORRECCIÓN: Apuntar a la carpeta uploads correcta (ajusta la ruta si está en la raíz)
const uploadsDir = path.resolve(__dirname, '../uploads') 

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 4. Servir la carpeta de subidas (Recurso Estático con Headers Abiertos)
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.removeHeader('Content-Security-Policy')
    res.removeHeader('X-WebKit-CSP')
    res.removeHeader('X-Content-Security-Policy')
  }
}))

// 5. Configuración de Helmet Global
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["*", "data:", "blob:", "'unsafe-inline'"],
        mediaSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://127.0.0.1:*",
          "http://localhost:*",
          "https:*"
        ],
        connectSrc: [
          "'self'",
          "http://127.0.0.1:*",
          "http://localhost:*",
          "ws://127.0.0.1:*",
          "ws://localhost:*"
        ],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
)

// 6. Endpoints Controlados de Archivos
app.get('/v1/download/:filename', (req, res) => {
  const fileName = req.params.filename
  const filePath = path.join(uploadsDir, fileName)

  if (fs.existsSync(filePath)) {
    return res.download(filePath, fileName, (err) => {
      if (err && !res.headersSent) {
        return res.status(500).json({ error: 'Error al descargar el archivo' })
      }
    })
  } else {
    return res.status(404).json({ error: 'El archivo no existe en el servidor' })
  }
})

app.get('/v1/uploads/list', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo leer la carpeta uploads' })
    }
    const fileUrls = files.map(file => ({
      name: file,
      url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
      downloadUrl: `${req.protocol}://${req.get('host')}/v1/download/${file}`
    }))
    return res.json(fileUrls)
  })
})

// 7. Rutas de la API REST
app.use('/v1/auth', Loginrouter)
app.use('/v1', botRoutes)
app.use('/v1/admin', AdminRouter)
app.use('/v1/ayuda', AyudaRouter)
app.use('/v1/perfil', Perfilrouter)
app.use('/v1/informes', informesRouter)
app.use('/v1/multimedia', multimediaRouter)
app.use('/v1/imagenes', ImaganesRouter)
app.use('/v1/bitacora', bitacorasrouter)
app.use('/v1/solicitudes', Solicitudesrouter)
app.use('/v1/respuestas', respuestasRouter)
app.use('/v1/recuperacion', RecuperacionRouter)
app.use('/v1/comprobante', ComprobanteRouter)
app.use('/v1/configuracion', ConfiguracionRouter)
app.use('/v1/employe', employeRouter)
app.use('/v1/report', reportrouter)

// 8. Servir Frontend estático (SIEMPRE DESPUÉS DE LAS RUTAS DE LA API)
app.use(express.static(path.join(__dirname, '../front')))

// 9. Levantamiento del Servidor
const PORT = Number(process.env.PORT) || 4000

app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================')
  console.log('🚀 SERVIDOR CENTRAL EMCA LISTO Y CORRIENDO')
  console.log(`🔗 URL Local: http://127.0.0.1:${PORT}`)
  console.log(`📁 Carpeta asignada: ${uploadsDir}`)
  console.log('====================================================')
})