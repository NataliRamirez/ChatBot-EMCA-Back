import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { envs } from '../config/Envs.js';

// 1. AÑADIDO: Incluir 'jefe' y 'asesor' en los roles permitidos
const ROLES_PERMITIDOS = ['admin', 'jefe', 'asesor', 'usuario', 'bot'];

/**
 * @file LoginController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de autenticación
 * y administración de empleados, incluyendo registro, inicio de sesión,
 * actualización y eliminación de usuarios.
 * 
 * Funcionalidades:
 * - Registro de empleados.
 * - Inicio de sesión.
 * - Generación de tokens JWT.
 * - Actualización de empleados.
 * - Eliminación de empleados.
 */
export class LoginController {

   /**
   * Registra un nuevo empleado en el sistema.
   *
   * Valida la información recibida, verifica que el correo electrónico no exista previamente, encripta la contraseña
   * y almacena el usuario en la base de datos.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP con los datos del empleado.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Resultado del proceso de registro.
   *
   * @throws {Error} Cuando ocurre un error durante el registro del empleado.
   */
  static async createLogin(req: Request, res: Response) {
    const { nombre, apellido, telefono, email, estado, password, rol } = req.body;

    if (!nombre || !apellido || !telefono || !email || !password) {
      return res.status(400).json({
        mensaje: 'Faltan campos obligatorios para el registro'
      });
    }

    try {
      const emailLimpio = email.toLowerCase().trim();
      const rolLimpio = rol ? rol.toString().toLowerCase().trim() : 'usuario';

      if (!ROLES_PERMITIDOS.includes(rolLimpio)) {
        return res.status(400).json({
          mensaje: `Rol no válido. Permitidos: ${ROLES_PERMITIDOS.join(', ')}`
        });
      }

      const [rows]: any = await db.query(
        'SELECT id FROM empleados WHERE LOWER(email) = ?',
        [emailLimpio]
      );

      if (rows.length > 0) {
        return res.status(400).json({
          mensaje: 'El correo electrónico ya se encuentra registrado'
        });
      }

      const hashedPassword = await bcrypt.hash(password, envs.SALT_ROUNDS || 10);

      await db.query(
        `INSERT INTO empleados
        (nombre, apellido, telefono, email, Password_hash, estado, rol)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre.trim(),
          apellido.trim(),
          telefono.trim(),
          emailLimpio,
          hashedPassword,
          estado || 'Activo',
          rolLimpio
        ]
      );

      return res.status(201).json({
        res: true,
        mensaje: 'Usuario registrado correctamente'
      });

    } catch (error: any) {
      console.error('❌ Error en createLogin:', error);
      return res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * Autentica un empleado en el sistema.
   *
   * Verifica la existencia del usuario, valida el estado de la cuenta, compara la contraseña utilizando bcrypt y genera un token JWT
   * para la sesión autenticada.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP con las credenciales del usuario.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Token JWT e información del usuario autenticado.
   *
   * @throws {Error} Cuando ocurre un error durante el proceso de autenticación.
   */
  static async BringLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          mensaje: 'Email y contraseña son requeridos' 
        });
      }

      const emailLimpio = email.toLowerCase().trim();

      // Mapeamos Password_hash (MySQL exacto) y password_hash por compatibilidad
      const [rows]: any = await db.query(
        'SELECT id, nombre, apellido, email, Password_hash, password_hash, estado, rol FROM empleados WHERE LOWER(email) = ?',
        [emailLimpio]
      );

      const usuario = rows[0];

      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      if (usuario.estado && usuario.estado !== 'Activo') {
        return res.status(403).json({ mensaje: 'El usuario se encuentra inactivo' });
      }

      const hashEnDB = usuario.Password_hash || usuario.password_hash;

      if (!hashEnDB) {
        console.error('🔥 El usuario encontrado no tiene Password_hash en DB');
        return res.status(500).json({ mensaje: 'Error en la estructura del usuario' });
      }

      const esValida = await bcrypt.compare(password, hashEnDB);

      if (!esValida) {
        return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol 
        },
        envs.JWT_SECRET || 'secret_fallback',
        { expiresIn: '8h' }
      );

      // Limpiar campos de contraseña antes de responder
      const { Password_hash, password_hash, ...datosUsuario } = usuario;

      // Devolvemos el rol en mayúsculas para garantizar concordancia con React
      if (datosUsuario.rol) {
        datosUsuario.rol = datosUsuario.rol.toString().toUpperCase().trim();
      }

      return res.status(200).json({
        mensaje: 'Login exitoso',
        token,
        empleado: datosUsuario
      });

    } catch (error: any) {
      console.error('❌ Error en BringLogin:', error);
      return res.status(500).json({ mensaje: error.message });
    }
  }

  /**
   * Actualiza la información de un empleado.
   *
   * Permite modificar el nombre, estado y rol de un empleado previamente registrado en el sistema.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP con el identificador y los nuevos datos.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Resultado de la actualización.
   *
   * @throws {Error} Cuando ocurre un error durante la actualización del empleado.
   */
  static async updateLogin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, estado, rol } = req.body;

      if (!id) {
        return res.status(400).json({ mensaje: 'El ID del empleado es requerido' });
      }

      const rolLimpio = rol ? rol.toString().toLowerCase().trim() : 'usuario';

      if (rol && !ROLES_PERMITIDOS.includes(rolLimpio)) {
        return res.status(400).json({
          mensaje: `Rol no válido. Permitidos: ${ROLES_PERMITIDOS.join(', ')}`
        });
      }

      await db.query(
        'UPDATE empleados SET nombre = ?, estado = ?, rol = ? WHERE id = ?',
        [nombre, estado, rolLimpio, id]
      );

      return res.status(200).json({
        mensaje: 'Empleado actualizado correctamente'
      });

    } catch (error: any) {
      console.error('❌ Error en updateLogin:', error);
      return res.status(500).json({
        mensaje: 'Error al actualizar el empleado',
        error: error.message
      });
    }
  }

  /**
   * Elimina un empleado del sistema.
   *
   * Remueve permanentemente el registro de un empleado identificado mediante su id.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP que contiene el identificador del empleado.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Resultado de la eliminación.
   *
   * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
   */
  static async deleteLogin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ mensaje: 'El ID del empleado es requerido' });
      }

      await db.query('DELETE FROM empleados WHERE id = ?', [id]);

      return res.status(200).json({
        mensaje: 'Empleado eliminado correctamente'
      });

    } catch (error: any) {
      console.error('❌ Error en deleteLogin:', error);
      return res.status(500).json({
        mensaje: 'Error al eliminar el empleado',
        error: error.message
      });
    }
  }
}