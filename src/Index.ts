import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

// =========================================================
// ROUTERS
// =========================================================

import AdminRouter from './routers/adminRouter.js';
import bitacorasrouter from './routers/bitacorasRouter.js';
import contenPrincipalrouter from './routers/contenPrincipalRouter.js';
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

// =========================================================
// __DIRNAME
// =========================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

// =========================================================
// APP
// =========================================================

const app =
  express();

// =========================================================
// CORS
// =========================================================

app.use(
  cors({
    origin: '*',

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'x-api-key',
      'Authorization'
    ]
  })
);

// =========================================================
// BODY
// =========================================================

app.use(
  express.json({
    limit: '20mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '20mb'
  })
);

// =========================================================
// CARPETA UPLOADS
// =========================================================
//
// Esta debe ser:
// backend/uploads
//
// Si existe UPLOADS_DIR en .env,
// se utilizará esa ruta.
//

const uploadsDir =
  process.env.UPLOADS_DIR
    ? path.resolve(
        process.env.UPLOADS_DIR
      )
    : path.resolve(
        process.cwd(),
        'uploads'
      );

// =========================================================
// CREAR CARPETA SI NO EXISTE
// =========================================================

if (
  !fs.existsSync(
    uploadsDir
  )
) {

  fs.mkdirSync(
    uploadsDir,
    {
      recursive: true
    }
  );

  console.log(
    '📁 Carpeta uploads creada:',
    uploadsDir
  );

} else {

  console.log(
    '📁 Carpeta uploads encontrada:',
    uploadsDir
  );

}

// =========================================================
// SERVIR ARCHIVOS MULTIMEDIA
// =========================================================

app.use(
  '/uploads',
  express.static(
    uploadsDir,
    {
      fallthrough: true,

      setHeaders: (
        res
      ) => {

        res.setHeader(
          'Access-Control-Allow-Origin',
          '*'
        );

        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, HEAD, OPTIONS'
        );

        res.setHeader(
          'Access-Control-Allow-Headers',
          '*'
        );

        res.setHeader(
          'Cross-Origin-Resource-Policy',
          'cross-origin'
        );

      }
    }
  )
);

// =========================================================
// DEBUG /UPLOADS
// =========================================================

app.get(
  '/uploads/:filename',
  (req, res) => {

    const fileName =
      path.basename(
        req.params.filename
      );

    const filePath =
      path.join(
        uploadsDir,
        fileName
      );

    console.log(
      '📂 Solicitud de archivo:',
      {
        fileName,
        filePath,
        existe:
          fs.existsSync(
            filePath
          )
      }
    );

    if (
      !fs.existsSync(
        filePath
      )
    ) {

      return res.status(
        404
      ).json({
        success: false,
        error:
          'Archivo no encontrado',
        fileName
      });

    }

    return res.sendFile(
      filePath
    );
  }
);

// =========================================================
// HELMET
// =========================================================

app.use(
  helmet({
    contentSecurityPolicy: {

      directives: {

        defaultSrc: [
          "'self'"
        ],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'"
        ],

        imgSrc: [
          "*",
          "data:",
          "blob:",
          "'unsafe-inline'"
        ],

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

        workerSrc: [
          "'self'",
          "blob:"
        ],

        objectSrc: [
          "'none'"
        ]
      }
    },

    crossOriginResourcePolicy: {
      policy:
        'cross-origin'
    }
  })
);

// =========================================================
// DESCARGAR ARCHIVO
// =========================================================

app.get(
  '/v1/download/:filename',
  (req, res) => {

    const fileName =
      path.basename(
        req.params.filename
      );

    const filePath =
      path.join(
        uploadsDir,
        fileName
      );

    if (
      !fs.existsSync(
        filePath
      )
    ) {

      return res.status(
        404
      ).json({
        success: false,
        error:
          'El archivo no existe en el servidor',
        fileName
      });

    }

    return res.download(
      filePath,
      fileName,
      (err) => {

        if (
          err &&
          !res.headersSent
        ) {

          return res.status(
            500
          ).json({
            success: false,
            error:
              'Error al descargar el archivo'
          });

        }

      }
    );
  }
);

// =========================================================
// LISTAR ARCHIVOS
// =========================================================

app.get(
  '/v1/uploads/list',
  (req, res) => {

    fs.readdir(
      uploadsDir,
      (err, files) => {

        if (err) {

          return res.status(
            500
          ).json({
            success: false,
            error:
              'No se pudo leer la carpeta uploads'
          });

        }

        const host =
          `${req.protocol}://${req.get('host')}`;

        const fileUrls =
          files.map(
            (file) => ({

              name:
                file,

              url:
                `${host}/uploads/${encodeURIComponent(
                  file
                )}`,

              downloadUrl:
                `${host}/v1/download/${encodeURIComponent(
                  file
                )}`

            })
          );

        return res.json(
          fileUrls
        );

      }
    );
  }
);

// =========================================================
// API ROUTES
// =========================================================

app.use(
  '/v1/auth',
  Loginrouter
);

app.use(
  '/v1',
  botRoutes
);

app.use(
  '/v1/admin',
  AdminRouter
);

app.use(
  '/v1/ayuda',
  AyudaRouter
);

app.use(
  '/v1/perfil',
  Perfilrouter
);

app.use(
  '/v1/informes',
  informesRouter
);

app.use(
  '/v1/multimedia',
  multimediaRouter
);

app.use(
  '/v1/imagenes',
  ImaganesRouter
);

app.use(
  '/v1/bitacora',
  bitacorasrouter
);

app.use(
  '/v1/solicitudes',
  Solicitudesrouter
);

app.use(
  '/v1/respuestas',
  respuestasRouter
);

app.use(
  '/v1/recuperacion',
  RecuperacionRouter
);

app.use(
  '/v1/comprobante',
  ComprobanteRouter
);

app.use(
  '/v1/configuracion',
  ConfiguracionRouter
);

app.use(
  '/v1/employe',
  employeRouter
);

app.use(
  '/v1/report',
  reportrouter
);

// =========================================================
// FRONTEND
// =========================================================

app.use(
  express.static(
    path.join(
      __dirname,
      '../front'
    )
  )
);

// =========================================================
// 404 API
// =========================================================

app.use(
  '/v1',
  (req, res) => {

    return res.status(
      404
    ).json({
      success: false,
      error:
        'Ruta API no encontrada',
      method:
        req.method,
      path:
        req.originalUrl
    });

  }
);

// =========================================================
// SERVIDOR
// =========================================================

const PORT =
  Number(
    process.env.PORT
  ) || 4000;

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      '===================================================='
    );

    console.log(
      '🚀 SERVIDOR CENTRAL EMCA LISTO'
    );

    console.log(
      `🔗 URL Local: http://127.0.0.1:${PORT}`
    );

    console.log(
      `📁 Carpeta uploads: ${uploadsDir}`
    );

    console.log(
      '===================================================='
    );

  }
);