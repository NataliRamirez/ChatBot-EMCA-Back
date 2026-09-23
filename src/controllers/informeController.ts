import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

/**
 * Interfaz que define la estructura de los registros de informes
 * obtenidos desde la base de datos.
 *
 * @interface InformeRow
 * @extends {RowDataPacket}
 */
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

/**
 * @file informeController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de informes,
 * permitiendo crear, consultar, actualizar, eliminar y exportar
 * informes en formatos PDF y Excel.
 * 
 * Funcionalidades:
 * - Creación de informes.
 * - Consulta de informes.
 * - Actualización de informes.
 * - Eliminación de informes.
 * - Exportación de informes en PDF.
 * - Exportación de informes en Excel.
 */
export class informeController {

  /**
   * Crea un nuevo informe en el sistema.
   *
   * Valida los datos recibidos, obtiene la información del empleado autenticado cuando sea necesario y registra el informe en la base de datos.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP con la información del informe.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<void>}
   *
   * @throws {Error} Cuando ocurre un error durante el registro del informe.
   */
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

  /**
   * Obtiene el listado completo de informes registrados.
   *
   * Consulta todos los informes almacenados en la base de datos ordenados de forma descendente por identificador.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP recibida por el servidor.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<void>}
   *
   * @throws {Error} Cuando ocurre un error durante la consulta de informes.
   */
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

  /**
   * Actualiza la información de un informe existente.
   *
   * Modifica los datos de un informe identificado mediante su id.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP que contiene el identificador y los nuevos datos.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<void>}
   *
   * @throws {Error} Cuando ocurre un error durante la actualización del informe.
   */
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

  /**
   * Elimina un informe del sistema.
   *
   * Remueve permanentemente el registro asociado al identificador recibido.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP que contiene el identificador del informe.
   * @param {Response} res Respuesta HTTP enviada al cliente.
   * @returns {Promise<void>}
   *
   * @throws {Error} Cuando ocurre un error durante la eliminación del informe.
   */
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

  /**
   * Genera un archivo PDF con el listado de informes registrados.
   *
   * Consulta la información almacenada en la base de datos y construye un documento PDF para su descarga.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP recibida por el servidor.
   * @param {Response} res Respuesta HTTP utilizada para enviar el archivo PDF.
   * @returns {Promise<void>}
   *
   * @throws {Error} Cuando ocurre un error durante la generación del PDF.
   */
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

  /**
   * Genera un archivo Excel con el listado de informes registrados.
   *
   * Consulta la información almacenada en la base de datos y crea
   * una hoja de cálculo para su descarga.
   *
   * @async
   * @static
   * @param {Request} req Solicitud HTTP recibida por el servidor.
   * @param {Response} res Respuesta HTTP utilizada para enviar el archivo Excel.
   * @returns {Promise<void>}
   *
   * @throws {Error} Cuando ocurre un error durante la generación del archivo Excel.
   */
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