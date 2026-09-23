import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

// Interfaz para dar tipo estricto a las filas de la base de datos
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

  // =========================
  // CREAR INFORME
  // =========================
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

      // 🛑 1. Extraer ID del usuario autenticado si no viene en el body
      const idEmpleadoFinal = empleado_id || (req as any).user?.id || (req as any).user?.id_empleado || 1;
      const nombreEmpleadoFinal = empleado_nombre || (req as any).user?.nombre || 'Empleado Admin';

      // 🛑 2. Validación preventiva antes de tocar la base de datos
      if (!idEmpleadoFinal) {
        res.status(400).json({
          error: 'El ID del empleado (empleado_id) es obligatorio para registrar el informe.'
        });
        return;
      }

      // 💾 3. Insertar con valores validados usando la instancia "db"
      const query = `
        INSERT INTO reporte_informes
        (
          empleado_id,
          empleado_nombre,
          nombre,
          tipo,
          respuesta,
          fechaInicio,
          fechaFin,
          estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        idEmpleadoFinal,
        nombreEmpleadoFinal,
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

    } catch (error) {
      console.error('Error al crear informe:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // =========================
  // LISTAR INFORMES
  // =========================
  static async BringInforme(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await db.execute<InformeRow[]>(`
        SELECT *
        FROM reporte_informes
        ORDER BY id DESC
      `);

      res.status(200).json(rows);
    } catch (error) {
      console.error('Error al obtener informes:', error);
      res.status(500).json({
        mensaje: 'Error al obtener los informes'
      });
    }
  }

  // =========================
  // ACTUALIZAR INFORME
  // =========================
  static async updateInforme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const {
        nombre,
        tipo,
        respuesta,
        fechaInicio,
        fechaFin,
        estado
      } = req.body;

      await db.execute(
        `
        UPDATE reporte_informes
        SET
          nombre = ?,
          tipo = ?,
          respuesta = ?,
          fechaInicio = ?,
          fechaFin = ?,
          estado = ?
        WHERE id = ?
        `,
        [
          nombre,
          tipo,
          respuesta,
          fechaInicio,
          fechaFin,
          estado,
          id
        ]
      );

      res.status(200).json({
        mensaje: 'Informe actualizado correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar informe:', error);
      res.status(500).json({
        mensaje: 'Error al actualizar el informe'
      });
    }
  }

  // =========================
  // ELIMINAR INFORME
  // =========================
  static async deleteInforme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await db.execute(
        'DELETE FROM reporte_informes WHERE id = ?',
        [id]
      );

      res.status(200).json({
        mensaje: 'Informe eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar informe:', error);
      res.status(500).json({
        mensaje: 'Error al eliminar el informe'
      });
    }
  }

  // =========================
  // GENERAR PDF
  // =========================
  static async generarPDF(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await db.execute<InformeRow[]>(
        'SELECT * FROM reporte_informes ORDER BY id DESC'
      );

      const doc = new PDFDocument({ margin: 30 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Informe.pdf'
      );

      doc.pipe(res);

      doc.fontSize(20).text('INFORMES EMCA', {
        align: 'center'
      });

      doc.moveDown();

      rows.forEach((item) => {
        doc.fontSize(12).text(`Empleado: ${item.empleado_nombre}`);
        doc.text(`Nombre: ${item.nombre}`);
        doc.text(`Tipo: ${item.tipo}`);
        doc.text(`Estado: ${item.estado}`);
        doc.text(`Inicio: ${item.fechaInicio}`);
        doc.text(`Fin: ${item.fechaFin}`);
        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      console.error('Error al generar PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ mensaje: 'Error al generar el archivo PDF' });
      }
    }
  }

  // =========================
  // GENERAR EXCEL
  // =========================
  static async generarExcel(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await db.execute<InformeRow[]>(
        'SELECT * FROM reporte_informes ORDER BY id DESC'
      );

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Informes');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Empleado', key: 'empleado_nombre', width: 25 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Estado', key: 'estado', width: 20 },
        { header: 'Inicio', key: 'fechaInicio', width: 15 },
        { header: 'Fin', key: 'fechaFin', width: 15 }
      ];

      rows.forEach((r) => sheet.addRow(r));

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Informe.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error al generar Excel:', error);
      if (!res.headersSent) {
        res.status(500).json({ mensaje: 'Error al generar el archivo Excel' });
      }
    }
  }
}