import { type Request, type Response } from "express";

export class ayudaController {

    static async obtenerAyuda(req: Request, res: Response) {
        try {

            return res.status(200).json({
                titulo: "Centro de Ayuda",
                opciones: [
                    {
                        titulo: "Crear una respuesta",
                        descripcion: "Permite registrar una nueva respuesta en el sistema."
                    },
                    {
                        titulo: "Editar una respuesta",
                        descripcion: "Permite modificar la información de una respuesta existente."
                    },
                    {
                        titulo: "Eliminar una respuesta",
                        descripcion: "Elimina una respuesta de forma permanente."
                    },
                    {
                        titulo: "Cerrar sesión",
                        descripcion: "Finaliza la sesión del usuario."
                    }
                ]
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                mensaje: "Error al obtener la ayuda."
            });

        }

    }

}