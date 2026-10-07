import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file menuController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión del menú principal
 * del sistema, permitiendo crear, consultar, actualizar y eliminar
 * opciones de menú.
 *
 * Funcionalidades:
 * - Creación de opciones de menú.
 * - Consulta de opciones de menú.
 * - Actualización de opciones de menú.
 * - Eliminación de opciones de menú.
 *
 * @class menuController
 */
export class menuController {

    /**
     * Crea una nueva opción de menú en el sistema.
     */
    static async createMenu(req: Request, res: Response) {
        try {
            const {
                nombre,
                titulo,
                estado
            } = req.body;

            if (!nombre || !titulo || !estado) {
                return res.status(400).json({
                    mensaje: 'Nombre, título y estado son obligatorios'
                });
            }

            const query = `
                INSERT INTO contenido_menu
                (
                    nombre,
                    titulo,
                    estado
                )
                VALUES (?, ?, ?)
            `;

            await db.execute(query, [
                nombre,
                titulo,
                estado
            ]);

            return res.status(201).json({
                mensaje: 'Menú creado con éxito'
            });

        } catch (error) {
            console.error('❌ Error al crear el menú:', error);

            return res.status(500).json({
                mensaje: 'Error al crear el menú'
            });
        }
    }


    /**
     * Obtiene las opciones de menú registradas en el sistema.
     */
    static async BringMenu(req: Request, res: Response) {
        try {
            const query = `
                SELECT
                    id,
                    nombre,
                    titulo,
                    estado
                FROM contenido_menu
                ORDER BY id DESC
            `;

            const [rows] = await db.execute(query);

            return res.status(200).json({
                mensaje: 'Menú obtenido con éxito',
                datos: rows
            });

        } catch (error) {
            console.error('❌ Error al traer el menú:', error);

            return res.status(500).json({
                mensaje: 'Error al traer el menú'
            });
        }
    }


    /**
     * Actualiza una opción de menú existente.
     */
    static async updateMenu(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const {
                nombre,
                titulo,
                estado
            } = req.body;

            if (!id) {
                return res.status(400).json({
                    mensaje: 'No se recibió el ID del menú'
                });
            }

            if (!nombre || !titulo || !estado) {
                return res.status(400).json({
                    mensaje: 'Nombre, título y estado son obligatorios'
                });
            }

            const query = `
                UPDATE contenido_menu
                SET
                    nombre = ?,
                    titulo = ?,
                    estado = ?
                WHERE id = ?
            `;

            const [result]: any = await db.execute(query, [
                nombre,
                titulo,
                estado,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Menú no encontrado'
                });
            }

            return res.status(200).json({
                mensaje: 'Menú actualizado correctamente'
            });

        } catch (error) {
            console.error('❌ Error al actualizar el menú:', error);

            return res.status(500).json({
                mensaje: 'Error al actualizar el menú'
            });
        }
    }


    /**
     * Elimina una opción de menú del sistema.
     */
    static async deleteMenu(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    mensaje: 'No se recibió el ID del menú'
                });
            }

            const query = `
                DELETE FROM contenido_menu
                WHERE id = ?
            `;

            const [result]: any = await db.execute(query, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Menú no encontrado'
                });
            }

            return res.status(200).json({
                mensaje: 'El menú se eliminó correctamente'
            });

        } catch (error) {
            console.error('❌ Error al eliminar el menú:', error);

            return res.status(500).json({
                mensaje: 'Error al eliminar el menú'
            });
        }
    }
}