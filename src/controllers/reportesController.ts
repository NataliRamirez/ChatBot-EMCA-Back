import { type Request, type Response } from "express";
import { db } from '../config/db.js';

/**
 * @file reportesController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de reportes del sistema, permitiendo crear, consultar, actualizar y eliminar informes almacenados
 * en la base de datos.
 *
 * Funcionalidades:
 * - Consulta de reportes.
 * - Creación de reportes.
 * - Actualización de reportes.
 * - Eliminación de reportes.
 *
 * @class reportesController
 */
export class reportesController {

    /**
     * Obtiene el listado completo de reportes registrados.
     *
     * Consulta la información almacenada en la tabla de reportes y retorna los registros ordenados de forma descendente por identificador.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de reportes registrados.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta de los reportes.
     */
    static async BringReport(req: Request, res: Response) {
        try {
            const query = 'SELECT id, nombre, informe, estado, fecha_generado FROM reporte ORDER BY id DESC';
            const [rows]: any = await db.query(query);

            // Mantenemos "reportes" y "datos" por compatibilidad con cualquier consumo en React
            return res.status(200).json({
                res: true,
                mensaje: 'Informes actuales',
                reportes: rows || [],
                datos: rows || []
            });
        } catch (error: any) {
            console.error('❌ Error en BringReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'Error al obtener los informes',
                error: error.message
            });
        }
    }

    /**
     * Crea un nuevo reporte en el sistema.
     *
     * Valida la información recibida, registra el reporte en la base de datos y asigna un estado inicial cuando sea necesario.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con la información del reporte.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de creación.
     *
     * @throws {Error} Cuando ocurre un error durante el registro del reporte.
     */
    static async createReport(req: Request, res: Response) {
        try {
            const { nombre, informe, estado } = req.body;

            if (!nombre || !informe) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'El nombre y el contenido del informe son obligatorios'
                });
            }

            const query = 'INSERT INTO reporte (nombre, informe, estado) VALUES (?, ?, ?)';
            await db.query(query, [nombre.trim(), informe.trim(), estado || 'Pendiente']);

            return res.status(201).json({
                res: true,
                mensaje: 'REPORTE CREADO EXITOSAMENTE'
            });
        } catch (error: any) {
            console.error('❌ Error en createReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'NO SE PUDO CREAR EL REPORTE',
                error: error.message
            });
        }
    }

    /**
     * Actualiza la información de un reporte existente.
     *
     * Modifica los datos asociados al nombre, contenido y estado del reporte identificado mediante su id.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de actualización.
     */
    static async updateReport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { nombre, informe, estado } = req.body;

            if (!id || !nombre || !informe) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'Faltan campos requeridos para actualizar'
                });
            }

            const query = 'UPDATE reporte SET nombre = ?, informe = ?, estado = ? WHERE id = ?';
            await db.query(query, [nombre.trim(), informe.trim(), estado || 'Pendiente', id]);

            return res.status(200).json({
                res: true,
                mensaje: 'Reporte actualizado exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error en updateReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'No se pudo actualizar el informe',
                error: error.message
            });
        }
    }

    /**
     * Elimina un reporte del sistema.
     *
     * Remueve permanentemente el registro asociado al identificador recibido en la solicitud.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador del reporte.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async deleteReport(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'El ID del reporte es obligatorio'
                });
            }

            const query = 'DELETE FROM reporte WHERE id = ?';
            await db.query(query, [id]);

            return res.status(200).json({
                res: true,
                mensaje: 'Reporte exitosamente eliminado'
            });
        } catch (error: any) {
            console.error('❌ Error en deleteReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'Error al eliminar el reporte',
                error: error.message
            });
        }
    }

}