import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file ConfiguracionController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de configuraciones
 * del sistema, permitiendo registrar, consultar, actualizar y eliminar
 * parámetros de configuración.
 * 
 * Funcionalidades:
 * - Registro de configuraciones.
 * - Consulta de configuraciones.
 * - Actualización de parámetros de configuración.
 * - Eliminación de configuraciones.
 */
export class ConfiguracionController {

    /**
     * Crea una nueva configuración en el sistema.
     *
     * Registra un parámetro de configuración con su respectiva clave, valor y descripción para ser utilizado por la aplicación.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos de la configuración.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el almacenamiento de la configuración.
     */
    static async CreateConfiguracion(req: Request, res: Response) {
        try {
            const { clave, valor, descripcion } = req.body;

            if (!clave || valor === undefined) {
                return res.status(400).json({ mensaje: 'La clave y el valor de configuración son obligatorios.' });
            }

            const query = 'INSERT INTO configuraciones (clave, valor, descripcion) VALUES (?, ?, ?)';
            await db.execute(query, [clave, valor, descripcion || null]);

            return res.status(201).json({ mensaje: 'Configuración guardada exitosamente.' });
        } catch (error) {
            console.error('❌ Error en CreateConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error interno al guardar la configuración.' });
        }
    }

    /**
     * Obtiene las configuraciones registradas en el sistema.
     *
     * Consulta todos los parámetros de configuración almacenados en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de configuraciones registradas.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta de información.
     */
    static async BringConfiguracion(req: Request, res: Response) {
        try {
            const query = 'SELECT id, clave, valor, descripcion, fecha_actualizacion FROM configuraciones';
            const [rows]: any = await db.execute(query);

            return res.status(200).json({
                mensaje: 'Configuraciones recuperadas exitosamente',
                datos: rows
            });
        } catch (error) {
            console.error('❌ Error en BringConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error al consultar las configuraciones.' });
        }
    }

     /**
     * Actualiza una configuración existente.
     *
     * Modifica el valor y la descripción de un parámetro de configuración identificado por su id.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de actualización.
     */
    static async UpdateConfiguracion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { valor, descripcion } = req.body;

            const query = 'UPDATE configuraciones SET valor = ?, descripcion = ? WHERE id = ?';
            const [result]: any = await db.execute(query, [valor, descripcion, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Ajuste de configuración no encontrado.' });
            }

            return res.status(200).json({ mensaje: 'Configuración actualizada correctamente.' });
        } catch (error) {
            console.error('❌ Error en UpdateConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar la configuración.' });
        }
    }

     /**
     * Elimina una configuración del sistema.
     *
     * Remueve de forma permanente un parámetro de configuración identificado mediante su id.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador de la configuración.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async DeleteConfiguracion(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const query = 'DELETE FROM configuraciones WHERE id = ?';
            const [result]: any = await db.execute(query, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Configuración no encontrada.' });
            }

            return res.status(200).json({ mensaje: 'Configuración eliminada correctamente.' });
        } catch (error) {
            console.error('❌ Error en DeleteConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar la configuración.' });
        }
    }
}