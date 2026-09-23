import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

/**
 * @file PerfilController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de perfiles de empleados,
 * permitiendo crear, consultar, actualizar y eliminar información de usuarios
 * registrados en el sistema.
 *
 * Funcionalidades:
 * - Creación de perfiles.
 * - Consulta de perfiles.
 * - Actualización de información de perfiles.
 * - Eliminación de perfiles.
 *
 * @class PerfilController
 */
export class PerfilController {

    /**
     * Crea un nuevo perfil de empleado.
     *
     * Registra la información básica del empleado en la base de datos, incluyendo datos personales, cargo, estado y contraseña.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos del empleado.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el almacenamiento de la información.
     */
    static async CreatePerfil(req: Request, res: Response) {
        try {
            const { nombre, apellido, email, telefono, cargo, estado, password_hash } = req.body;

            const query = 'INSERT INTO empleados (nombre, apellido, email, telefono, cargo, estado, password_hash) VALUES(?, ?, ?, ?, ?, ?, ?)';

            // 🟢 Pasamos un Array en lugar de Objeto para evitar errores de driver MySQL
            await db.execute(query, [nombre, apellido, email, telefono, cargo, estado, password_hash]);

            res.status(200).json({ mensaje: 'Perfil Empleado creado' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: 'Error de conexión de backend' });
        }
    }

    /**
     * Obtiene la información de un perfil específico.
     *
     * Consulta los datos de un empleado mediante su identificador y retorna la información almacenada en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador del empleado.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Información del perfil solicitado.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta.
     */
    static async BringPerfil(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const query = `SELECT id, nombre, apellido, email, telefono, cargo, estado, foto_url FROM empleados WHERE id = ?`;

            const [rows]: any = await db.execute(query, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ mensaje: "Empleado no encontrado" });
            }
            res.status(200).json(rows[0]);
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: "Error al obtener el perfil" });
        }
    }

    /**
     * Actualiza la información de un perfil de empleado.
     *
     * Permite modificar datos personales como nombre, apellido, documento, teléfono y correo electrónico.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante la actualización de la información.
     */
    static async UpdatePerfil(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Extraer los datos provenientes de req.body (FormData)
            const nombre = req.body.nombre || null;
            const apellido = req.body.apellido || null;
            const cedula = req.body.documento || req.body.cedula || null; // Soporta 'documento' o 'cedula'
            const telefono = req.body.telefono || null;
            const email = req.body.email || null;

            // Sentencia SQL alineada únicamente a las columnas existentes de la tabla
            const query = `
            UPDATE empleados 
            SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, email = ?
            WHERE id = ?
        `;

            const queryParams = [nombre, apellido, cedula, telefono, email, id];

            const [result]: any = await db.execute(query, queryParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: "Empleado no encontrado" });
            }

            return res.status(200).json({
                mensaje: "Perfil actualizado correctamente"
            });

        } catch (error: any) {
            console.error("❌ ERROR MYSQL:", error.sqlMessage || error.message);
            return res.status(500).json({
                mensaje: "Error al actualizar perfil en la base de datos",
                error: error.sqlMessage || error.message
            });
        }
    }

    /**
     * Elimina un perfil de empleado.
     *
     * Remueve permanentemente el registro asociado al empleado identificado mediante su id.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el identificador del empleado.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async DeletePerfil(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await db.execute("DELETE FROM empleados WHERE id=?", [id]);
            res.json({ mensaje: "Perfil eliminado" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: "Error al eliminar perfil" });
        }
    }
}