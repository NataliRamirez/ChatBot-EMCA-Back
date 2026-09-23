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
export class menuController{

    /**
     * Crea una nueva opción de menú en el sistema.
     *
     * Registra la información correspondiente a una opción del menú principal dentro de la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos del menú.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de creación.
     *
     * @throws {Error} Cuando ocurre un error durante el registro del menú.
     */
    static async createMenu(req:Request, res:Response){
      try{
          const {} = req.body;

          const query = '';

          await db.execute(query, {});
          res.status(201).json({ menssaje: 'Menu creado con exito'});
      }catch(error){
        console.log(error);
        res.status(500).json({ menssaje: 'Error al crear el menu'});
      }
    }

    /**
     * Obtiene las opciones de menú registradas en el sistema.
     *
     * Consulta la información almacenada en la base de datos relacionada con el contenido del menú principal.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Información consultada.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta.
     */
    static async BringMenu(req:Request, res:Response){
        try{
            const { nombre, titulo, estado } = req.body;

            const query = 'SELECT nombre, titulo, estado FROM contenido_menu WHERE nombre = ?, titulo = ?, estado = ?';

            await db.execute(query, { nombre, titulo, estado });
            
            res.status(201).json({ menssaje: 'Menu traido con exito'});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al traer el menu'});
        }
    }

    /**
     * Actualiza una opción de menú existente.
     *
     * Modifica la información asociada a una opción del menú principal previamente registrada.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante la actualización del menú.
     */
    static async updateMenu(req:Request, res:Response){
        try{
            const { nombre, titulo, estado } = req.body;

            const query = 'UPDATE contenido_menu nombre = ?, titulo = ?, estado = ?';

            await db.execute(query,  { nombre, titulo, estado });

            res.status(201).json({ menssaje: 'Menu actualizado correctamente'});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al actualizar menu'});
        }
    }

    /**
     * Elimina una opción de menú del sistema.
     *
     * Remueve permanentemente un registro del menú almacenado en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP con la información a eliminar.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async deleteMenu(req:Request, res:Response){
        try{
            const { nombre, titulo, estado } = req.body;

            const query = 'DELETE contenido_menu nombre = ?, titulo = ?, estado = ?';

            await db.execute(query, { nombre, titulo, estado });

            res.status(500).json({ menssaje: 'El menu se elimino correctamente'});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al eliminar el menu'});
        }
    }
}