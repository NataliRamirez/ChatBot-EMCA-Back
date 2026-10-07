
import { type Request, type Response } from "express";
import { db } from "../config/db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// ======================================================
// CORREO DEL ÁREA DE INFORMÁTICA
// ======================================================

const CORREO_INFORMATICA =
  process.env.EMAIL_INFORMATICA || "informatica@emca.com";


// ======================================================
// CONFIGURACIÓN DEL TRANSPORTER SMTP
// ======================================================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",

  port: Number(process.env.EMAIL_PORT) || 587,

  secure: process.env.EMAIL_SECURE === "true",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },
});


// ======================================================
// CONTROLADOR DE RECUPERACIÓN
// ======================================================

export class RecuperacionController {

  // ====================================================
  // SOLICITAR RECUPERACIÓN
  // ====================================================

  static async SolicitarRecuperacion(
    req: Request,
    res: Response
  ) {

    try {

      const { email } = req.body;


      // ================================================
      // VALIDAR CORREO
      // ================================================

      if (
        !email ||
        typeof email !== "string"
      ) {

        return res.status(400).json({
          mensaje: "El correo electrónico es requerido",
        });
      }


      const emailLimpio =
        email.toLowerCase().trim();


      // ================================================
      // BUSCAR EMPLEADO
      // ================================================

      const [users]: any = await db.execute(
        `
        SELECT
          id,
          nombre,
          apellido,
          email
        FROM empleados
        WHERE LOWER(email) = ?
        LIMIT 1
        `,
        [emailLimpio]
      );


      // ================================================
      // PREVENCIÓN DE ENUMERACIÓN
      // ================================================

      if (users.length === 0) {

        return res.status(200).json({
          mensaje:
            "Si el correo ingresado coincide con un usuario registrado, se ha enviado la solicitud al área de informática.",
        });
      }


      const usuario = users[0];


      // ================================================
      // VALIDAR CONFIGURACIÓN DEL CORREO
      // ================================================

      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
      ) {

        console.error(
          "❌ Faltan EMAIL_USER o EMAIL_PASS en el archivo .env"
        );

        return res.status(500).json({
          mensaje:
            "El servicio de correo no está configurado adecuadamente en el servidor.",
        });
      }


      // ================================================
      // GENERAR TOKEN
      // ================================================

      const rawToken =
        crypto.randomBytes(32).toString("hex");


      // Guardamos solamente el hash del token
      const hashedToken =
        crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");


      // Token válido durante 15 minutos
      const expires =
        new Date(
          Date.now() + 15 * 60 * 1000
        );


      // ================================================
      // GUARDAR TOKEN EN BASE DE DATOS
      // ================================================

      const queryUpdate = `
        UPDATE empleados
        SET
          reset_token = ?,
          reset_token_expires = ?
        WHERE id = ?
      `;

      await db.execute(
        queryUpdate,
        [
          hashedToken,
          expires,
          usuario.id,
        ]
      );


      // ================================================
      // CONSTRUIR URL DE RESTABLECIMIENTO
      // ================================================

      const FRONTEND_URL =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";


      const resetUrl =
        `${FRONTEND_URL}/restablecer?token=${rawToken}`;


      // ================================================
      // ENVIAR CORREO
      // ================================================

      try {

        await transporter.sendMail({

          from:
            `"Soporte Sistema EMCA" <${process.env.EMAIL_USER}>`,

          to:
            CORREO_INFORMATICA,

          subject:
            `[SOLICITUD RESTABLECIMIENTO] - ${usuario.nombre} ${usuario.apellido || ""}`,

          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                padding: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                max-width: 600px;
                margin: auto;
              "
            >

              <h2
                style="
                  color: #0056b3;
                  margin-bottom: 10px;
                "
              >
                Solicitud de Restablecimiento de Credenciales
              </h2>


              <p
                style="
                  font-size: 15px;
                  color: #333;
                "
              >
                El usuario
                <strong>
                  ${usuario.nombre}
                  ${usuario.apellido || ""}
                </strong>
                (<em>${usuario.email}</em>)
                ha solicitado restablecer su contraseña de acceso.
              </p>


              <p
                style="
                  font-size: 14px;
                  color: #555;
                "
              >
                Como encargado de informática, haz clic
                en el siguiente botón para asignar la nueva
                contraseña a este empleado:
              </p>


              <div
                style="
                  text-align: center;
                  margin: 25px 0;
                "
              >

                <a
                  href="${resetUrl}"
                  style="
                    background-color: #28a745;
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    font-weight: bold;
                    font-size: 15px;
                  "
                >
                  Restablecer Contraseña de este Usuario
                </a>

              </div>


              <p
                style="
                  font-size: 13px;
                  color: #555;
                  margin-top: 20px;
                "
              >
                Si el botón no abre correctamente,
                copia y pega el siguiente enlace directo
                en tu navegador:
              </p>


              <p
                style="
                  font-size: 13px;
                  word-break: break-all;
                  color: #0056b3;
                  background-color: #f8f9fa;
                  padding: 10px;
                  border-radius: 4px;
                "
              >

                <a href="${resetUrl}">
                  ${resetUrl}
                </a>

              </p>


              <hr
                style="
                  border: 0;
                  border-top: 1px solid #eee;
                  margin: 20px 0;
                "
              />


              <p
                style="
                  color: #777;
                  font-size: 12px;
                  margin: 0;
                "
              >
                ⚠️ Este enlace es único para el usuario
                solicitado y caduca en 15 minutos.
              </p>

            </div>
          `,
        });

      } catch (emailError: any) {

        // ============================================
        // SI FALLA EL CORREO, INVALIDAR TOKEN
        // ============================================

        await db.execute(
          `
          UPDATE empleados
          SET
            reset_token = NULL,
            reset_token_expires = NULL
          WHERE id = ?
          `,
          [usuario.id]
        );


        console.error(
          "❌ Error de conexión SMTP:",
          emailError?.message || emailError
        );


        return res.status(502).json({
          mensaje:
            "Error al enviar el correo SMTP. Revisa las credenciales de correo.",
        });
      }


      // ================================================
      // RESPUESTA FINAL
      // ================================================

      return res.status(200).json({

        mensaje:
          "Si el correo ingresado coincide con un usuario registrado, se ha enviado la solicitud al área de informática.",
      });


    } catch (error: any) {

      console.error(
        "❌ Error general en SolicitarRecuperacion:",
        error?.sqlMessage ||
        error?.message ||
        error
      );


      return res.status(500).json({
        mensaje:
          "Error interno al procesar la solicitud de recuperación",
      });
    }
  }


  // ====================================================
  // RESTABLECER CONTRASEÑA
  // ====================================================

  static async RestablecerPassword(
    req: Request,
    res: Response
  ) {

    try {

      const {
        token,
        nuevaPassword,
      } = req.body;


      // ================================================
      // VALIDAR DATOS
      // ================================================

      if (
        !token ||
        !nuevaPassword
      ) {

        return res.status(400).json({
          mensaje:
            "El token y la nueva contraseña son requeridos",
        });
      }


      if (
        typeof nuevaPassword !== "string" ||
        nuevaPassword.length < 8
      ) {

        return res.status(400).json({
          mensaje:
            "La contraseña debe tener al menos 8 caracteres",
        });
      }


      // ================================================
      // HASH DEL TOKEN RECIBIDO
      // ================================================

      const hashedToken =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");


      // ================================================
      // BUSCAR USUARIO POR TOKEN
      // ================================================

      const querySearch = `
        SELECT
          id,
          reset_token_expires
        FROM empleados
        WHERE reset_token = ?
        LIMIT 1
      `;


      const [rows]: any =
        await db.execute(
          querySearch,
          [hashedToken]
        );


      if (rows.length === 0) {

        return res.status(400).json({
          mensaje:
            "El enlace de recuperación es inválido o ya fue utilizado",
        });
      }


      const usuario =
        rows[0];


      // ================================================
      // VALIDAR EXPIRACIÓN
      // ================================================

      const ahora =
        new Date();


      const expiracion =
        new Date(
          usuario.reset_token_expires
        );


      if (
        !usuario.reset_token_expires ||
        expiracion < ahora
      ) {

        // Eliminar token vencido

        await db.execute(
          `
          UPDATE empleados
          SET
            reset_token = NULL,
            reset_token_expires = NULL
          WHERE id = ?
          `,
          [usuario.id]
        );


        return res.status(400).json({
          mensaje:
            "El enlace de recuperación ha expirado. Solicita uno nuevo.",
        });
      }


      // ================================================
      // ENCRIPTAR NUEVA CONTRASEÑA
      // ================================================

      const hashedPassword =
        await bcrypt.hash(
          nuevaPassword,
          10
        );


      // ================================================
      // ACTUALIZAR CONTRASEÑA
      // Y ELIMINAR TOKEN
      // ================================================

      const queryUpdate = `
        UPDATE empleados
        SET
          Password_hash = ?,
          reset_token = NULL,
          reset_token_expires = NULL
        WHERE id = ?
      `;


      await db.execute(
        queryUpdate,
        [
          hashedPassword,
          usuario.id,
        ]
      );


      // ================================================
      // RESPUESTA
      // ================================================

      return res.status(200).json({

        mensaje:
          "Contraseña actualizada exitosamente",
      });


    } catch (error: any) {

      console.error(
        "❌ Error en RestablecerPassword:",
        error?.sqlMessage ||
        error?.message ||
        error
      );


      return res.status(500).json({
        mensaje:
          "Error interno al cambiar la contraseña",
      });
    }
  }
}
