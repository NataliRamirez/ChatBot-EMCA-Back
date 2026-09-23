import { Request, Response } from "express";
import { db } from "../config/db.js";

/**
 * @file bitacorasController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de bitácoras del sistema,
 * permitiendo crear, consultar, actualizar y eliminar registros.
 * 
* Funcionalidades:
 * - Creación de bitácoras.
 * - Consulta de bitácoras registradas.
 * - Actualización de información de bitácoras.
 * - Eliminación de bitácoras.
 */
export class bitacorasController {

    /**
     * Crea una nueva bitácora en el sistema.
     *
     * Registra la información suministrada por el usuario y la almacena en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos de la bitácora.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Mensaje indicando el resultado de la operación.
     *
     * @throws {Error} Cuando ocurre un error durante el registro de la bitácora.
     */
    static async CreateBitacoras(req: Request, res: Response) {

        try {

            const {
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto
            } = req.body;

            const query = `
                INSERT INTO bitacora
                (
                    titulo,
                    nombre,
                    fechaInicio,
                    fechaFin,
                    estado,
                    descripcion,
                    texto
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto
            ]);

            res.status(201).json({
                mensaje: "Bitácora creada con éxito"
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje: "Error al crear la bitácora"
            });

        }

    }

     /**
     * Consulta todas las bitácoras registradas en el sistema.
     *
     * Obtiene el listado completo de bitácoras ordenadas de forma descendente según su identificador.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de bitácoras registradas.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta de datos.
     */
    static async BringBitacoras(req: Request, res: Response) {

        try {

            const [rows] = await db.execute(`
                SELECT *
                FROM bitacora
                ORDER BY id DESC
            `);

            res.status(200).json(rows);

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje: "Error al consultar las bitácoras"
            });

        }

    }

    /**
     * Actualiza la información de una bitácora existente.
     *
     * Modifica los datos asociados a una bitácora específica identificada mediante su id.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Mensaje indicando el resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante la actualización de la bitácora.
     */
    static async UpdateBitacoras(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const {
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto
            } = req.body;

            const query = `
                UPDATE bitacora
                SET
                    titulo = ?,
                    nombre = ?,
                    fechaInicio = ?,
                    fechaFin = ?,
                    estado = ?,
                    descripcion = ?,
                    texto = ?
                WHERE id = ?
            `;

            await db.execute(query, [
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto,
                id
            ]);

            res.status(200).json({
                mensaje: "Bitácora actualizada con éxito"
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje: "Error al actualizar la bitácora"
            });

        }

    }

     /**
     * Elimina una bitácora del sistema.
     *
     * Remueve de forma permanente el registro correspondiente al identificador recibido en la solicitud.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador de la bitácora.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Mensaje indicando el resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante la eliminación de la bitácora.
     */
    static async DeleteBitacoras(req: Request, res: Response) {

        try {

            const { id } = req.params;

            await db.execute(
                "DELETE FROM bitacora WHERE id = ?",
                [id]
            );

            res.status(200).json({
                mensaje: "Bitácora eliminada con éxito"
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                mensaje: "Error al eliminar la bitácora"
            });

        }

    }

}