import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file respuestasController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de respuestas del sistema, permitiendo crear, consultar, actualizar y eliminar respuestas almacenadas
 * en la base de datos.
 *
 * Funcionalidades:
 * - Consulta de respuestas.
 * - Creación de respuestas.
 * - Actualización de respuestas.
 * - Eliminación de respuestas.
 *
 * @class respuestasController
 */
export class respuestasController {

     /**
     * Obtiene todas las respuestas registradas en el sistema.
     *
     * Consulta la información almacenada en la tabla respuestas y retorna los registros ordenados de forma descendente por ID.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de respuestas registradas.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta a la base de datos.
     */
    static async BringRespuestas(req: Request, res: Response) {
        try {

            const query = `
                SELECT *
                FROM respuestas
                ORDER BY id DESC
            `;

            const [rows] = await db.execute(query);

            return res.status(200).json(rows);

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: "Error al obtener las respuestas."
            });
        }
    }

    /**
     * Registra una nueva respuesta en el sistema.
     *
     * Valida que todos los campos obligatorios estén presentes antes de almacenar la información en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos de la respuesta.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de inserción.
     */
    static async CreateRespuestas(req: Request, res: Response) {

        try {

            const {
                Nradicado,
                titulo,
                nombre,
                telefono,
                telefonoEmpresa,
                tipoRespuesta,
                estados,
                descripcion,
                fechaInicio,
                fechaFinal
            } = req.body;

            if (
                !Nradicado ||
                !titulo ||
                !nombre ||
                !telefono ||
                !telefonoEmpresa||
                !tipoRespuesta ||
                !estados ||
                !descripcion ||
                !fechaInicio ||
                !fechaFinal
            ) {
                return res.status(400).json({
                    mensaje: "Todos los campos obligatorios deben ser diligenciados."
                });
            }

            const query = `INSERT INTO respuestas ( Nradicado, titulo, nombre, telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `;

            await db.execute(query, [Nradicado, titulo, nombre, telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal ]);
            return res.status(201).json({
                mensaje: "Respuesta creada correctamente."
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: "Error al crear la respuesta."
            });
        }
    }

    /**
     * Actualiza una respuesta existente.
     *
     * Modifica la información de una respuesta previamente registrada utilizando el identificador recibido como parámetro.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante la actualización de la información.
     */
    static async UpdateRespuestas(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const { Nradicado, titulo, nombre,  telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal } = req.body;

            const query = `UPDATE respuestas SET Nradicado = ?, titulo = ?, nombre = ?, telefono = ?, telefonoEmpresa = ?, tipoRespuesta = ?, estados = ?, descripcion = ?, fechaInicio = ?, fechaFinal = ? WHERE id = ?`;
            await db.execute(query, [ Nradicado, titulo, nombre, telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal, id ]);
            return res.status(200).json({
                mensaje: "Respuesta actualizada correctamente."
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: "Error al actualizar la respuesta."
            });
        }
    }

    /**
     * Elimina una respuesta registrada en el sistema.
     *
     * Realiza la eliminación permanente de una respuesta utilizando el identificador recibido en la solicitud.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID de la respuesta.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async DeleteRespuestas(req: Request, res: Response) {

        try {

            const { id } = req.params;

            await db.execute(
                "DELETE FROM respuestas WHERE id = ?",
                [id]
            );
            return res.status(200).json({
                mensaje: "Respuesta eliminada correctamente."
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: "Error al eliminar la respuesta."
            });
        }
    }
}