import { db } from '../config/db.js';
export class ConfiguracionController {
    // Crear un parámetro o ajuste del sistema
    static async CreateConfiguracion(req, res) {
        try {
            const { clave, valor, descripcion } = req.body;
            if (!clave || valor === undefined) {
                return res.status(400).json({ mensaje: 'La clave y el valor de configuración son obligatorios.' });
            }
            const query = 'INSERT INTO configuraciones (clave, valor, descripcion) VALUES (?, ?, ?)';
            await db.execute(query, [clave, valor, descripcion || null]);
            return res.status(201).json({ mensaje: 'Configuración guardada exitosamente.' });
        }
        catch (error) {
            console.error('❌ Error en CreateConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error interno al guardar la configuración.' });
        }
    }
    // Obtener todas las configuraciones o una clave específica
    static async BringConfiguracion(req, res) {
        try {
            const query = 'SELECT id, clave, valor, descripcion, fecha_actualizacion FROM configuraciones';
            const [rows] = await db.execute(query);
            return res.status(200).json({
                mensaje: 'Configuraciones recuperadas exitosamente',
                datos: rows
            });
        }
        catch (error) {
            console.error('❌ Error en BringConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error al consultar las configuraciones.' });
        }
    }
    // Actualizar el valor de un ajuste por su ID
    static async UpdateConfiguracion(req, res) {
        try {
            const { id } = req.params;
            const { valor, descripcion } = req.body;
            const query = 'UPDATE configuraciones SET valor = ?, descripcion = ? WHERE id = ?';
            const [result] = await db.execute(query, [valor, descripcion, id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Ajuste de configuración no encontrado.' });
            }
            return res.status(200).json({ mensaje: 'Configuración actualizada correctamente.' });
        }
        catch (error) {
            console.error('❌ Error en UpdateConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar la configuración.' });
        }
    }
    // Eliminar una configuración del sistema
    static async DeleteConfiguracion(req, res) {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM configuraciones WHERE id = ?';
            const [result] = await db.execute(query, [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Configuración no encontrada.' });
            }
            return res.status(200).json({ mensaje: 'Configuración eliminada correctamente.' });
        }
        catch (error) {
            console.error('❌ Error en DeleteConfiguracion:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar la configuración.' });
        }
    }
}
