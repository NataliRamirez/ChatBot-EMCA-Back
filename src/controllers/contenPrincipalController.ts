import { type Request, type Response } from "express";
import { db } from '../config/db.js';

/**
 * @file contenPrincipalController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión del contenido principal
 * del sistema, permitiendo crear, consultar, actualizar y eliminar información.
 *
 * Funcionalidades:
 * - Creación de contenido principal.
 * - Consulta de contenido principal.
 * - Actualización de contenido principal.
 * - Eliminación de contenido principal.
 */
export class contenPrincipalController {

    /**
     * Crea un nuevo registro de contenido principal.
     *
     * Registra un título, párrafo y estado dentro del sistema.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos del contenido.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de creación.
     *
     * @throws {Error} Cuando ocurre un error durante el almacenamiento de la información.
     */
    static async createContenPrincipal(req: Request, res: Response) {
        try {
            const { titulo, parrafo, estado } = req.body;

            const query = 'INSERT INTO  contenido_principal (titulo, parrafo, estado) titulo = ?, parrafo = ? estado = ?'

            await db.execute(query, { titulo, parrafo, estado });

            res.status(201).json({ menssaje: 'Informe creado con exito' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error de conexión con el backend' });
        }
    }


    /**
     * Obtiene la información del contenido principal.
     *
     * Consulta los registros almacenados en la base de datos relacionados con el contenido principal.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Información consultada.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta.
     */
    static async BringContenPrincipal(req: Request, res: Response) {
        try {
            const { titulo, parrafo, estado } = req.body;

            const query = 'SELECT titulo, parrafo, estado FROM contenido_principal titulo = ?, parrafo = ?, estado = ?'

            await db.execute(query, { titulo, parrafo, estado });

            res.status(202).json({ menssaje: 'Error de conexion al traer el contenido principal' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Listado del cotenido principal cargado con exito' });
        }
    }

    /**
        * Actualiza la información de un contenido principal existente.
        *
        * Permite modificar el título, párrafo y estado de un registro previamente almacenado.
        *
        * @async
        * @static
        * @param {Request} req Solicitud HTTP que contiene los nuevos datos.
        * @param {Response} res Respuesta HTTP enviada al cliente.
        * @returns {Promise<Response>} Resultado de la actualización.
        *
        * @throws {Error} Cuando ocurre un error durante el proceso de actualización.
        */
    static async updateContenPrincipal(req: Request, res: Response) {
        try {
            const { titulo, parrafo, estado } = req.body;

            const query = 'UPDATE titulo, parrafo, estado, FROM contenido_principal titulo = ?, parrafo = ? estado = ? ';

            await db.execute(query, { titulo, parrafo, estado });

            res.status(201).json({ menssaje: 'Informe actualizado correctamente' })
        } catch (error) {
            console.log(error)
            res.status(500).json({ menssaje: 'Faltan campos obligatorios' });
        }
    }

    /**
     * Elimina un registro de contenido principal.
     *
     * Remueve la información seleccionada de forma permanente de la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con la información a eliminar.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async deleteContenPrincipal(req: Request, res: Response) {
        try {
            const { titulo, parrafo, estado } = req.body;

            const query = 'DELETE titulo, parrafo, estado FROM contenido_principal titulo = ?, parrafo = ?, estado = ?';

            await db.execute(query, { titulo, parrafo, estado });

            res.status(201).json({ menssaje: 'Informe eliminado correctamente' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error de conexión con la base de datos' });
        }
    }
}