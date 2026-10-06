import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Routers
import AdminRouter from './routers/adminRouter.js';
import bitacorasrouter from './routers/bitacorasRouter.js';
import employeRouter from './routers/employeRouter.js';
import reportrouter from './routers/reportesRouter.js';
import AyudaRouter from './routers/AyudaRouter.js';
import Perfilrouter from './routers/PerfilRouter.js';
import Solicitudesrouter from './routers/SolicitudesRouter.js';
import botRoutes from './routers/bot.routes.js';
import Loginrouter from './routers/loginRouter.js';
import multimediaRouter from './routers/multimediaRoutes.js';
import ImaganesRouter from './routers/ImagenesRouter.js';
import informesRouter from './routers/informesRouters.js';
import respuestasRouter from './routers/respuestasRouter.js';
import RecuperacionRouter from './routers/RecuperacionRouter.js';
import ComprobanteRouter from './routers/ComprobanteRouter.js';
import ConfiguracionRouter from './routers/ConfiguracionRouter.js';
// 1. Configuración de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// 2. Middlewares base
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 3. Crear carpeta uploads si no existe y exponerla estáticamente
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
// 4. Endpoint adicional opcional para consultar los archivos guardados en /uploads
app.get('/v1/uploads/list', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudo leer la carpeta uploads' });
        }
        const fileUrls = files.map(file => ({
            name: file,
            url: `http://127.0.0.1:4000/uploads/${file}`
        }));
        return res.json(fileUrls);
    });
});
// 5. Rutas de la API
app.use('/v1/auth', Loginrouter);
app.use('/v1', botRoutes);
app.use('/v1/admin', AdminRouter);
app.use('/v1/ayuda', AyudaRouter);
app.use('/v1/perfil', Perfilrouter);
app.use('/v1/informes', informesRouter);
app.use('/v1/multimedia', multimediaRouter);
app.use('/v1/imagenes', ImaganesRouter);
app.use('/v1/bitacora', bitacorasrouter);
app.use('/v1/solicitudes', Solicitudesrouter);
app.use('/v1/respuestas', respuestasRouter);
app.use('/v1/recuperacion', RecuperacionRouter);
app.use('/v1/comprobante', ComprobanteRouter);
app.use('/v1/configuracion', ConfiguracionRouter);
app.use('/v1/employe', employeRouter);
app.use('/v1/report', reportrouter);
app.use(express.static('front'));
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================================');
    console.log('🚀 SERVIDOR CENTRAL EMCA LISTO Y CORRIENDO');
    console.log(`🔗 URL Local: http://127.0.0.1:${PORT}`);
    console.log('📁 Carpeta /uploads lista y pública');
    console.log('====================================================');
});
