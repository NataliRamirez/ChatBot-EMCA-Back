import { db } from "../config/db.js";
export class SolicitudesController {
    // ==================================================
    // Crear solicitud
    // ==================================================
    static async CreateSolicitudes(req, res) {
        try {
            const { titulo, nombre, radicado, tipo, usuario, asunto, fechaInicio, fechaFinal, cargo, estado, observacion } = req.body;
            if (!titulo ||
                !nombre ||
                !radicado ||
                !tipo ||
                !asunto ||
                !cargo ||
                !estado ||
                !observacion) {
                return res.status(400).json({
                    mensaje: "Todos los campos obligatorios deben ser diligenciados."
                });
            }
            const query = `INSERT INTO solicitudes ( titulo, nombre, radicado, tipo, usuario, asunto, fechaInicio, fechaFinal, cargo, estado, observacion ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `;
            await db.execute(query, [
                titulo,
                nombre,
                radicado,
                tipo,
                usuario ?? null,
                asunto,
                fechaInicio || null,
                fechaFinal || null,
                cargo,
                estado,
                observacion
            ]);
            return res.status(201).json({
                mensaje: "Solicitud creada correctamente"
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al crear la solicitud"
            });
        }
    }
    // ==================================================
    // Obtener todas las solicitudes
    // ==================================================
    static async BringSolicitudes(req, res) {
        try {
            const [rows] = await db.execute("SELECT * FROM solicitudes ORDER BY id DESC");
            return res.status(200).json(rows);
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al obtener las solicitudes"
            });
        }
    }
    // ==================================================
    // Obtener una solicitud por ID
    // ==================================================
    static async BringSolicitud(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await db.execute("SELECT * FROM solicitudes WHERE id = ?", [id]);
            if (rows.length === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }
            return res.status(200).json(rows[0]);
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al obtener la solicitud"
            });
        }
    }
    // ==================================================
    // Actualizar solicitud
    // ==================================================
    static async UpdateSolicitudes(req, res) {
        try {
            const { id } = req.params;
            const { titulo, nombre, radicado, tipo, usuario, asunto, fechaInicio, fechaFinal, cargo, estado, observacion } = req.body;
            const query = `UPDATE solicitudes SET titulo=?, nombre=?, radicado=?, tipo=?, usuario=?, asunto=?, fechaInicio=?, fechaFinal=?, cargo=?, estado=?, observacion=? WHERE id=?`;
            const [result] = await db.execute(query, [
                titulo,
                nombre,
                radicado,
                tipo,
                usuario ?? null,
                asunto,
                fechaInicio || null,
                fechaFinal || null,
                cargo,
                estado,
                observacion,
                id
            ]);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }
            return res.status(200).json({
                mensaje: "Solicitud actualizada correctamente"
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al actualizar la solicitud"
            });
        }
    }
    // ==================================================
    // Eliminar solicitud
    // ==================================================
    static async DeleteSolicitudes(req, res) {
        try {
            const { id } = req.params;
            const [result] = await db.execute("DELETE FROM solicitudes WHERE id=?", [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }
            return res.status(200).json({
                mensaje: "Solicitud eliminada correctamente"
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al eliminar la solicitud"
            });
        }
    }
    // ==================================================
    // Asignar solicitud
    // ==================================================
    static async CreateAsignarSolicitud(req, res) {
        try {
            const { id } = req.params;
            const { nombre, estado, observacion } = req.body;
            if (!nombre || !estado || !observacion) {
                return res.status(400).json({
                    mensaje: "Todos los campos son obligatorios."
                });
            }
            const query = `UPDATE solicitudes SET nombre=?, estado=?, observacion=? WHERE id=? `;
            const [result] = await db.execute(query, [
                nombre,
                estado,
                observacion,
                id
            ]);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }
            return res.status(200).json({
                mensaje: "Solicitud asignada correctamente"
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al asignar la solicitud"
            });
        }
    }
}
