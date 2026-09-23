import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file mainController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión del contenido principal
 * del sistema, permitiendo crear, consultar, actualizar y eliminar
 * registros relacionados con informes principales.
 *
 * Funcionalidades:
 * - Creación de contenido principal.
 * - Consulta de contenido principal.
 * - Actualización de contenido principal.
 * - Eliminación de contenido principal.
 */
export class mainController{

     /**
     * Crea un nuevo registro de contenido principal.
     *
     * Registra la información correspondiente al informe, título y estado en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos del contenido.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de creación.
     *
     * @throws {Error} Cuando ocurre un error durante el registro del contenido.
     */
    static async createMain(req:Request, res:Response){
        try{
            const { informe, titulo, estado } = req.body;

            const query = 'INSER INTO informe, titulo, estado VALUES informe = ?, titulo = ?, estado = ?';

            await db.execute(query, {informe, titulo, estado});

            res.status(201).json({ menssaje: 'Se cargaro el contenido principal '});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al cargar el contenido principal '});
        }
    }

    /**
     * Obtiene la información del contenido principal.
     *
     * Consulta los registros almacenados en la base de datos relacionados con los informes principales.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Información consultada.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta.
     */
    static async BringMain(req:Request, res:Response){
        try{ 
            const { informe, titulo, estado } = req.body;

            const query = 'SELECT informe, titulo, estado FROM contenido_principal WHERE informe = ?, titulo = ?, estado = ?'

            await db.execute(query, {informe, titulo,estado});

            res.status(204).json({menssaje: 'Se creo el reporte con exito'});
        }catch (error){
            console.log(error)
            res.status(500).json({ menssaje: 'Error al crear el reporte del mes'});
        }
    }

     /**
     * Actualiza un registro de contenido principal.
     *
     * Modifica la información asociada al informe, título y estado de un registro existente.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de actualización.
     */
    static async updateMain(req:Request, res:Response){
        try{
            const { informe, titulo, estado } = req.body;

            const query = 'UPDATE contenido_principal informe = ?, titulo = ?, estado = ?';

            await db.execute(query, { informe, titulo, estado });

            res.status(202).json({ menssaje: 'El informe se actualizo con exito' });
        }catch(error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al actualizar, intente nuevamente'});
        }
    }

    /**
     * Elimina un registro de contenido principal.
     *
     * Remueve de forma permanente un informe principal almacenado en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con la información a eliminar.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async deleteMain(req:Request, res:Response){
        try{
            const { informe, titulo, estado } = req.body;

            const query = 'DELETE contenido_principal informe = ?, titulo = ?, estado = ?';

            await db.execute(query, {informe, titulo, estado});
            res.status(205).json({ menssaje: 'El informe fue eliminado correctamente'})
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'El informe no se pudo eliminar correctamente, intente nuevamente'});
        }
    }
}