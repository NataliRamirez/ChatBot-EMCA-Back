import { Request, Response } from "express";
import { db } from "../config/db.js";
import { RowDataPacket } from "mysql2";
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

interface BitacoraRow extends RowDataPacket {
    id: number;
    titulo?: string;
    nombre?: string;
    empleado_nombre?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    estado?: string;
    descripcion?: string;
    texto?: string;
    respuesta?: string;
}

export class bitacorasController {

    // ==========================
    // CREAR BITÁCORA
    // ==========================
    static async CreateBitacoras(req: Request, res: Response) {
        try {
            const {
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto
            } = req.body;

            const query = `
                INSERT INTO bitacora
                (
                    titulo,
                    nombre,
                    fechaInicio,
                    fechaFin,
                    estado,
                    descripcion,
                    texto
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto
            ]);

            res.status(201).json({
                mensaje: "Bitácora creada con éxito"
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: "Error al crear la bitácora"
            });
        }
    }

    // ==========================
    // LISTAR BITÁCORAS
    // ==========================
    static async BringBitacoras(req: Request, res: Response) {
        try {
            const [rows] = await db.execute(`
                SELECT *
                FROM bitacora
                ORDER BY id DESC
            `);

            res.status(200).json(rows);

        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: "Error al consultar las bitácoras"
            });
        }
    }

    // ==========================
    // ACTUALIZAR BITÁCORA
    // ==========================
    static async UpdateBitacoras(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto
            } = req.body;

            const query = `
                UPDATE bitacora
                SET
                    titulo = ?,
                    nombre = ?,
                    fechaInicio = ?,
                    fechaFin = ?,
                    estado = ?,
                    descripcion = ?,
                    texto = ?
                WHERE id = ?
            `;

            await db.execute(query, [
                titulo,
                nombre,
                fechaInicio,
                fechaFin,
                estado,
                descripcion,
                texto,
                id
            ]);

            res.status(200).json({
                mensaje: "Bitácora actualizada con éxito"
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: "Error al actualizar la bitácora"
            });
        }
    }

    // ==========================
    // ELIMINAR BITÁCORA
    // ==========================
    static async DeleteBitacoras(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await db.execute(
                "DELETE FROM bitacora WHERE id = ?",
                [id]
            );

            res.status(200).json({
                mensaje: "Bitácora eliminada con éxito"
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                mensaje: "Error al eliminar la bitácora"
            });
        }
    }

    // ==========================
    // GENERAR REPORTES PDF (F-GA-028)
    // ==========================
    static async generarPDF(req: Request, res: Response) {
        try {
            const [rows] = await db.execute<BitacoraRow[]>(
                'SELECT * FROM bitacora ORDER BY id DESC'
            );

            const doc = new PDFDocument({
                size: 'A4',
                bufferPages: true,
                margins: { top: 130, bottom: 60, left: 40, right: 40 }
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Bitacoras_EMCA.pdf');

            doc.pipe(res);

            doc.fillColor('#000000');
            doc.fontSize(12).font('Helvetica-Bold').text('REPORTE DE BITÁCORAS DEL SISTEMA', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Empresas Públicas de Calarcá - EMCA E.S.P.', { align: 'center' });
            doc.moveDown(1.5);

            if (rows.length === 0) {
                doc.fontSize(10).font('Helvetica-Oblique').text('No hay registros disponibles.', { align: 'center' });
            } else {
                rows.forEach((item) => {
                    if (doc.y > 700) doc.addPage();

                    const fechaInicioLimpia = item.fechaInicio ? String(item.fechaInicio).split('T')[0] : 'N/A';
                    const fechaFinLimpia = item.fechaFin ? String(item.fechaFin).split('T')[0] : 'N/A';

                    doc.fontSize(10).font('Helvetica-Bold').fillColor('#003366').text(`Registro #${item.id} - ${item.nombre || item.titulo || 'Sin Nombre'}`);
                    doc.fillColor('#000000').font('Helvetica').fontSize(9);
                    doc.text(`Empleado: ${item.empleado_nombre || 'N/A'}`);
                    doc.text(`Tipo: ${item.tipo || 'General'}`);
                    doc.text(`Estado: ${item.estado || 'Pendiente'}`);
                    doc.text(`Periodo: ${fechaInicioLimpia} al ${fechaFinLimpia}`);

                    if (item.descripcion || item.texto || item.respuesta) {
                        doc.text(`Descripción / Respuesta: ${item.descripcion || item.texto || item.respuesta}`);
                    }

                    doc.moveDown(0.5);
                    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E0E0E0');
                    doc.moveDown(0.5);
                });
            }

            // ENCABEZADO Y PIE DE PÁGINA DINÁMICO
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.save();

                // Cuadro del formato F-GA-028
                doc.lineWidth(1).rect(40, 30, 515, 60).stroke('#000000');
                doc.moveTo(180, 30).lineTo(180, 90).stroke('#000000');
                doc.moveTo(380, 30).lineTo(380, 90).stroke('#000000');
                doc.moveTo(380, 50).lineTo(555, 50).stroke('#000000');
                doc.moveTo(380, 70).lineTo(555, 70).stroke('#000000');

                doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('EMCA E.S.P.', 50, 50, { width: 120, align: 'center' });
                doc.fontSize(11).font('Helvetica-Bold').text('REPORTES BITACORAS', 185, 45, { width: 190, align: 'center' });

                doc.fontSize(8).font('Helvetica-Bold').text('Versión:', 385, 36);
                doc.font('Helvetica').text('2', 480, 36);
                doc.font('Helvetica-Bold').text('Código:', 385, 56);
                doc.font('Helvetica').text('F-GA-028', 480, 56);
                doc.font('Helvetica-Bold').text('Vigente desde:', 385, 76);
                doc.font('Helvetica').text('2023-12-14', 480, 76);

                doc.text(`Hoja ${i + 1} de ${range.count}`, 420, 98, { align: 'right' });
                doc.moveTo(40, 112).lineTo(555, 112).stroke('#CCCCCC');

                const footerY = 740;
                doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).stroke('#CCCCCC');
                doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
                    `EMPRESAS PÚBLICAS DE CALARCÁ E.S.P NIT 890 000 377 - 0\nCarrera 24 No. 39-54 Teléfonos:(57) 3156127130\nSitios WEB: www.emca-calarca-quindio-gov.co\nE-mail: contactenos@emca-calarca-quindio.gov.co`,
                    40, footerY, { width: 515, align: 'center' }
                );

                doc.restore();
            }

            doc.end();
        } catch (error) {
            console.error('Error al generar PDF:', error);
            if (!res.headersSent) res.status(500).json({ mensaje: 'Error al generar el archivo PDF' });
        }
    }

    // ==========================
    // GENERAR EXCEL CON EXCELJS
    // ==========================
    static async descargarExcel(req: Request, res: Response) {
        try {
            const [rows] = await db.execute<BitacoraRow[]>(
                'SELECT * FROM bitacora ORDER BY id DESC'
            );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte de Bitácoras');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Título / Nombre', key: 'titulo', width: 30 },
                { header: 'Empleado', key: 'empleado_nombre', width: 25 },
                { header: 'Fecha Inicio', key: 'fechaInicio', width: 15 },
                { header: 'Fecha Fin', key: 'fechaFin', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Descripción', key: 'descripcion', width: 40 }
            ];

            rows.forEach((row) => {
                worksheet.addRow({
                    id: row.id,
                    titulo: row.nombre || row.titulo || 'N/A',
                    empleado_nombre: row.empleado_nombre || 'N/A',
                    fechaInicio: row.fechaInicio ? String(row.fechaInicio).split('T')[0] : 'N/A',
                    fechaFin: row.fechaFin ? String(row.fechaFin).split('T')[0] : 'N/A',
                    estado: row.estado || 'Pendiente',
                    descripcion: row.descripcion || row.texto || row.respuesta || 'N/A'
                });
            });

            // Estilos del encabezado
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '003366' }
            };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Bitacoras_EMCA.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Error al generar Excel:', error);
            if (!res.headersSent) res.status(500).json({ mensaje: 'Error al generar la hoja de Excel' });
        }
    }
}