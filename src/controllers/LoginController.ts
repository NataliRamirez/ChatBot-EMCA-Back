import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

export class LoginController {

  // =========================================================
  // REGISTRAR EMPLEADO / USUARIO DEL PANEL WEB
  // =========================================================
  static async createLogin(req: Request, res: Response) {
    try {
      const {
        nombre,
        apellido,
        telefono,
        email,
        estado,
        password,
        rol
      } = req.body;

      // ---------------------------------------------------------
      // VALIDACIONES
      // ---------------------------------------------------------
      if (!nombre || !apellido || !telefono || !email || !password) {
        return res.status(400).json({
          success: false,
          mensaje:
            'Nombre, apellido, teléfono, email y contraseña son obligatorios'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          mensaje: 'El correo electrónico no es válido'
        });
      }

      const phoneRegex = /^\d{10}$/;

      if (!phoneRegex.test(telefono)) {
        return res.status(400).json({
          success: false,
          mensaje: 'El teléfono debe contener exactamente 10 dígitos'
        });
      }

      // ---------------------------------------------------------
      // VALIDAR SI EL CORREO YA EXISTE
      // ---------------------------------------------------------
      const [existingUsers]: any = await db.execute(
        `
          SELECT id
          FROM empleados
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          mensaje: 'El correo electrónico ya está registrado'
        });
      }

      // ---------------------------------------------------------
      // ENCRIPTAR CONTRASEÑA
      // ---------------------------------------------------------
      const passwordHash = await bcrypt.hash(password, 10);

      // ---------------------------------------------------------
      // INSERTAR EN EMPLEADOS
      // ---------------------------------------------------------
      const query = `
        INSERT INTO empleados
        (
          nombre,
          apellido,
          telefono,
          email,
          Password_hash,
          estado,
          rol
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result]: any = await db.execute(query, [
        nombre,
        apellido,
        telefono,
        email,
        passwordHash,
        estado || 'Activo',
        rol || 'usuario'
      ]);

      return res.status(201).json({
        success: true,
        mensaje: 'Usuario registrado correctamente',
        id: result.insertId
      });

    } catch (error) {
      console.error('❌ Error al registrar usuario:', error);

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al registrar el usuario'
      });
    }
  }


  // =========================================================
  // INICIAR SESIÓN
  // =========================================================
  static async BringLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // ---------------------------------------------------------
      // VALIDAR DATOS
      // ---------------------------------------------------------
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          mensaje: 'Email y contraseña son obligatorios'
        });
      }

      // ---------------------------------------------------------
      // BUSCAR EMPLEADO
      // ---------------------------------------------------------
      const [rows]: any = await db.execute(
        `
          SELECT
            id,
            nombre,
            apellido,
            cedula,
            telefono,
            email,
            Password_hash,
            estado,
            rol,
            fecha_registro
          FROM empleados
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          mensaje: 'Correo o contraseña incorrectos'
        });
      }

      const empleado = rows[0];

      // ---------------------------------------------------------
      // COMPARAR CONTRASEÑA
      // ---------------------------------------------------------
      const passwordCorrecta = await bcrypt.compare(
        password,
        empleado.Password_hash
      );

      if (!passwordCorrecta) {
        return res.status(401).json({
          success: false,
          mensaje: 'Correo o contraseña incorrectos'
        });
      }

      // ---------------------------------------------------------
      // VALIDAR ESTADO
      // ---------------------------------------------------------
      if (
        empleado.estado &&
        empleado.estado.toLowerCase() !== 'activo'
      ) {
        return res.status(403).json({
          success: false,
          mensaje: 'El usuario se encuentra inactivo'
        });
      }

      // ---------------------------------------------------------
      // RESPUESTA
      // ---------------------------------------------------------
      return res.status(200).json({
        success: true,
        mensaje: 'Inicio de sesión exitoso',

        // Para compatibilidad con tu Login.jsx
        empleado: {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          cedula: empleado.cedula,
          telefono: empleado.telefono,
          email: empleado.email,
          estado: empleado.estado,
          rol: empleado.rol,
          fecha_registro: empleado.fecha_registro
        },

        // También dejamos usuario para compatibilidad
        usuario: {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          cedula: empleado.cedula,
          telefono: empleado.telefono,
          email: empleado.email,
          estado: empleado.estado,
          rol: empleado.rol,
          fecha_registro: empleado.fecha_registro
        }
      });

    } catch (error) {
      console.error('❌ Error en login:', error);

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al iniciar sesión'
      });
    }
  }


  // =========================================================
  // ACTUALIZAR EMPLEADO
  // =========================================================
  static async updateLogin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const {
        nombre,
        apellido,
        telefono,
        email,
        estado,
        rol,
        password
      } = req.body;

      // ---------------------------------------------------------
      // VALIDAR ID
      // ---------------------------------------------------------
      if (!id) {
        return res.status(400).json({
          success: false,
          mensaje: 'No se recibió el ID del usuario'
        });
      }

      // ---------------------------------------------------------
      // VALIDAR CAMPOS
      // ---------------------------------------------------------
      if (!nombre || !apellido || !telefono || !email) {
        return res.status(400).json({
          success: false,
          mensaje:
            'Nombre, apellido, teléfono y email son obligatorios'
        });
      }

      // ---------------------------------------------------------
      // VALIDAR CORREO
      // ---------------------------------------------------------
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          mensaje: 'El correo electrónico no es válido'
        });
      }

      // ---------------------------------------------------------
      // VALIDAR TELÉFONO
      // ---------------------------------------------------------
      const phoneRegex = /^\d{10}$/;

      if (!phoneRegex.test(telefono)) {
        return res.status(400).json({
          success: false,
          mensaje: 'El teléfono debe contener exactamente 10 dígitos'
        });
      }

      // ---------------------------------------------------------
      // VALIDAR QUE EL CORREO NO ESTÉ EN OTRO EMPLEADO
      // ---------------------------------------------------------
      const [existingEmail]: any = await db.execute(
        `
          SELECT id
          FROM empleados
          WHERE email = ?
          AND id != ?
          LIMIT 1
        `,
        [email, id]
      );

      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          mensaje: 'El correo electrónico ya está registrado'
        });
      }

      // ---------------------------------------------------------
      // ACTUALIZAR CON CONTRASEÑA
      // ---------------------------------------------------------
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);

        const [result]: any = await db.execute(
          `
            UPDATE empleados
            SET
              nombre = ?,
              apellido = ?,
              telefono = ?,
              email = ?,
              estado = ?,
              rol = ?,
              Password_hash = ?
            WHERE id = ?
          `,
          [
            nombre,
            apellido,
            telefono,
            email,
            estado || 'Activo',
            rol || 'usuario',
            passwordHash,
            id
          ]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            mensaje: 'Usuario no encontrado'
          });
        }

      } else {

        // -------------------------------------------------------
        // ACTUALIZAR SIN CAMBIAR CONTRASEÑA
        // -------------------------------------------------------
        const [result]: any = await db.execute(
          `
            UPDATE empleados
            SET
              nombre = ?,
              apellido = ?,
              telefono = ?,
              email = ?,
              estado = ?,
              rol = ?
            WHERE id = ?
          `,
          [
            nombre,
            apellido,
            telefono,
            email,
            estado || 'Activo',
            rol || 'usuario',
            id
          ]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            mensaje: 'Usuario no encontrado'
          });
        }
      }

      return res.status(200).json({
        success: true,
        mensaje: 'Usuario actualizado correctamente'
      });

    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al actualizar el usuario'
      });
    }
  }


  // =========================================================
  // ELIMINAR EMPLEADO
  // =========================================================
  static async deleteLogin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // ---------------------------------------------------------
      // VALIDAR ID
      // ---------------------------------------------------------
      if (!id) {
        return res.status(400).json({
          success: false,
          mensaje: 'No se recibió el ID del usuario'
        });
      }

      // ---------------------------------------------------------
      // ELIMINAR
      // ---------------------------------------------------------
      const [result]: any = await db.execute(
        `
          DELETE FROM empleados
          WHERE id = ?
        `,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        mensaje: 'Usuario eliminado correctamente'
      });

    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al eliminar el usuario'
      });
    }
  }
}
