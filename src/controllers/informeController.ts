import { type Request, type Response } from 'express';
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

export class informeController {

  // ==========================================
  // CREAR INFORME (CORREGIDO)
  // ==========================================
  static async createInforme(req: Request, res: Response): Promise<void> {
    try {
      const {
        empleado_id,
        empleado_nombre,
        nombre,
        tipo,
        respuesta,
        fechaInicio,
        fechaFin,
        estado
      } = req.body;

      // Priorizar datos recibidos en body o middleware de autenticación (req.user)
      const idEmpleadoFinal = empleado_id || (req as any).user?.id || (req as any).user?.id_empleado;
      const nombreEmpleadoFinal = empleado_nombre || (req as any).user?.nombre || 'Empleado Indefinido';

      // 1. Validar que el ID de empleado esté presente
      if (!idEmpleadoFinal) {
        res.status(400).json({
          error: 'El ID del empleado es obligatorio.'
        });
        return;
      }

      // 2. Verificar en la BD que el empleado exista
      const [empleadoExiste] = await db.execute<RowDataPacket[]>(
        'SELECT id, nombre FROM empleados WHERE id = ?',
        [idEmpleadoFinal]
      );

      if (empleadoExiste.length === 0) {
        res.status(404).json({
          error: `El empleado con ID ${idEmpleadoFinal} no existe en la base de datos.`
        });
        return;
      }

      // Si no se proporcionó el nombre, toma el nombre registrado en la base de datos
      const nombreDefinitivo = empleado_nombre || empleadoExiste[0].nombre || nombreEmpleadoFinal;

      // 3. Insertar el informe
      const query = `
        INSERT INTO reporte_informes
        (empleado_id, empleado_nombre, nombre, tipo, respuesta, fechaInicio, fechaFin, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        idEmpleadoFinal,
        nombreDefinitivo,
        nombre || 'Sin Nombre',
        tipo || 'General',
        respuesta || '',
        fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin || new Date().toISOString().split('T')[0],
        estado || 'Pendiente'
      ];

      const [result] = await db.execute<ResultSetHeader>(query, values);

      res.status(201).json({
        success: true,
        message: 'Informe creado correctamente',
        id: result.insertId
      });
    } catch (error: any) {
      console.error('Error al crear informe:', error);

      // Captura específica del error de clave foránea de MySQL
      if (error?.code === 'ER_NO_REFERENCED_ROW_2' || error?.errno === 1452) {
        res.status(400).json({
          error: 'El ID de empleado ingresado no se encuentra en la base de datos.'
        });
        return;
      }

      res.status(500).json({ error: 'Error interno del servidor al crear el informe' });
    }
  }

  // ==========================================
  // LISTAR INFORMES
  // ==========================================
  static async BringInforme(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await db.execute<InformeRow[]>(`
        SELECT * FROM reporte_informes ORDER BY id DESC
      `);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error al obtener informes:', error);
      res.status(500).json({ mensaje: 'Error al obtener los informes' });
    }
  }

  // ==========================================
  // ACTUALIZAR INFORME
  // ==========================================
  static async updateInforme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, tipo, respuesta, fechaInicio, fechaFin, estado } = req.body;

      await db.execute(
        `
        UPDATE reporte_informes
        SET nombre = ?, tipo = ?, respuesta = ?, fechaInicio = ?, fechaFin = ?, estado = ?
        WHERE id = ?
        `,
        [
          nombre || 'Sin Nombre',
          tipo || 'General',
          respuesta || '',
          fechaInicio,
          fechaFin,
          estado || 'Pendiente',
          id
        ]
      );

      res.status(200).json({ mensaje: 'Informe actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar informe:', error);
      res.status(500).json({ mensaje: 'Error al actualizar el informe' });
    }
  }

  // ==========================================
  // ELIMINAR INFORME
  // ==========================================
  static async deleteInforme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM reporte_informes WHERE id = ?', [id]);
      res.status(200).json({ mensaje: 'Informe eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar informe:', error);
      res.status(500).json({ mensaje: 'Error al eliminar el informe' });
    }
  }

  // ==========================================
  // GENERAR PDF (FORMATO INSTITUCIONAL F-GA-028)
  // ==========================================
  static async generarPDF(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await db.execute<InformeRow[]>(
        'SELECT * FROM reporte_informes ORDER BY id DESC'
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

          doc.fontSize(10).font('Helvetica-Bold').fillColor('#003366').text(`Registro #${item.id} - ${item.nombre || 'Sin Nombre'}`);
          doc.fillColor('#000000').font('Helvetica').fontSize(9);
          doc.text(`Empleado: ${item.empleado_nombre || 'N/A'}`);
          doc.text(`Tipo: ${item.tipo || 'General'}`);
          doc.text(`Estado: ${item.estado || 'Pendiente'}`);
          doc.text(`Periodo: ${fechaInicioLimpia} al ${fechaFinLimpia}`);

          if (item.respuesta) {
            doc.text(`Descripción / Respuesta: ${item.respuesta}`);
          }

          doc.moveDown(0.5);
          doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E0E0E0');
          doc.moveDown(0.5);
        });
      }

      // Encabezado F-GA-028 y pie dinámico
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.save();

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

        const footerY = 800;
        doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).stroke('#CCCCCC');
        doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
          `EMPRESAS PÚBLICAS DE CALARCÁ E.S.P NIT 890 000 377 - 0
           Carrera 24 No. 39-54 Teléfonos:(57) 3156127130
           Sitios WEB: ww.emca-calarca-quindio-gov.co
           E-mail: notificacionesjudiciales@emca-calarca-quindio.gov.co;
           contactenos@emca-calarca-quindio.gov.co`,
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