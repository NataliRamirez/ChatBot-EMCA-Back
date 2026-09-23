import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

export class respuestasController {

    // =====================================================
    // OBTENER TODAS LAS RESPUESTAS
    // =====================================================
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

    // =====================================================
    // CREAR RESPUESTA
    // =====================================================
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

    // =====================================================
    // ACTUALIZAR RESPUESTA
    // =====================================================
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

    // =====================================================
    // ELIMINAR RESPUESTA
    // =====================================================
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