import { db } from '../config/db.js';
export class contenPrincipalController {
    static async createContenPrincipal(req, res) {
        try {
            const { titulo, parrafo, estado } = req.body;
            const query = 'INSERT INTO  contenido_principal (titulo, parrafo, estado) titulo = ?, parrafo = ? estado = ?';
            await db.execute(query, { titulo, parrafo, estado });
            res.status(201).json({ menssaje: 'Informe creado con exito' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error de conexión con el backend' });
        }
    }
    static async BringContenPrincipal(req, res) {
        try {
            const { titulo, parrafo, estado } = req.body;
            const query = 'SELECT titulo, parrafo, estado FROM contenido_principal titulo = ?, parrafo = ?, estado = ?';
            await db.execute(query, { titulo, parrafo, estado });
            res.status(202).json({ menssaje: 'Error de conexion al traer el contenido principal' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Listado del cotenido principal cargado con exito' });
        }
    }
    static async updateContenPrincipal(req, res) {
        try {
            const { titulo, parrafo, estado } = req.body;
            const query = 'UPDATE titulo, parrafo, estado, FROM contenido_principal titulo = ?, parrafo = ? estado = ? ';
            await db.execute(query, { titulo, parrafo, estado });
            res.status(201).json({ menssaje: 'Informe actualizado correctamente' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Faltan campos obligatorios' });
        }
    }
    static async deleteContenPrincipal(req, res) {
        try {
            const { titulo, parrafo, estado } = req.body;
            const query = 'DELETE titulo, parrafo, estado FROM contenido_principal titulo = ?, parrafo = ?, estado = ?';
            await db.execute(query, { titulo, parrafo, estado });
            res.status(201).json({ menssaje: 'Informe eliminado correctamente' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error de conexión con la base de datos' });
        }
    }
}
