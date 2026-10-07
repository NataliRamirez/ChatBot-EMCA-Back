import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

export class LoginController {

    // =========================================================
    // REGISTRAR USUARIO
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

            console.log('📝 Datos recibidos para registro:', {
                nombre,
                apellido,
                telefono,
                email,
                estado,
                rol
            });

            // =====================================================
            // VALIDACIONES
            // =====================================================

            if (
                !nombre ||
                !apellido ||
                !telefono ||
                !email ||
                !password
            ) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Nombre, apellido, teléfono, email y contraseña son obligatorios'
                });
            }

            // =====================================================
            // VALIDAR EMAIL
            // =====================================================

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El correo electrónico no es válido'
                });
            }

            // =====================================================
            // VALIDAR TELÉFONO
            // =====================================================

            const phoneRegex = /^\d{10}$/;

            if (!phoneRegex.test(telefono)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El teléfono debe contener exactamente 10 dígitos'
                });
            }

            // =====================================================
            // VERIFICAR SI EL EMAIL YA EXISTE
            // =====================================================

            const [existingUsers]: any = await db.execute(
                `
                SELECT id
                FROM usuarios
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

            // =====================================================
            // ENCRIPTAR CONTRASEÑA
            // =====================================================

            const passwordHash = await bcrypt.hash(password, 10);

            // =====================================================
            // REGISTRAR USUARIO
            // =====================================================

            const query = `
                INSERT INTO usuarios
                (
                    nombre,
                    apellido,
                    telefono,
                    email,
                    estado,
                    Password_hash,
                    rol
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result]: any = await db.execute(query, [
                nombre,
                apellido,
                telefono,
                email,
                estado || 'activo',
                passwordHash,
                rol || 'USUARIO'
            ]);

            // =====================================================
            // RESPUESTA
            // =====================================================

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
    // LOGIN
    // =========================================================

    static async BringLogin(req: Request, res: Response) {

        try {

            const {
                email,
                password
            } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Email y contraseña son obligatorios'
                });
            }

            const [rows]: any = await db.execute(
                `
                SELECT
                    id,
                    nombre,
                    apellido,
                    telefono,
                    email,
                    estado,
                    rol,
                    Password_hash
                FROM usuarios
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

            const usuario = rows[0];

            // =====================================================
            // COMPARAR CONTRASEÑA
            // =====================================================

            const passwordCorrecta = await bcrypt.compare(
                password,
                usuario.Password_hash
            );

            if (!passwordCorrecta) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'Correo o contraseña incorrectos'
                });
            }

            // =====================================================
            // VALIDAR ESTADO
            // =====================================================

            if (
                usuario.estado &&
                usuario.estado.toLowerCase() !== 'activo'
            ) {
                return res.status(403).json({
                    success: false,
                    mensaje: 'El usuario se encuentra inactivo'
                });
            }

            // =====================================================
            // RESPUESTA
            // =====================================================

            return res.status(200).json({
                success: true,
                mensaje: 'Inicio de sesión exitoso',
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    telefono: usuario.telefono,
                    email: usuario.email,
                    estado: usuario.estado,
                    rol: usuario.rol
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
    // ACTUALIZAR USUARIO
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

            if (!id) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se recibió el ID del usuario'
                });
            }

            if (
                !nombre ||
                !apellido ||
                !telefono ||
                !email
            ) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Nombre, apellido, teléfono y email son obligatorios'
                });
            }

            // =====================================================
            // ACTUALIZAR CON CONTRASEÑA
            // =====================================================

            if (password) {

                const passwordHash = await bcrypt.hash(password, 10);

                const [result]: any = await db.execute(
                    `
                    UPDATE usuarios
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
                        estado || 'activo',
                        rol || 'USUARIO',
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

                const [result]: any = await db.execute(
                    `
                    UPDATE usuarios
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
                        estado || 'activo',
                        rol || 'USUARIO',
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
    // ELIMINAR USUARIO
    // =========================================================

    static async deleteLogin(req: Request, res: Response) {

        try {

            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se recibió el ID del usuario'
                });
            }

            const [result]: any = await db.execute(
                `
                DELETE FROM usuarios
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