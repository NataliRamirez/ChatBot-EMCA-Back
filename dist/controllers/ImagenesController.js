import { db } from '../config/db.js';
export class ImagenesController {
    static async CreateImagenes(req, res) {
        try {
            const { nombre, tamaño } = req.body;
            const query = 'INSERT INTO reportes_imagenes (nombre, tamaño) VALUES (?,?)';
            await db.execute(query, { nombre, tamaño });
            res.status(200).json({ menssaje: 'Imagen entrante' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: 'Error de conexion con la base de datos' });
        }
    }
    static async BringImagenes(req, res) {
        try {
            const { nombre, tamaño } = req.body;
            const querry = 'SELECT nombre, tamaño FROM reportes_imagenes';
            await db.execute(querry, { nombre, tamaño });
            res.status(200).json({ menssaje: '' });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ menssaje: '' });
        }
    }
}
