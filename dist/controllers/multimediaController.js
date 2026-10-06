import { db } from '../config/db.js';
export class multimediaController {
    static async createMultimedia(req, res) {
        try {
            const { nombre, estado, respuesta } = req.body;
            let archivoUrl = req.body.archivo;
            // Si viene un archivo cargado por Multer (bot/panel)
            if (req.file) {
                archivoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            }
            if (!archivoUrl) {
                return res.status(400).json({ menssaje: 'No se recibió ningún archivo o URL' });
            }
            const query = 'INSERT INTO reportes_documentos (nombre, archivo, estado, respuesta) VALUES (?, ?, ?, ?)';
            await db.execute(query, [nombre || 'Adjunto Bot', archivoUrl, estado || 'Recibido', respuesta || '']);
            return res.status(201).json({ menssaje: 'Contenido multimedia registrado', url: archivoUrl });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ menssaje: 'Error al cargar contenido multimedia' });
        }
    }
    static async BringMultimedia(req, res) {
        try {
            const query = 'SELECT * FROM reportes_documentos ORDER BY id DESC';
            const [rows] = await db.execute(query);
            return res.status(200).json({ menssaje: 'Datos obtenidos', datos: rows });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ menssaje: 'No se encontró información multimedia' });
        }
    }
    static async updateMultimedia(req, res) {
        try {
            const { id } = req.params;
            const { estado, respuesta } = req.body;
            const query = 'UPDATE reportes_documentos SET estado = ?, respuesta = ? WHERE id = ?';
            await db.execute(query, [estado, respuesta, id]);
            return res.status(200).json({ menssaje: 'Contenido multimedia actualizado' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ menssaje: 'Error al actualizar contenido multimedia' });
        }
    }
    static async deleteMultimedia(req, res) {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM reportes_documentos WHERE id = ?';
            await db.execute(query, [id]);
            return res.status(200).json({ menssaje: 'Contenido multimedia eliminado' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ menssaje: 'Error al eliminar contenido multimedia' });
        }
    }
}
