import { db } from '../config/db.js';
export class ComprobanteController {
    // Crear un nuevo comprobante
    static async CreateComprobante(req, res) {
        try {
            const { codigo, tipo, descripcion, monto, id_empleado } = req.body;
            if (!codigo || !tipo || !monto) {
                return res.status(400).json({ mensaje: 'El código, tipo y monto son campos obligatorios.' });
            }
            const query = `
                INSERT INTO comprobantes (codigo, tipo, descripcion, monto, id_empleado, fecha_emision)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            await db.execute(query, [codigo, tipo, descripcion || null, monto, id_empleado || null]);
            return res.status(201).json({ mensaje: 'Comprobante creado exitosamente.' });
        }
        catch (error) {
            console.error('❌ Error en CreateComprobante:', error);
            return res.status(500).json({ mensaje: 'Error interno al registrar el comprobante.' });
        }
    }
    // Obtener la lista de comprobantes
    static async BringComprobante(req, res) {
        try {
            const query = `
                SELECT c.id, c.codigo, c.tipo, c.descripcion, c.monto, c.fecha_emision,
                       e.nombre AS nombre_empleado, e.apellido AS apellido_empleado
                FROM comprobantes c
                LEFT JOIN empleados e ON c.id_empleado = e.id
                ORDER BY c.id DESC
            `;
            const [rows] = await db.execute(query);
            return res.status(200).json({
                mensaje: 'Comprobantes obtenidos exitosamente',
                datos: rows
            });
        }
        catch (error) {
            console.error('❌ Error en BringComprobante:', error);
            return res.status(500).json({ mensaje: 'Error al consultar los comprobantes.' });
        }
    }
    // Actualizar un comprobante existente
    static async UpdateComprobante(req, res) {
        try {
            const { id } = req.params;
            const { codigo, tipo, descripcion, monto } = req.body;
            const query = `
                UPDATE comprobantes
                SET codigo = ?, tipo = ?, descripcion = ?, monto = ?
                WHERE id = ?
            `;
            const [result] = await db.execute(query, [codigo, tipo, descripcion, monto, id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Comprobante no encontrado para actualizar.' });
            }
            return res.status(200).json({ mensaje: 'Comprobante actualizado correctamente.' });
        }
        catch (error) {
            console.error('❌ Error en UpdateComprobante:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar el comprobante.' });
        }
    }
    // Eliminar un comprobante
    static async DeleteComprobante(req, res) {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM comprobantes WHERE id = ?';
            const [result] = await db.execute(query, [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Comprobante no encontrado.' });
            }
            return res.status(200).json({ mensaje: 'Comprobante eliminado exitosamente.' });
        }
        catch (error) {
            console.error('❌ Error en DeleteComprobante:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar el comprobante.' });
        }
    }
}
