import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Correo de la persona encargada de informática que recibirá los enlaces de restablecimiento
const CORREO_INFORMATICA = process.env.EMAIL_INFORMATICA || 'informatica@emca.com';

// Configuración del servicio SMTP de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class RecuperacionController {

  /**
   * Recibe el correo del usuario que requiere el restablecimiento,
   * valida su existencia en MySQL y envía el token de cambio con enlace visible AL CORREO DE INFORMÁTICA.
   */
  static async SolicitarRecuperacion(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ mensaje: 'El correo electrónico es requerido' });
      }

      const emailLimpio = email.toLowerCase().trim();

      // 1. Verificar si existe el empleado en la base de datos
      const [users]: any = await db.execute(
        'SELECT id, nombre, apellido, email FROM empleados WHERE LOWER(email) = ? LIMIT 1', 
        [emailLimpio]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ mensaje: 'No existe un usuario registrado con este correo' });
      }

      const usuario = users[0];

      // 2. Generar token único (válido por 15 minutos)
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); 

      // 3. Guardar el token en la tabla empleados
      const queryUpdate = 'UPDATE empleados SET reset_token = ?, reset_token_expires = ? WHERE id = ?';
      await db.execute(queryUpdate, [token, expires, usuario.id]);

      // 4. Armar enlace para el Frontend (React)
      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${FRONTEND_URL}/restablecer?token=${token}`;

      // 5. Enviar correo informativo con botón Y enlace en texto plano al encargado de informática
      await transporter.sendMail({
        from: `"Soporte Sistema EMCA" <${process.env.EMAIL_USER}>`,
        to: CORREO_INFORMATICA,
        subject: `[SOLICITUD RESTABLECIMIENTO] - ${usuario.nombre} ${usuario.apellido || ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px;">
            <h2 style="color: #0056b3; margin-bottom: 10px;">Solicitud de Restablecimiento de Credenciales</h2>
            <p style="font-size: 15px; color: #333;">
              El usuario <strong>${usuario.nombre} ${usuario.apellido || ''}</strong> (<em>${usuario.email}</em>) ha solicitado restablecer su contraseña de acceso.
            </p>
            <p style="font-size: 14px; color: #555;">
              Como encargado de informática, haz clic en el siguiente botón para asignar la nueva contraseña a este empleado:
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 15px;">
                Restablecer Contraseña de este Usuario
              </a>
            </div>
            
            <p style="font-size: 13px; color: #555; margin-top: 20px;">Si el botón no abre correctamente, copia y pega el siguiente enlace directo en tu navegador:</p>
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

      return res.status(200).json({ 
        mensaje: 'La solicitud ha sido enviada al encargado de informática. Ponte en contacto con el área encargada para completar el restablecimiento.' 
      });

    } catch (error: any) {
      console.error('❌ Error en SolicitarRecuperacion:', error.sqlMessage || error.message || error);
      return res.status(500).json({ mensaje: 'Error interno al procesar la solicitud de recuperación' });
    }
  }

  /**
   * Consume el token enviado desde React, valida su vigencia en MySQL y
   * actualiza la columna 'Password_hash' para establecer la nueva contraseña.
   */
  static async RestablecerPassword(req: Request, res: Response) {
    try {
      const { token, nuevaPassword } = req.body;

      if (!token || !nuevaPassword) {
        return res.status(400).json({ mensaje: 'El token y la nueva contraseña son requeridos' });
      }

      // 1. Validar que exista un token vigente
      const querySearch = 'SELECT id FROM empleados WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1';
      const [rows]: any = await db.execute(querySearch, [token]);

      if (rows.length === 0) {
        return res.status(400).json({ mensaje: 'El enlace de recuperación es inválido o ha expirado' });
      }

      const userId = rows[0].id;
      const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

      // 2. Actualizar la clave y limpiar los tokens de la BD
      const queryUpdate = 'UPDATE empleados SET Password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?';
      await db.execute(queryUpdate, [hashedPassword, userId]);

      return res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error: any) {
      console.error('❌ Error en RestablecerPassword:', error.sqlMessage || error.message || error);
      return res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
    }
  }
}