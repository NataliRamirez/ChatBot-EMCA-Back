import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file ImagenesController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de imágenes asociadas
 * a los reportes del sistema, permitiendo registrar y consultar la
 * información de los archivos almacenados.
 *
 * Funcionalidades:
 * - Registro de imágenes.
 * - Consulta de imágenes registradas.
 */
export class ImagenesController{

    /**
     * Registra una nueva imagen en el sistema.
     *
     * Almacena la información básica de una imagen, incluyendo su nombre y tamaño, dentro de la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos de la imagen.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado del proceso de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el almacenamiento de la imagen.
     */
    static async CreateImagenes(req:Request, res:Response){
        try{
            const {nombre, tamaño} = req.body;

            const query = 'INSERT INTO reportes_imagenes (nombre, tamaño) VALUES (?,?)';

            await db.execute (query, {nombre, tamaño});

            res.status(200).json({ menssaje: 'Imagen entrante'});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error de conexion con la base de datos'});
        }
    }


    /**
     * Obtiene el listado de imágenes registradas.
     *
     * Consulta todas las imágenes almacenadas en la base de datos junto con su información básica.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de imágenes registradas.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta de imágenes.
     */
    static async BringImagenes(req:Request, res:Response){
        try{ 
            const {nombre, tamaño} = req.body;

            const querry = 'SELECT nombre, tamaño FROM reportes_imagenes';

            await db.execute(querry, {nombre, tamaño});
            
            res.status(200).json({ menssaje: ''});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: ''});
        }
    }
}
