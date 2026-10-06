import { db } from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
export class informeController {
    // =========================
    // CREAR INFORME
    // =========================
    static async createInforme(req, res) {
        try {
            const { empleado_id, empleado_nombre, nombre, tipo, respuesta, fechaInicio, fechaFin, estado } = req.body;
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
            await db.execute(query, [
                empleado_id,
                empleado_nombre,
                nombre,
                tipo,
                respuesta,
                fechaInicio,
                fechaFin,
                estado
            ]);
            res.status(201).json({
                mensaje: 'Informe creado exitosamente'
            });
        }
        catch (error) {
            console.error('Error al crear informe:', error);
            res.status(500).json({
                mensaje: 'Error al crear el informe'
            });
        }
    }
    // =========================
    // LISTAR INFORMES
    // =========================
    static async BringInforme(req, res) {
        try {
            const [rows] = await db.execute(`
        SELECT *
        FROM reporte_informes
        ORDER BY id DESC
      `);
            res.status(200).json(rows);
        }
        catch (error) {
            console.error('Error al obtener informes:', error);
            res.status(500).json({
                mensaje: 'Error al obtener los informes'
            });
        }
    }
    // =========================
    // ACTUALIZAR INFORME
    // =========================
    static async updateInforme(req, res) {
        try {
            const { id } = req.params;
            const { nombre, tipo, respuesta, fechaInicio, fechaFin, estado } = req.body;
            await db.execute(`
        UPDATE reporte_informes
        SET
          nombre = ?,
          tipo = ?,
          respuesta = ?,
          fechaInicio = ?,
          fechaFin = ?,
          estado = ?
        WHERE id = ?
        `, [
                nombre,
                tipo,
                respuesta,
                fechaInicio,
                fechaFin,
                estado,
                id
            ]);
            res.status(200).json({
                mensaje: 'Informe actualizado correctamente'
            });
        }
        catch (error) {
            console.error('Error al actualizar informe:', error);
            res.status(500).json({
                mensaje: 'Error al actualizar el informe'
            });
        }
    }
    // =========================
    // ELIMINAR INFORME
    // =========================
    static async deleteInforme(req, res) {
        try {
            const { id } = req.params;
            await db.execute('DELETE FROM reporte_informes WHERE id = ?', [id]);
            res.status(200).json({
                mensaje: 'Informe eliminado correctamente'
            });
        }
        catch (error) {
            console.error('Error al eliminar informe:', error);
            res.status(500).json({
                mensaje: 'Error al eliminar el informe'
            });
        }
    }
    // =========================
    // GENERAR PDF
    // =========================
    static async generarPDF(req, res) {
        try {
            const [rows] = await db.execute('SELECT * FROM reporte_informes ORDER BY id DESC');
            const doc = new PDFDocument({ margin: 30 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Informe.pdf');
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
        }
        catch (error) {
            console.error('Error al generar PDF:', error);
            if (!res.headersSent) {
                res.status(500).json({ mensaje: 'Error al generar el archivo PDF' });
            }
        }
    }
    // =========================
    // GENERAR EXCEL
    // =========================
    static async generarExcel(req, res) {
        try {
            const [rows] = await db.execute('SELECT * FROM reporte_informes ORDER BY id DESC');
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
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Informe.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error('Error al generar Excel:', error);
            if (!res.headersSent) {
                res.status(500).json({ mensaje: 'Error al generar el archivo Excel' });
            }
        }
    }
}
