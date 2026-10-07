import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

interface RespuestaRow extends RowDataPacket {
    id: number;
    Nradicado?: string;
    titulo?: string;
    nombre?: string;
    telefono?: string;
    telefonoEmpresa?: string;
    tipoRespuesta?: string;
    estados?: string;
    descripcion?: string;
    fechaInicio?: string;
    fechaFinal?: string;
}




/**
 * @file respuestasController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de respuestas del sistema, permitiendo crear, consultar, actualizar y eliminar respuestas almacenadas
 * en la base de datos.
 *
 * Funcionalidades:
 * - Consulta de respuestas.
 * - Creación de respuestas.
 * - Actualización de respuestas.
 * - Eliminación de respuestas.
 *
 * @class respuestasController
 */
export class respuestasController {

     /**
     * Obtiene todas las respuestas registradas en el sistema.
     *
     * Consulta la información almacenada en la tabla respuestas y retorna los registros ordenados de forma descendente por ID.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP recibida por el servidor.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Listado de respuestas registradas.
     *
     * @throws {Error} Cuando ocurre un error durante la consulta a la base de datos.
     */
    static async BringRespuestas(req: Request, res: Response) {
        try {

            const query = `
                SELECT *
                FROM respuestas
                ORDER BY id DESC
            `;


            const [rows] = await db.execute<RespuestaRow[]>(query);

            return res.status(200).json(rows);

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: "Error al obtener las respuestas."
            });
        }
    }


    /**
     * Registra una nueva respuesta en el sistema.
     *
     * Valida que todos los campos obligatorios estén presentes antes de almacenar la información en la base de datos.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene los datos de la respuesta.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la operación de registro.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de inserción.
     */
    static async CreateRespuestas(req: Request, res: Response) {

        try {

            const {
                Nradicado,
                titulo,
                nombre,
                telefono,
                telefonoEmpresa,
                tipoRespuesta,
                estados,
                descripcion,
                fechaInicio,
                fechaFinal
            } = req.body;

            if (
                !Nradicado ||
                !titulo ||
                !nombre ||
                !telefono ||
                !telefonoEmpresa ||
                !telefonoEmpresa||
                !tipoRespuesta ||
                !estados ||
                !descripcion ||
                !fechaInicio ||
                !fechaFinal
            ) {
                return res.status(400).json({
                    mensaje: "Todos los campos obligatorios deben ser diligenciados."
                });
            }

            const query = `INSERT INTO respuestas ( Nradicado, titulo, nombre, telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            await db.execute(query, [
                String(Nradicado).trim(),
                String(titulo).trim(),
                String(nombre).trim(),
                String(telefono).trim(),
                String(telefonoEmpresa).trim(),
                String(tipoRespuesta).trim(),
                String(estados).trim(),
                String(descripcion).trim(),
                fechaInicio,
                fechaFinal
            ]);

           

            await db.execute(query, [Nradicado, titulo, nombre, telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal ]);
            return res.status(201).json({
                mensaje: "Respuesta creada correctamente."
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: "Error al crear la respuesta."
            });
        }
    }

    /**
     * Actualiza una respuesta existente.
     *
     * Modifica la información de una respuesta previamente registrada utilizando el identificador recibido como parámetro.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID y los nuevos datos.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la actualización.
     *
     * @throws {Error} Cuando ocurre un error durante la actualización de la información.
     */
    static async UpdateRespuestas(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const { Nradicado, titulo, nombre,  telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal } = req.body;

            const query = `UPDATE respuestas SET Nradicado = ?, titulo = ?, nombre = ?, telefono = ?, telefonoEmpresa = ?, tipoRespuesta = ?, estados = ?, descripcion = ?, fechaInicio = ?, fechaFinal = ? WHERE id = ?`;
            await db.execute(query, [ Nradicado, titulo, nombre, telefono, telefonoEmpresa, tipoRespuesta, estados, descripcion, fechaInicio, fechaFinal, id ]);
            return res.status(200).json({
                mensaje: "Respuesta actualizada correctamente."
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: "Error al actualizar la respuesta."
            });
        }
    }

    /**
     * Elimina una respuesta registrada en el sistema.
     *
     * Realiza la eliminación permanente de una respuesta utilizando el identificador recibido en la solicitud.
     *
     * @async
     * @static
     * @param {Request} req Solicitud HTTP que contiene el ID de la respuesta.
     * @param {Response} res Respuesta HTTP enviada al cliente.
     * @returns {Promise<Response>} Resultado de la eliminación.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de eliminación.
     */
    static async DeleteRespuestas(req: Request, res: Response) {

        try {

            const { id } = req.params;

            await db.execute(
                "DELETE FROM respuestas WHERE id = ?",
                [id]
            );

            return res.status(200).json({
                mensaje: "Respuesta eliminada correctamente."
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: "Error al eliminar la respuesta."
            });
        }
    }


    static async generarPDF(req: Request, res: Response) {
        try {
            const [rows] = await db.execute<RespuestaRow[]>(
                'SELECT * FROM respuestas ORDER BY id DESC'
            );

            const doc = new PDFDocument({
                size: 'A4',
                bufferPages: true,
                margins: { top: 130, bottom: 60, left: 40, right: 40 }
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Respuestas_EMCA.pdf');

            doc.pipe(res);

            // Título Principal
            doc.fillColor('#000000');
            doc.fontSize(12).font('Helvetica-Bold').text('REPORTE DE RESPUESTAS REGISTRADAS', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Empresas Públicas de Calarcá - EMCA E.S.P.', { align: 'center' });
            doc.moveDown(1.5);

            if (rows.length === 0) {
                doc.fontSize(10).font('Helvetica-Oblique').text('No hay registros disponibles.', { align: 'center' });
            } else {
                rows.forEach((item) => {
                    if (doc.y > 700) doc.addPage();

                    const fechaInicioLimpia = item.fechaInicio ? String(item.fechaInicio).split('T')[0] : 'N/A';
                    const fechaFinLimpia = item.fechaFinal ? String(item.fechaFinal).split('T')[0] : 'N/A';

                    doc.fontSize(10).font('Helvetica-Bold').fillColor('#003366').text(`Radicado N° ${item.Nradicado || item.id} - ${item.titulo || 'Sin Título'}`);
                    doc.fillColor('#000000').font('Helvetica').fontSize(9);
                    doc.text(`Destinatario / Usuario: ${item.nombre || 'N/A'}`);
                    doc.text(`Teléfono: ${item.telefono || 'N/A'} | Tel. Empresa: ${item.telefonoEmpresa || 'N/A'}`);
                    doc.text(`Tipo Respuesta: ${item.tipoRespuesta || 'N/A'} | Estado: ${item.estados || 'N/A'}`);
                    doc.text(`Vigencia: ${fechaInicioLimpia} al ${fechaFinLimpia}`);

                    if (item.descripcion) {
                        doc.text(`Descripción: ${item.descripcion}`);
                    }

                    doc.moveDown(0.5);
                    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E0E0E0');
                    doc.moveDown(0.5);
                });
            }

            // Renderizado diferido de Encabezado y Pie de página en todas las páginas generadas
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);

                // Cuadro Encabezado Formato F-GA-028
                doc.lineWidth(1).rect(40, 30, 515, 60).stroke('#000000');
                doc.moveTo(180, 30).lineTo(180, 90).stroke('#000000');
                doc.moveTo(380, 30).lineTo(380, 90).stroke('#000000');
                doc.moveTo(380, 50).lineTo(555, 50).stroke('#000000');
                doc.moveTo(380, 70).lineTo(555, 70).stroke('#000000');

                doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('EMCA E.S.P.', 50, 50, { width: 120, align: 'center' });
                doc.fontSize(11).font('Helvetica-Bold').text('REPORTE RESPUESTAS', 185, 45, { width: 190, align: 'center' });

                doc.fontSize(8).font('Helvetica-Bold').text('Versión:', 385, 36);
                doc.font('Helvetica').text('2', 480, 36);
                doc.font('Helvetica-Bold').text('Código:', 385, 56);
                doc.font('Helvetica').text('F-GA-028', 480, 56);
                doc.font('Helvetica-Bold').text('Vigente desde:', 385, 76);
                doc.font('Helvetica').text('2023-12-14', 480, 76);

                doc.text(`Hoja ${i + 1} de ${range.count}`, 420, 98, { align: 'right' });
                doc.moveTo(40, 112).lineTo(555, 112).stroke('#CCCCCC');

                // Pie de Página
                const footerY = 740;
                doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).stroke('#CCCCCC');
                doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
                    `EMPRESAS PÚBLICAS DE CALARCÁ E.S.P NIT 890 000 377 - 0\nCarrera 24 No. 39-54 Teléfonos:(57) 3156127130\nSitios WEB: www.emca-calarca-quindio-gov.co\nE-mail: contactenos@emca-calarca-quindio.gov.co`,
                    40, footerY, { width: 515, align: 'center' }
                );
            }

            doc.end();
        } catch (error) {
            console.error('Error al generar PDF:', error);
            if (!res.headersSent) res.status(500).json({ mensaje: 'Error al generar el archivo PDF' });
        }
    }

    static async descargarExcel(req: Request, res: Response) {
        try {
            const [rows] = await db.execute<RespuestaRow[]>(
                'SELECT * FROM respuestas ORDER BY id DESC'
            );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte de Respuestas');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'N° Radicado', key: 'Nradicado', width: 15 },
                { header: 'Título', key: 'titulo', width: 25 },
                { header: 'Nombre', key: 'nombre', width: 25 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Teléfono Empresa', key: 'telefonoEmpresa', width: 18 },
                { header: 'Tipo Respuesta', key: 'tipoRespuesta', width: 18 },
                { header: 'Estado', key: 'estados', width: 15 },
                { header: 'Fecha Inicio', key: 'fechaInicio', width: 15 },
                { header: 'Fecha Final', key: 'fechaFinal', width: 15 },
                { header: 'Descripción', key: 'descripcion', width: 40 }
            ];

            rows.forEach((row) => {
                worksheet.addRow({
                    id: row.id,
                    Nradicado: row.Nradicado || 'N/A',
                    titulo: row.titulo || 'N/A',
                    nombre: row.nombre || 'N/A',
                    telefono: row.telefono || 'N/A',
                    telefonoEmpresa: row.telefonoEmpresa || 'N/A',
                    tipoRespuesta: row.tipoRespuesta || 'N/A',
                    estados: row.estados || 'N/A',
                    fechaInicio: row.fechaInicio ? String(row.fechaInicio).split('T')[0] : 'N/A',
                    fechaFinal: row.fechaFinal ? String(row.fechaFinal).split('T')[0] : 'N/A',
                    descripcion: row.descripcion || 'N/A'
                });
            });

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '003366' }
            };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Respuestas_EMCA.xlsx');

            // Finalización correcta de transmisión
            await workbook.xlsx.write(res);

        } catch (error) {
            console.error('Error al generar Excel:', error);
            if (!res.headersSent) res.status(500).json({ mensaje: 'Error al generar la hoja de Excel' });
        }
    }

}