import { db } from "../config/db.js";
export class bitacorasController {
    // ==========================
    // CREAR BITÁCORA
    // ==========================
    static async CreateBitacoras(req, res) {
        try {
            const { titulo, nombre, fechaInicio, fechaFin, estado, descripcion, texto } = req.body;
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
        }
        catch (error) {
            console.log(error);
            res.status(500).json({
                mensaje: "Error al crear la bitácora"
            });
        }
    }
    // ==========================
    // LISTAR BITÁCORAS
    // ==========================
    static async BringBitacoras(req, res) {
        try {
            const [rows] = await db.execute(`
                SELECT *
                FROM bitacora
                ORDER BY id DESC
            `);
            res.status(200).json(rows);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({
                mensaje: "Error al consultar las bitácoras"
            });
        }
    }
    // ==========================
    // ACTUALIZAR BITÁCORA
    // ==========================
    static async UpdateBitacoras(req, res) {
        try {
            const { id } = req.params;
            const { titulo, nombre, fechaInicio, fechaFin, estado, descripcion, texto } = req.body;
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
        }
        catch (error) {
            console.log(error);
            res.status(500).json({
                mensaje: "Error al actualizar la bitácora"
            });
        }
    }
    // ==========================
    // ELIMINAR BITÁCORA
    // ==========================
    static async DeleteBitacoras(req, res) {
        try {
            const { id } = req.params;
            await db.execute("DELETE FROM bitacora WHERE id = ?", [id]);
            res.status(200).json({
                mensaje: "Bitácora eliminada con éxito"
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({
                mensaje: "Error al eliminar la bitácora"
            });
        }
    }
}
