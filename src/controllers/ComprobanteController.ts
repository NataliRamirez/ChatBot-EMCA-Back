import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file ComprobanteController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de comprobantes,
 * permitiendo registrar, consultar, actualizar y eliminar comprobantes
 * asociados a los empleados del sistema.
 * 
 * Funcionalidades:
 * - Registro de comprobantes.
 * - Consulta de comprobantes.
 * - Actualización de comprobantes.
 * - Eliminación de comprobantes.
 */
export class ComprobanteController {

    /**
     * Crea un nuevo comprobante en el sistema.
     *
     * Valida los datos obligatorios y registra un comprobante asociado opcionalmente a un empleado.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos del comprobante.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el almacenamiento del comprobante.
     */
    static async CreateComprobante(req: Request, res: Response) {
        try {
            const { codigo, tipo, descripcion, monto, id_empleado } = req.body;

            if (!codigo || !tipo || !monto) {
                return res.status(400).json({ mensaje: 'El código, tipo y monto son campos obligatorios.' });
            }

            const query = `
                INSERT INTO comprobantes (codigo, tipo, descripcion, monto, id_empleado, fecha_emision)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            await db.execute(query, [codigo, tipo, descripcion || null, monto, id_empleado || null]);

            return res.status(201).json({ mensaje: 'Comprobante creado exitosamente.' });
        } catch (error) {
            console.error('❌ Error en CreateComprobante:', error);
            return res.status(500).json({ mensaje: 'Error interno al registrar el comprobante.' });
        }
    }

    /**
     * Obtiene el listado de comprobantes registrados.
     *
     * Consulta los comprobantes almacenados en la base de datos junto con la información básica del empleado asociado.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de comprobantes registrados.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta de datos.
     */
    static async BringComprobante(req: Request, res: Response) {
        try {
            const query = `
                SELECT c.id, c.codigo, c.tipo, c.descripcion, c.monto, c.fecha_emision,
                       e.nombre AS nombre_empleado, e.apellido AS apellido_empleado
                FROM comprobantes c
                LEFT JOIN empleados e ON c.id_empleado = e.id
                ORDER BY c.id DESC
            `;
            const [rows]: any = await db.execute(query);

            return res.status(200).json({
                mensaje: 'Comprobantes obtenidos exitosamente',
                datos: rows
            });
        } catch (error) {
            console.error('❌ Error en BringComprobante:', error);
            return res.status(500).json({ mensaje: 'Error al consultar los comprobantes.' });
        }
    }

    /**
     * Actualiza la información de un comprobante existente.
     *
     * Modifica los datos de un comprobante identificado mediante su identificador único.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con el identificador y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de actualización.
     */
    static async UpdateComprobante(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { codigo, tipo, descripcion, monto } = req.body;

            const query = `
                UPDATE comprobantes
                SET codigo = ?, tipo = ?, descripcion = ?, monto = ?
                WHERE id = ?
            `;
            const [result]: any = await db.execute(query, [codigo, tipo, descripcion, monto, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Comprobante no encontrado para actualizar.' });
            }

            return res.status(200).json({ mensaje: 'Comprobante actualizado correctamente.' });
        } catch (error) {
            console.error('❌ Error en UpdateComprobante:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar el comprobante.' });
        }
    }

    /**
     * Elimina un comprobante del sistema.
     *
     * Remueve de forma permanente el comprobante asociado al identificador recibido en la solicitud.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador del comprobante.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante la eliminación del comprobante.
     */
    static async DeleteComprobante(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const query = 'DELETE FROM comprobantes WHERE id = ?';
            const [result]: any = await db.execute(query, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Comprobante no encontrado.' });
            }

            return res.status(200).json({ mensaje: 'Comprobante eliminado exitosamente.' });
        } catch (error) {
            console.error('❌ Error en DeleteComprobante:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar el comprobante.' });
        }
    }
}