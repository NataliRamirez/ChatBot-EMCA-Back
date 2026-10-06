import { type Request, type Response } from "express";
import { db } from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

interface InformeRow extends RowDataPacket {
  id: number;
  empleado_id: number;
  empleado_nombre: string;
  nombre: string;
  tipo: string;
  respuesta?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export class reportesController {

    // =========================================================
    // OBTENER TODOS LOS INFORMES
    // =========================================================
    static async BringReport(req: Request, res: Response) {
        try {
            const query = 'SELECT id, nombre, informe, estado, fecha_generado FROM reporte ORDER BY id DESC';
            const [rows]: any = await db.query(query);

            // Mantenemos "reportes" y "datos" por compatibilidad con cualquier consumo en React
            return res.status(200).json({
                res: true,
                mensaje: 'Informes actuales',
                reportes: rows || [],
                datos: rows || []
            });
        } catch (error: any) {
            console.error('❌ Error en BringReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'Error al obtener los informes',
                error: error.message
            });
        }
    }

    // =========================================================
    // CREAR UN NUEVO INFORME
    // =========================================================
    static async createReport(req: Request, res: Response) {
        try {
            const { nombre, informe, estado } = req.body;

            if (!nombre || !informe) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'El nombre y el contenido del informe son obligatorios'
                });
            }

            const query = 'INSERT INTO reporte (nombre, informe, estado) VALUES (?, ?, ?)';
            await db.query(query, [nombre.trim(), informe.trim(), estado || 'Pendiente']);

            return res.status(201).json({
                res: true,
                mensaje: 'REPORTE CREADO EXITOSAMENTE'
            });
        } catch (error: any) {
            console.error('❌ Error en createReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'NO SE PUDO CREAR EL REPORTE',
                error: error.message
            });
        }
    }

    // =========================================================
    // ACTUALIZAR UN INFORME
    // =========================================================
    static async updateReport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { nombre, informe, estado } = req.body;

            if (!id || !nombre || !informe) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'Faltan campos requeridos para actualizar'
                });
            }

            const query = 'UPDATE reporte SET nombre = ?, informe = ?, estado = ? WHERE id = ?';
            await db.query(query, [nombre.trim(), informe.trim(), estado || 'Pendiente', id]);

            return res.status(200).json({
                res: true,
                mensaje: 'Reporte actualizado exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error en updateReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'No se pudo actualizar el informe',
                error: error.message
            });
        }
    }

    // =========================================================
    // ELIMINAR UN INFORME
    // =========================================================
    static async deleteReport(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    res: false,
                    mensaje: 'El ID del reporte es obligatorio'
                });
            }

            const query = 'DELETE FROM reporte WHERE id = ?';
            await db.query(query, [id]);

            return res.status(200).json({
                res: true,
                mensaje: 'Reporte exitosamente eliminado'
            });
        } catch (error: any) {
            console.error('❌ Error en deleteReport:', error);
            return res.status(500).json({
                res: false,
                mensaje: 'Error al eliminar el reporte',
                error: error.message
            });
        }
    }

  // ==========================================
// GENERAR PDF (ESTRICTAMENTE 1 SOLA HOJA)
// ==========================================
static async generarPDF(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await db.execute<InformeRow[]>(
      'SELECT * FROM reporte_informes ORDER BY id DESC'
    );

    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 120, bottom: 0, left: 40, right: 40 }, // bottom: 0 para evitar salto automático por margen
      autoFirstPage: true
    });

    // Control para evitar páginas secundarias
    doc.on('pageAdded', () => {
      // Si PDFKit intenta agregar una segunda página, la elimina
      const pages = (doc as any)._pageBuffer;
      if (pages.length > 1) {
        pages.pop();
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Bitacoras_EMCA.pdf');

    doc.pipe(res);

    // Título y subtítulo
    doc.fillColor('#000000');
    doc.fontSize(11).font('Helvetica-Bold').text('REPORTE DE BITÁCORAS DEL SISTEMA', { align: 'center' });
    doc.fontSize(8.5).font('Helvetica').text('Empresas Públicas de Calarcá - EMCA E.S.P.', { align: 'center' });
    doc.moveDown(0.5);

    // Contenido dinámico (usamos un límite o tamaño compacto)
    if (rows.length === 0) {
      doc.fontSize(9).font('Helvetica-Oblique').text('No hay registros disponibles.', { align: 'center' });
    } else {
      // Tomamos solo los primeros registros si la lista es grande
      const filasAmostrar = rows.slice(0, 3); 

      filasAmostrar.forEach((item) => {
        const fechaInicioLimpia = item.fechaInicio ? String(item.fechaInicio).split('T')[0] : 'N/A';
        const fechaFinLimpia = item.fechaFin ? String(item.fechaFin).split('T')[0] : 'N/A';

        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#003366').text(`Registro #${item.id} - ${item.nombre || 'Sin Nombre'}`);
        doc.fillColor('#000000').font('Helvetica').fontSize(7.5);
        doc.text(`Empleado: ${item.empleado_nombre || 'N/A'} | Tipo: ${item.tipo || 'General'} | Estado: ${item.estado || 'Pendiente'}`);
        doc.text(`Periodo: ${fechaInicioLimpia} al ${fechaFinLimpia}`);

        if (item.respuesta) {
          doc.text(`Descripción / Respuesta: ${item.respuesta}`);
        }

        doc.moveDown(0.2);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E0E0E0');
        doc.moveDown(0.2);
      });
    }

    // =========================================================
    // ENCABEZADO Y PIE DIBUJADOS EN COORDENADAS ABSOLUTAS
    // =========================================================

    // 1. Encabezado institucional F-GA-028
    doc.lineWidth(1).rect(40, 30, 515, 60).stroke('#000000');
    doc.moveTo(180, 30).lineTo(180, 90).stroke('#000000');
    doc.moveTo(380, 30).lineTo(380, 90).stroke('#000000');
    doc.moveTo(380, 50).lineTo(555, 50).stroke('#000000');
    doc.moveTo(380, 70).lineTo(555, 70).stroke('#000000');

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('EMCA E.S.P.', 50, 50, { width: 120, align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('REPORTES BITÁCORAS', 185, 45, { width: 190, align: 'center' });

    doc.fontSize(8).font('Helvetica-Bold').text('Versión:', 385, 36);
    doc.font('Helvetica').text('2', 480, 36);
    doc.font('Helvetica-Bold').text('Código:', 385, 56);
    doc.font('Helvetica').text('F-GA-028', 480, 56);
    doc.font('Helvetica-Bold').text('Vigente desde:', 385, 76);
    doc.font('Helvetica').text('2023-12-14', 480, 76);

    doc.text('Hoja 1 de 1', 420, 98, { align: 'right' });
    doc.moveTo(40, 108).lineTo(555, 108).stroke('#CCCCCC');

    // 2. Pie de página institucional (Posición fija en la parte inferior)
    doc.moveTo(40, 730).lineTo(555, 730).stroke('#CCCCCC');

      const footerY = 740;
          doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).stroke('#CCCCCC');
          doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
          `EMPRESAS PÚBLICAS DE CALARCÁ E.S.P NIT 890 000 377 - 0\nCarrera 24 No. 39-54 Teléfonos:(57) 3156127130\nSitios WEB: www.emca-calarca-quindio-gov.co\nE-mail: contactenos@emca-calarca-quindio.gov.co`,
          40, footerY, { width: 515, align: 'center' }
            );
             doc.restore();
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    if (!res.headersSent) res.status(500).json({ mensaje: 'Error al generar el archivo PDF' });
  }
}

  // ==========================================
  // GENERAR EXCEL INSTITUCIONAL
  // ==========================================
  static async generarExcel(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await db.execute<InformeRow[]>(
        'SELECT * FROM reporte_informes ORDER BY id DESC'
      );

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Bitácoras EMCA');

      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'EMCA E.S.P. - REPORTE DE BITÁCORAS DEL SISTEMA';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004A99' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;

      sheet.mergeCells('A2:G2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Código: F-GA-028 | Versión: 2 | Generado: ${new Date().toLocaleDateString('es-CO')}`;
      subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '555555' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 18;

      sheet.addRow([]);

      const headers = ['Empleado', 'NombreBitacora', 'Tipo', 'Fecha Inicio', 'Fecha Final', 'Estado', 'Descripción / Respuesta'];
      const headerRow = sheet.addRow(headers);
      headerRow.height = 24;

      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      rows.forEach((r, idx) => {
        const fechaIni = r.fechaInicio ? String(r.fechaInicio).split('T')[0] : 'N/A';
        const fechaFin = r.fechaFin ? String(r.fechaFin).split('T')[0] : 'N/A';

        const row = sheet.addRow([
          r.empleado_nombre || 'N/A',
          r.nombre || 'Sin Nombre',
          r.tipo || 'General',
          fechaIni,
          fechaFin,
          r.estado || 'Pendiente',
          r.respuesta || '-'
        ]);

        row.height = 20;
        const bgPattern = idx % 2 === 0 ? 'F9FAFC' : 'FFFFFF';

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgPattern } };
          cell.alignment = [4, 5, 6].includes(colNumber)
            ? { horizontal: 'center', vertical: 'middle' }
            : { horizontal: 'left', vertical: 'middle' };
        });
      });

      sheet.columns = [
        { width: 22 }, { width: 30 }, { width: 25 },
        { width: 15 }, { width: 15 }, { width: 18 }, { width: 35 }
      ];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Bitacoras_EMCA.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error al generar Excel:', error);
      if (!res.headersSent) res.status(500).json({ mensaje: 'Error al generar el archivo Excel' });
    }
  }

}