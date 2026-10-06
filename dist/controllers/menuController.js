import { db } from '../config/db.js';
export class menuController {
    static async createMenu(req, res) {
        try {
            const {} = req.body;
            const query = '';
            await db.execute(query, {});
            res.status(201).json({ menssaje: 'Menu creado con exito' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error al crear el menu' });
        }
    }
    static async BringMenu(req, res) {
        try {
            const { nombre, titulo, estado } = req.body;
            const query = 'SELECT nombre, titulo, estado FROM contenido_menu WHERE nombre = ?, titulo = ?, estado = ?';
            await db.execute(query, { nombre, titulo, estado });
            res.status(201).json({ menssaje: 'Menu traido con exito' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error al traer el menu' });
        }
    }
    static async updateMenu(req, res) {
        try {
            const { nombre, titulo, estado } = req.body;
            const query = 'UPDATE contenido_menu nombre = ?, titulo = ?, estado = ?';
            await db.execute(query, { nombre, titulo, estado });
            res.status(201).json({ menssaje: 'Menu actualizado correctamente' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error al actualizar menu' });
        }
    }
    static async deleteMenu(req, res) {
        try {
            const { nombre, titulo, estado } = req.body;
            const query = 'DELETE contenido_menu nombre = ?, titulo = ?, estado = ?';
            await db.execute(query, { nombre, titulo, estado });
            res.status(500).json({ menssaje: 'El menu se elimino correctamente' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error al eliminar el menu' });
        }
    }
}
