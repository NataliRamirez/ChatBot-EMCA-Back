import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { envs } from '../config/Envs.js';

// Roles permitidos en el sistema
const ROLES_PERMITIDOS = ['admin', 'jefe', 'asesor', 'usuario', 'bot'];

export class LoginController {

  // =========================================================
  // REGISTRO DE EMPLEADOS (createLogin)
  // =========================================================
  static async createLogin(req: Request, res: Response) {
    const { nombre, apellido, telefono, email, estado, password, rol } = req.body;

    if (!nombre || !apellido || !telefono || !email || !password) {
      return res.status(400).json({
        mensaje: 'Faltan campos obligatorios para el registro'
      });
    }

    try {
      const emailLimpio = email.toLowerCase().trim();
      const passwordLimpia = password.toString().trim(); // Sincronización de trim
      const rolLimpio = rol ? rol.toString().toLowerCase().trim() : 'usuario';

      if (!ROLES_PERMITIDOS.includes(rolLimpio)) {
        return res.status(400).json({
          mensaje: `Rol no válido. Permitidos: ${ROLES_PERMITIDOS.join(', ')}`
        });
      }

      // 1. Verificar si el usuario ya existe
      const [rows]: any = await db.query(
        'SELECT id FROM empleados WHERE LOWER(email) = ?',
        [emailLimpio]
      );

      if (rows.length > 0) {
        return res.status(400).json({
          mensaje: 'El correo electrónico ya se encuentra registrado'
        });
      }

      // 2. Generación del Hash de la contraseña limpia
      const saltRounds = Number(envs.SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(passwordLimpia, saltRounds);

      // 3. Inserción con columnas estandarizadas
      await db.query(
        `INSERT INTO empleados
        (nombre, apellido, telefono, email, Password_hash, estado, rol)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre.toString().trim(),
          apellido.toString().trim(),
          telefono.toString().trim(),
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

  // =========================================================
  // LOGIN / AUTENTICACIÓN (BringLogin)
  // =========================================================
  static async BringLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          mensaje: 'Email y contraseña son requeridos' 
        });
      }

      const emailLimpio = email.toLowerCase().trim();
      const passwordLimpia = password.toString().trim();

      // 1. Consulta del usuario en la base de datos
      const [rows]: any = await db.query(
        'SELECT id, nombre, apellido, email, Password_hash, password_hash, estado, rol FROM empleados WHERE LOWER(email) = ?',
        [emailLimpio]
      );

      const usuario = rows[0];

      if (!usuario) {
        console.warn(`⚠️ [LOGIN 401] Correo no encontrado: ${emailLimpio}`);
        return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
      }

      // 2. Verificación del estado del usuario
      if (usuario.estado && usuario.estado !== 'Activo') {
        return res.status(403).json({ mensaje: 'El usuario se encuentra inactivo' });
      }

      // 3. Obtener el hash tolerando variaciones en el nombre del campo
      const hashEnDB = usuario.Password_hash || usuario.password_hash;

      if (!hashEnDB) {
        console.error(`🔥 [LOGIN 500] El usuario ${emailLimpio} no posee hash almacenado`);
        return res.status(500).json({ mensaje: 'Error en la estructura de autenticación del usuario' });
      }

      // 4. Validación de la contraseña limpia con Bcrypt
      const esValida = await bcrypt.compare(passwordLimpia, hashEnDB);

      if (!esValida) {
        console.warn(`⚠️ [LOGIN 401] Contraseña no coincide para: ${emailLimpio}`);
        return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
      }

      // 5. Generación del Token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol 
        },
        envs.JWT_SECRET || 'SECRETO_EMCA_2026',
        { expiresIn: '8h' }
      );

      // Excluir hashes de la respuesta
      const { Password_hash, password_hash, ...datosUsuario } = usuario;

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
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }

  // =========================================================
  // ACTUALIZAR EMPLEADO
  // =========================================================
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

  // =========================================================
  // ELIMINAR EMPLEADO
  // =========================================================
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