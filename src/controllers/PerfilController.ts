import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file PerfilController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de perfiles de empleados,
 * permitiendo crear, consultar, actualizar y eliminar información de usuarios
 * registrados en el sistema.
 *
 * Funcionalidades:
 * - Creación de perfiles.
 * - Consulta de perfiles.
 * - Actualización de información de perfiles.
 * - Eliminación de información de perfiles.
 *
 * @class PerfilController
 */
export class PerfilController {

    /**
     * Crea un nuevo perfil de empleado.
     */
    static async CreatePerfil(req: Request, res: Response) {
        try {
            const {
                nombre,
                apellido,
                email,
                telefono,
                cargo,
                estado,
                password_hash
            } = req.body;

            const query = `
                INSERT INTO empleados
                (
                    nombre,
                    apellido,
                    email,
                    telefono,
                    cargo,
                    estado,
                    password_hash
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                nombre,
                apellido,
                email,
                telefono,
                cargo,
                estado,
                password_hash
            ]);

            res.status(200).json({
                mensaje: 'Perfil Empleado creado'
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                mensaje: 'Error de conexión de backend'
            });
        }
    }

    /**
     * Obtiene la información de un perfil específico.
     */
    static async BringPerfil(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const query = `
                SELECT
                    id,
                    nombre,
                    apellido,
                    email,
                    telefono,
                    cargo,
                    estado,
                    foto_url
                FROM empleados
                WHERE id = ?
            `;

            const [rows]: any = await db.execute(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({
                    mensaje: 'Empleado no encontrado'
                });
            }

            res.status(200).json(rows[0]);

        } catch (error) {
            console.error(error);

            res.status(500).json({
                mensaje: 'Error al obtener el perfil'
            });
        }
    }

    /**
     * Actualiza la información de un perfil de empleado.
     */
    static async UpdatePerfil(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Datos provenientes de req.body / FormData
            const nombre = req.body.nombre || null;
            const apellido = req.body.apellido || null;

            // Soporta tanto "documento" como "cedula"
            const cedula = req.body.documento || req.body.cedula || null;

            const telefono = req.body.telefono || null;
            const email = req.body.email || null;

            const query = `
                UPDATE empleados
                SET
                    nombre = ?,
                    apellido = ?,
                    cedula = ?,
                    telefono = ?,
                    email = ?
                WHERE id = ?
            `;

            const queryParams = [
                nombre,
                apellido,
                cedula,
                telefono,
                email,
                id
            ];

            const [result]: any = await db.execute(
                query,
                queryParams
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Empleado no encontrado'
                });
            }

            return res.status(200).json({
                mensaje: 'Perfil actualizado correctamente'
            });

        } catch (error: any) {
            console.error(
                '❌ ERROR MYSQL:',
                error.sqlMessage || error.message
            );

            return res.status(500).json({
                mensaje: 'Error al actualizar perfil en la base de datos',
                error: error.sqlMessage || error.message
            });
        }
    }

    /**
     * Elimina un perfil de empleado.
     */
    static async DeletePerfil(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await db.execute(
                'DELETE FROM empleados WHERE id = ?',
                [id]
            );

            res.status(200).json({
                mensaje: 'Perfil eliminado'
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                mensaje: 'Error al eliminar perfil'
            });
        }
    }
}