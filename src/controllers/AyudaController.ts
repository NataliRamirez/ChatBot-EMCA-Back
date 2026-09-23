import { type Request, type Response } from "express";

/**
 * @file ayudaController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de proporcionar información de ayuda
 * y orientación sobre las funcionalidades disponibles en el sistema.
 * 
 * @class ayudaController
 */
export class ayudaController {

    /**
     * Obtiene el contenido del centro de ayuda.
     *
     * Retorna un listado de opciones y descripciones de las funcionalidades principales disponibles para el usuario.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Información del centro de ayuda o un mensaje de error.
     *
     * @throws {Error} Cuando ocurre un error inesperado al procesar la solicitud.
     */
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