import { Request, Response } from "express";
import { db } from "../config/db.js";

/**
 * @file SolicitudesController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de solicitudes del sistema,
 * permitiendo crear, consultar, actualizar, asignar y eliminar solicitudes
 * almacenadas en la base de datos.
 *
 * Funcionalidades:
 * - Consulta de solicitudes.
 * - Consulta de solicitudes por identificador.
 * - Creación de solicitudes.
 * - Actualización de solicitudes.
 * - Asignación de solicitudes.
 * - Eliminación de solicitudes.
 *
 * @class SolicitudesController
 */
export class SolicitudesController {

     /**
     * Registra una nueva solicitud en el sistema.
     *
     * Valida los campos obligatorios y almacena la información correspondiente en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos de la solicitud.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de inserción.
     */
    static async CreateSolicitudes(req: Request, res: Response) {

        try {

            const {
                titulo,
                nombre,
                radicado,
                tipo,
                usuario,
                asunto,
                fechaInicio,
                fechaFinal,
                cargo,
                estado,
                observacion
            } = req.body;

            if (
                !titulo ||
                !nombre ||
                !radicado ||
                !tipo ||
                !asunto ||
                !cargo ||
                !estado ||
                !observacion
            ) {
                return res.status(400).json({
                    mensaje: "Todos los campos obligatorios deben ser diligenciados."
                });
            }

            const query = `INSERT INTO solicitudes ( titulo, nombre, radicado, tipo, usuario, asunto, fechaInicio, fechaFinal, cargo, estado, observacion ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `;

            await db.execute(query, [
                titulo,
                nombre,
                radicado,
                tipo,
                usuario ?? null,
                asunto,
                fechaInicio || null,
                fechaFinal || null,
                cargo,
                estado,
                observacion
            ]);

            return res.status(201).json({
                mensaje: "Solicitud creada correctamente"
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                mensaje: "Error al crear la solicitud"
            });

        }

    }

    /**
     * Obtiene el listado completo de solicitudes registradas.
     *
     * Consulta todas las solicitudes almacenadas en la base de datos y las retorna ordenadas de forma descendente por identificador.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de solicitudes registradas.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta.
     */
    static async BringSolicitudes(req: Request, res: Response) {

        try {

            const [rows] = await db.execute(
                "SELECT * FROM solicitudes ORDER BY id DESC"
            );

            return res.status(200).json(rows);

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                mensaje: "Error al obtener las solicitudes"
            });

        }

    }

    /**
     * Obtiene la información de una solicitud específica.
     *
     * Realiza la búsqueda de una solicitud mediante su identificador y retorna la información correspondiente.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID de la solicitud.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Información de la solicitud encontrada.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta.
     */
    static async BringSolicitud(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const [rows]: any = await db.execute(
                "SELECT * FROM solicitudes WHERE id = ?",
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json(rows[0]);

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                mensaje: "Error al obtener la solicitud"
            });

        }

    }

    /**
     * Actualiza la información de una solicitud existente.
     *
     * Modifica los datos asociados a una solicitud previamente registrada utilizando el identificador recibido como parámetro.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de actualización.
     *
     * @throws {Error} Cuando ocurre un error durante la actualización de la información.
     */
    static async UpdateSolicitudes(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const {
                titulo,
                nombre,
                radicado,
                tipo,
                usuario,
                asunto,
                fechaInicio,
                fechaFinal,
                cargo,
                estado,
                observacion
            } = req.body;

            const query = `UPDATE solicitudes SET titulo=?, nombre=?, radicado=?, tipo=?, usuario=?, asunto=?, fechaInicio=?, fechaFinal=?, cargo=?, estado=?, observacion=? WHERE id=?`;

            const [result]: any = await db.execute(query, [
                titulo,
                nombre,
                radicado,
                tipo,
                usuario ?? null,
                asunto,
                fechaInicio || null,
                fechaFinal || null,
                cargo,
                estado,
                observacion,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json({
                mensaje: "Solicitud actualizada correctamente"
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                mensaje: "Error al actualizar la solicitud"
            });

        }

    }

    /**
     * Elimina una solicitud registrada en el sistema.
     *
     * Realiza la eliminación permanente de una solicitud utilizando el identificador recibido en la solicitud.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID de la solicitud.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante la eliminación.
     */
    static async DeleteSolicitudes(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const [result]: any = await db.execute(
                "DELETE FROM solicitudes WHERE id=?",
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json({
                mensaje: "Solicitud eliminada correctamente"
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                mensaje: "Error al eliminar la solicitud"
            });

        }

    }

     /**
     * Asigna una solicitud a un responsable dentro del sistema.
     *
     * Permite actualizar el nombre del responsable, el estado y las observaciones asociadas a una solicitud existente.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID de la solicitud y los datos de asignación.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de asignación.
     *
     * @throws {Error} Cuando ocurre un error durante la asignación de la solicitud.
     */
    static async CreateAsignarSolicitud(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const {
                nombre,
                estado,
                observacion
            } = req.body;

            if (!nombre || !estado || !observacion) {
                return res.status(400).json({
                    mensaje: "Todos los campos son obligatorios."
                });
            }

            const query = `UPDATE solicitudes SET nombre=?, estado=?, observacion=? WHERE id=? `;

            const [result]: any = await db.execute(query, [
                nombre,
                estado,
                observacion,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json({
                mensaje: "Solicitud asignada correctamente"
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                mensaje: "Error al asignar la solicitud"
            });

        }

    }

}