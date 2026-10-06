import { db } from '../config/db.js';
export class reportesController {
    // =========================================================
    // OBTENER TODOS LOS INFORMES
    // =========================================================
    static async BringReport(req, res) {
        try {
            const query = 'SELECT id, nombre, informe, estado, fecha_generado FROM reporte ORDER BY id DESC';
            const [rows] = await db.query(query);
            // Mantenemos "reportes" y "datos" por compatibilidad con cualquier consumo en React
            return res.status(200).json({
                res: true,
                mensaje: 'Informes actuales',
                reportes: rows || [],
                datos: rows || []
            });
        }
        catch (error) {
            console.error('❌ Error en BringReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'Error al obtener los informes',
                error: error.message
            });
        }
    }
    // =========================================================
    // CREAR UN NUEVO INFORME
    // =========================================================
    static async createReport(req, res) {
        try {
            const { nombre, informe, estado } = req.body;
            if (!nombre || !informe) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'El nombre y el contenido del informe son obligatorios'
                });
            }
            const query = 'INSERT INTO reporte (nombre, informe, estado) VALUES (?, ?, ?)';
            await db.query(query, [nombre.trim(), informe.trim(), estado || 'Pendiente']);
            return res.status(201).json({
                res: true,
                mensaje: 'REPORTE CREADO EXITOSAMENTE'
            });
        }
        catch (error) {
            console.error('❌ Error en createReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'NO SE PUDO CREAR EL REPORTE',
                error: error.message
            });
        }
    }
    // =========================================================
    // ACTUALIZAR UN INFORME
    // =========================================================
    static async updateReport(req, res) {
        try {
            const { id } = req.params;
            const { nombre, informe, estado } = req.body;
            if (!id || !nombre || !informe) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'Faltan campos requeridos para actualizar'
                });
            }
            const query = 'UPDATE reporte SET nombre = ?, informe = ?, estado = ? WHERE id = ?';
            await db.query(query, [nombre.trim(), informe.trim(), estado || 'Pendiente', id]);
            return res.status(200).json({
                res: true,
                mensaje: 'Reporte actualizado exitosamente'
            });
        }
        catch (error) {
            console.error('❌ Error en updateReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'No se pudo actualizar el informe',
                error: error.message
            });
        }
    }
    // =========================================================
    // ELIMINAR UN INFORME
    // =========================================================
    static async deleteReport(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'El ID del reporte es obligatorio'
                });
            }
            const query = 'DELETE FROM reporte WHERE id = ?';
            await db.query(query, [id]);
            return res.status(200).json({
                res: true,
                mensaje: 'Reporte exitosamente eliminado'
            });
        }
        catch (error) {
            console.error('❌ Error en deleteReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'Error al eliminar el reporte',
                error: error.message
            });
        }
    }
}
