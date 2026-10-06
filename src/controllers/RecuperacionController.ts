import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Instanciar el transporter una sola vez para reutilizar conexiones del pool SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export class RecuperacionController {

  /**
   * Solicita el restablecimiento de contraseña enviando una notificación al correo de informática.
   */
  static async SolicitarRecuperacion(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ mensaje: 'El correo electrónico es requerido' });
      }

      const emailLimpio = email.toLowerCase().trim();

      // 1. Verificar si existe el empleado
      const [users]: any = await db.execute(
        'SELECT id, nombre, apellido, email FROM empleados WHERE LOWER(email) = ? LIMIT 1',
        [emailLimpio]
      );

      // Prevención de enumeración de usuarios:
      // Si no existe, retornamos respuesta exitosa simulada para no filtrar información.
      if (users.length === 0) {
        return res.status(200).json({
          mensaje: 'Si el correo ingresado coincide con un usuario registrado, se ha enviado la solicitud al área de informática.'
        });
      }

      const usuario = users[0];

      // 2. Generar token único y su hash para guardar en la BD
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // 3. Guardar el HASH del token y expiración en la base de datos
      const queryUpdate = 'UPDATE empleados SET reset_token = ?, reset_token_expires = ? WHERE id = ?';
      await db.execute(queryUpdate, [hashedToken, expires, usuario.id]);

      // 4. Armar enlace enviando el token en texto plano (rawToken)
      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${FRONTEND_URL}/restablecer?token=${rawToken}`;
      const CORREO_INFORMATICA = process.env.EMAIL_INFORMATICA || 'informatica@emca.com';

      // 5. Verificar credenciales antes de enviar
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Faltan credenciales EMAIL_USER o EMAIL_PASS en el .env');
        return res.status(500).json({
          mensaje: 'El servicio de correo no está configurado adecuadamente en el servidor.'
        });
      }

      // 6. Enviar correo informativo
      try {
        await transporter.sendMail({
          from: `"Soporte Sistema EMCA" <${process.env.EMAIL_USER}>`,
          to: CORREO_INFORMATICA,
          subject: `[SOLICITUD RESTABLECIMIENTO] - ${usuario.nombre} ${usuario.apellido || ''}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px;">
              <h2 style="color: #0056b3; margin-bottom: 10px;">Solicitud de Restablecimiento de Credenciales</h2>
              <p style="font-size: 15px; color: #333;">
                El usuario <strong>${usuario.nombre} ${usuario.apellido || ''}</strong> (<em>${usuario.email}</em>) ha solicitado restablecer su contraseña.
              </p>
              <p style="font-size: 14px; color: #555;">
                Como encargado de informática, haz clic en el siguiente botón para asignar la nueva contraseña a este empleado:
              </p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 15px;">
                  Restablecer Contraseña de este Usuario
                </a>
              </div>
              <p style="font-size: 13px; color: #555; margin-top: 20px;">Si el botón no abre correctamente, copia y pega el siguiente enlace directo:</p>
              <p style="font-size: 13px; word-break: break-all; color: #0056b3; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                <a href="${resetUrl}">${resetUrl}</a>
              </p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #777; font-size: 12px; margin: 0;">
                ⚠️ Este enlace es único para el usuario solicitado y caduca en 15 minutos.
              </p>
            </div>
          `
        });
      } catch (emailError: any) {
        // En caso de fallo de correo, invalidamos el token generado para mantener coherencia
        await db.execute('UPDATE empleados SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [usuario.id]);
        console.error('❌ Error de conexión SMTP (Nodemailer):', emailError.message || emailError);
        return res.status(502).json({
          mensaje: 'Error al enviar el correo SMTP. Revisa las credenciales de correo.'
        });
      }

      return res.status(200).json({
        mensaje: 'Si el correo ingresado coincide con un usuario registrado, se ha enviado la solicitud al área de informática.'
      });

    } catch (error: any) {
      console.error('❌ Error general en SolicitarRecuperacion:', error.sqlMessage || error.message || error);
      return res.status(500).json({ mensaje: 'Error interno al procesar la solicitud de recuperación' });
    }
  }

  /**
   * Consume el token enviado desde React, valida su vigencia y actualiza la contraseña.
   */
  static async RestablecerPassword(req: Request, res: Response) {
    try {
      const { token, nuevaPassword } = req.body;

      if (!token || !nuevaPassword) {
        return res.status(400).json({ mensaje: 'El token y la nueva contraseña son requeridos' });
      }

      if (typeof nuevaPassword !== 'string' || nuevaPassword.length < 8) {
        return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
      }

      // Hash del token recibido para comparar con el almacenado en BD
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // 1. Obtener usuario asociado al token encriptado
      const querySearch = 'SELECT id, reset_token_expires FROM empleados WHERE reset_token = ? LIMIT 1';
      const [rows]: any = await db.execute(querySearch, [hashedToken]);

      if (rows.length === 0) {
        return res.status(400).json({ mensaje: 'El enlace de recuperación es inválido o ya fue utilizado' });
      }

      const usuario = rows[0];
      const ahora = new Date();
      const expiracion = new Date(usuario.reset_token_expires);

      // 2. Validar expiración
      if (expiracion < ahora) {
        // Limpiar token caducado
        await db.execute('UPDATE empleados SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [usuario.id]);
        return res.status(400).json({ mensaje: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
      }

      // 3. Encriptar nueva contraseña y limpiar los tokens de la BD
      const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
      const queryUpdate = 'UPDATE empleados SET Password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?';
      await db.execute(queryUpdate, [hashedPassword, usuario.id]);

      return res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente' });

    } catch (error: any) {
      console.error('❌ Error en RestablecerPassword:', error.sqlMessage || error.message || error);
      return res.status(500).json({ mensaje: 'Error interno al cambiar la contraseña' });
    }
  }
}