import { type Request, type Response } from 'express';
import { db } from '../config/db.js';

export class mainController{
    static async createMain(req:Request, res:Response){
        try{
            const { informe, titulo, estado } = req.body;

            const query = 'INSER INTO informe, titulo, estado VALUES informe = ?, titulo = ?, estado = ?';

            await db.execute(query, {informe, titulo, estado});

            res.status(201).json({ menssaje: 'Se cargaro el contenido principal '});
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al cargar el contenido principal '});
        }
    }

    static async BringMain(req:Request, res:Response){
        try{ 
            const { informe, titulo, estado } = req.body;

            const query = 'SELECT informe, titulo, estado FROM contenido_principal WHERE informe = ?, titulo = ?, estado = ?'

            await db.execute(query, {informe, titulo,estado});

            res.status(204).json({menssaje: 'Se creo el reporte con exito'});
        }catch (error){
            console.log(error)
            res.status(500).json({ menssaje: 'Error al crear el reporte del mes'});
        }
    }

    static async updateMain(req:Request, res:Response){
        try{
            const { informe, titulo, estado } = req.body;

            const query = 'UPDATE contenido_principal informe = ?, titulo = ?, estado = ?';

            await db.execute(query, { informe, titulo, estado });

            res.status(202).json({ menssaje: 'El informe se actualizo con exito' });
        }catch(error){
            console.log(error);
            res.status(500).json({ menssaje: 'Error al actualizar, intente nuevamente'});
        }
    }

    static async deleteMain(req:Request, res:Response){
        try{
            const { informe, titulo, estado } = req.body;

            const query = 'DELETE contenido_principal informe = ?, titulo = ?, estado = ?';

            await db.execute(query, {informe, titulo, estado});
            res.status(205).json({ menssaje: 'El informe fue eliminado correctamente'})
        }catch (error){
            console.log(error);
            res.status(500).json({ menssaje: 'El informe no se pudo eliminar correctamente, intente nuevamente'});
        }
    }
}