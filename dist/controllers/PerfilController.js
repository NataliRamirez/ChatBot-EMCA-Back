import { db } from '../config/db.js';
export class PerfilController {
    static async CreatePerfil(req, res) {
        try {
            const { nombre, apellido, email, telefono, cargo, estado, password_hash } = req.body;
            const query = 'INSERT INTO empleados (nombre, apellido, email, telefono, cargo, estado, password_hash) VALUES(?, ?, ?, ?, ?, ?, ?)';
            // 🟢 Pasamos un Array en lugar de Objeto para evitar errores de driver MySQL
            await db.execute(query, [nombre, apellido, email, telefono, cargo, estado, password_hash]);
            res.status(200).json({ mensaje: 'Perfil Empleado creado' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: 'Error de conexión de backend' });
        }
    }
    static async BringPerfil(req, res) {
        try {
            const { id } = req.params;
            const query = `SELECT id, nombre, apellido, email, telefono, cargo, estado, foto_url FROM empleados WHERE id = ?`;
            const [rows] = await db.execute(query, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ mensaje: "Empleado no encontrado" });
            }
            res.status(200).json(rows[0]);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: "Error al obtener el perfil" });
        }
    }
    static async UpdatePerfil(req, res) {
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
            const [result] = await db.execute(query, queryParams);
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: "Empleado no encontrado" });
            }
            return res.status(200).json({
                mensaje: "Perfil actualizado correctamente"
            });
        }
        catch (error) {
            console.error("❌ ERROR MYSQL:", error.sqlMessage || error.message);
            return res.status(500).json({
                mensaje: "Error al actualizar perfil en la base de datos",
                error: error.sqlMessage || error.message
            });
        }
    }
    static async DeletePerfil(req, res) {
        try {
            const { id } = req.params;
            await db.execute("DELETE FROM empleados WHERE id=?", [id]);
            res.json({ mensaje: "Perfil eliminado" });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: "Error al eliminar perfil" });
        }
    }
}
