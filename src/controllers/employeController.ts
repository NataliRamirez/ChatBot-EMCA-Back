import { type Request, type Response } from "express";
import { db } from "../config/db.js";
import { AuthService } from "../services/authService.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * @file employeController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de empleados,
 * incluyendo registro, autenticación, consulta, actualización
 * y eliminación de usuarios del sistema.
 * 
 * Funcionalidades:
 * - Consulta de empleados registrados.
 * - Registro de nuevos empleados.
 * - Autenticación de empleados.
 * - Actualización de información de empleados.
 * - Eliminación de empleados.
 */
export class employeController {

   /**
   * Obtiene el listado completo de empleados registrados.
   *
   * Consulta la información básica de todos los empleados almacenados en la base de datos.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP recibida por el servidor.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Listado de empleados registrados.
   *
   * @throws {Error} Cuando ocurre un error durante la consulta de empleados.
   */
  static async getAllEmployes(req: Request, res: Response) {
    try {
      // Destructuramos la primera posición [rows] para obtener directamente los resultados de MySQL
      const [empleados] = await db.execute<RowDataPacket[]>('SELECT id, nombre, apellido, telefono, cedula, email, estado FROM empleados');
      
      return res.status(200).json(empleados);
    } catch (error: any) {
      console.error('Error al obtener empleados:', error);
      return res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
  }

  /**
   * Registra un nuevo empleado en el sistema.
   *
   * Valida los datos recibidos, verifica que el correo electrónico no se encuentre registrado previamente, 
   * encripta la contraseña y almacena la información del empleado.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP con los datos del empleado.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Resultado del proceso de registro.
   *
   * @throws {Error} Cuando ocurre un error durante el registro del empleado.
   */
  static async createEmploye(req: Request, res: Response) {
    try {
      const { nombre, apellido, telefono, cedula, contraseña, email } = req.body;

      if (!nombre || !email || !contraseña) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el registro' });
      }

      const [existing] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM empleados WHERE email = ? LIMIT 1', 
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado en EMCA' });
      }

      const hashedPassword = await AuthService.hashPassword(contraseña); 

      const query = `
        INSERT INTO empleados (nombre, apellido, telefono, cedula, email, Password_hash, estado) 
        VALUES (?, ?, ?, ?, ?, ?, 'Activo')
      `;

      await db.execute(query, [
        nombre, 
        apellido || null, 
        telefono || null, 
        cedula || null, 
        email, 
        hashedPassword
      ]);
      
      return res.status(201).json({ mensaje: '¡Fuiste registrado exitosamente!' });
    } catch (error) {
      console.error('❌ Error en createEmploye:', error);
      return res.status(500).json({ mensaje: 'Error al registrar los datos en el servidor' });
    }
  }

   /**
   * Autentica un empleado dentro del sistema.
   *
   * Verifica la existencia del usuario, valida el estado de la cuenta y comprueba la contraseña mediante los
   * servicios de autenticación antes de generar un token JWT.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP con las credenciales del empleado.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Token JWT e información básica del usuario autenticado.
   *
   * @throws {Error} Cuando ocurre un error durante la autenticación.
   */
  static async login(req: Request, res: Response) {
    try {
      const email = String(req.body.email ?? '').trim();
      const password = String(req.body.contraseña ?? ''); 

      if (!email || !password) {
        return res.status(400).json({ mensaje: 'Por favor ingrese correo y contraseña' });
      }

      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM empleados WHERE email = ? LIMIT 1', 
        [email]
      );

      if (rows.length === 0) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado en EMCA' });
      }

      const user = rows[0];

      if (user.estado === "Inactivo") {
        return res.status(403).json({ mensaje: "Tu cuenta está desactivada. Contacta al administrador." });
      }

      const isMatch = await AuthService.comparePassword(password, user.Password_hash);
      if (!isMatch) {
        return res.status(401).json({ mensaje: "Contraseña incorrecta" });
      }

      const token = AuthService.generateToken({
        id: user.id,
        nombre: user.nombre
      });

      return res.status(200).json({
        mensaje: "Ingreso exitoso",
        token,
        user: {
          id: user.id,
          nombres: user.nombre,
          email: user.email
        }
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      return res.status(500).json({ mensaje: 'Error al iniciar sesión en el servidor' });
    }
  }

   /**
   * Actualiza la información de un empleado existente.
   *
   * Permite modificar los datos personales básicos de un empleado identificado por su id.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP que contiene el identificador y los nuevos datos.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<Response>} Resultado de la actualización.
   *
   * @throws {Error} Cuando ocurre un error durante la actualización del empleado.
   */
  static async updateEmploye(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, apellido, telefono } = req.body;

      if (!id) {
        return res.status(400).json({ mensaje: 'Se requiere el ID del empleado' });
      }

      const query = 'UPDATE empleados SET nombre = ?, apellido = ?, telefono = ? WHERE id = ?';
      const [result] = await db.execute<ResultSetHeader>(query, [nombre, apellido, telefono, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: 'Empleado no encontrado para actualizar' });
      }

      return res.status(200).json({ mensaje: 'Datos actualizados con éxito' });
    } catch (error) {
      console.error('❌ Error en updateEmploye:', error);
      return res.status(500).json({ mensaje: 'No se pudieron actualizar los datos' });
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
  static async deleteEmploye(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ mensaje: 'Se requiere el ID del empleado' });
      }

      const query = 'DELETE FROM empleados WHERE id = ?';
      const [result] = await db.execute<ResultSetHeader>(query, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: 'Empleado no encontrado para eliminar' });
      }
      
      return res.status(200).json({ mensaje: 'Cuenta eliminada con éxito' });
    } catch (error) {
      console.error('❌ Error en deleteEmploye:', error);
      return res.status(500).json({ mensaje: 'No se pudo eliminar la cuenta' });
    }
  }
}