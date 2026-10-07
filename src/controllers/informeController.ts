import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

/**
 * Interfaz que define la estructura de los registros de informes
 * obtenidos desde la base de datos.
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

  // =========================================================
  // 1. CREAR INFORME
  // =========================================================

  /**
   * Crea un nuevo informe en el sistema.
   */
  static async createInforme(
    req: Request,
    res: Response
  ): Promise<void> {
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

      // -------------------------------------------------------
      // OBTENER DATOS DEL EMPLEADO
      // -------------------------------------------------------

      const idEmpleadoFinal =
        empleado_id ||
        (req as any).user?.id ||
        (req as any).user?.id_empleado;

      const nombreEmpleadoRecibido =
        empleado_nombre ||
        (req as any).user?.nombre;

      // -------------------------------------------------------
      // VALIDAR ID DEL EMPLEADO
      // -------------------------------------------------------

      if (!idEmpleadoFinal) {
        res.status(400).json({
          error:
            'El ID del empleado (empleado_id) es obligatorio para registrar el informe.'
        });

        return;
      }

      // -------------------------------------------------------
      // VERIFICAR QUE EL EMPLEADO EXISTA
      // -------------------------------------------------------

      const [empleadoExiste] =
        await db.execute<RowDataPacket[]>(
          `
            SELECT
              id,
              nombre
            FROM empleados
            WHERE id = ?
          `,
          [idEmpleadoFinal]
        );

      if (empleadoExiste.length === 0) {
        res.status(404).json({
          error:
            `El empleado con ID ${idEmpleadoFinal} no existe en la base de datos.`
        });

        return;
      }

      // -------------------------------------------------------
      // DEFINIR NOMBRE DEL EMPLEADO
      // -------------------------------------------------------

      const nombreDefinitivo =
        nombreEmpleadoRecibido ||
        empleadoExiste[0].nombre ||
        'Empleado Indefinido';

      // -------------------------------------------------------
      // VALORES POR DEFECTO
      // -------------------------------------------------------

      const nombreInforme =
        nombre || 'Sin Nombre';

      const tipoInforme =
        tipo || 'General';

      const respuestaInforme =
        respuesta || '';

      const fechaInicioInforme =
        fechaInicio ||
        new Date().toISOString().split('T')[0];

      const fechaFinInforme =
        fechaFin ||
        new Date().toISOString().split('T')[0];

      const estadoInforme =
        estado || 'Pendiente';

      // -------------------------------------------------------
      // INSERTAR INFORME
      // -------------------------------------------------------

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
        nombreDefinitivo,
        nombreInforme,
        tipoInforme,
        respuestaInforme,
        fechaInicioInforme,
        fechaFinInforme,
        estadoInforme
      ];

      const [result] =
        await db.execute<ResultSetHeader>(
          query,
          values
        );

      res.status(201).json({
        success: true,
        message: 'Informe creado correctamente',
        id: result.insertId
      });

    } catch (error: any) {
      console.error(
        '❌ Error al crear informe:',
        error
      );

      // -------------------------------------------------------
      // ERROR DE CLAVE FORÁNEA
      // -------------------------------------------------------

      if (
        error?.code === 'ER_NO_REFERENCED_ROW_2' ||
        error?.errno === 1452
      ) {
        res.status(400).json({
          error:
            'El ID de empleado ingresado no se encuentra en la base de datos.'
        });

        return;
      }

      res.status(500).json({
        error:
          'Error interno del servidor al crear el informe'
      });
    }
  }


  // =========================================================
  // 2. LISTAR INFORMES
  // =========================================================

  /**
   * Obtiene el listado completo de informes registrados.
   */
  static async BringInforme(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const [rows] =
        await db.execute<InformeRow[]>(`
          SELECT *
          FROM reporte_informes
          ORDER BY id DESC
        `);

      res.status(200).json(rows);

    } catch (error) {
      console.error(
        '❌ Error al obtener informes:',
        error
      );

      res.status(500).json({
        mensaje:
          'Error al obtener los informes'
      });
    }
  }


  // =========================================================
  // 3. ACTUALIZAR INFORME
  // =========================================================

  /**
   * Actualiza la información de un informe existente.
   */
  static async updateInforme(
    req: Request,
    res: Response
  ): Promise<void> {
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

      // -------------------------------------------------------
      // VALIDAR ID
      // -------------------------------------------------------

      if (!id) {
        res.status(400).json({
          mensaje:
            'El ID del informe es obligatorio'
        });

        return;
      }

      // -------------------------------------------------------
      // ACTUALIZAR INFORME
      // -------------------------------------------------------

      const [result]: any =
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
            nombre || 'Sin Nombre',
            tipo || 'General',
            respuesta || '',
            fechaInicio,
            fechaFin,
            estado || 'Pendiente',
            id
          ]
        );

      // -------------------------------------------------------
      // VERIFICAR EXISTENCIA
      // -------------------------------------------------------

      if (result.affectedRows === 0) {
        res.status(404).json({
          mensaje:
            'Informe no encontrado'
        });

        return;
      }

      res.status(200).json({
        mensaje:
          'Informe actualizado correctamente'
      });

    } catch (error) {
      console.error(
        '❌ Error al actualizar informe:',
        error
      );

      res.status(500).json({
        mensaje:
          'Error al actualizar el informe'
      });
    }
  }


  // =========================================================
  // 4. ELIMINAR INFORME
  // =========================================================

  /**
   * Elimina un informe del sistema.
   */
  static async deleteInforme(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          mensaje:
            'El ID del informe es obligatorio'
        });

        return;
      }

      const [result]: any =
        await db.execute(
          `
            DELETE FROM reporte_informes
            WHERE id = ?
          `,
          [id]
        );

      if (result.affectedRows === 0) {
        res.status(404).json({
          mensaje:
            'Informe no encontrado'
        });

        return;
      }

      res.status(200).json({
        mensaje:
          'Informe eliminado correctamente'
      });

    } catch (error) {
      console.error(
        '❌ Error al eliminar informe:',
        error
      );

      res.status(500).json({
        mensaje:
          'Error al eliminar el informe'
      });
    }
  }


  // =========================================================
  // 5. GENERAR PDF
  // FORMATO INSTITUCIONAL F-GA-028
  // =========================================================

  /**
   * Genera un archivo PDF con el listado de informes registrados.
   */
  static async generarPDF(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const [rows] =
        await db.execute<InformeRow[]>(
          `
            SELECT *
            FROM reporte_informes
            ORDER BY id DESC
          `
        );

      // -------------------------------------------------------
      // CREAR DOCUMENTO PDF
      // -------------------------------------------------------

      const doc = new PDFDocument({
        size: 'A4',
        bufferPages: true,
        margins: {
          top: 130,
          bottom: 60,
          left: 40,
          right: 40
        }
      });

      // -------------------------------------------------------
      // HEADERS
      // -------------------------------------------------------

      res.setHeader(
        'Content-Type',
        'application/pdf'
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Reporte_Informes_EMCA.pdf'
      );

      doc.pipe(res);

      // -------------------------------------------------------
      // CONTENIDO PRINCIPAL
      // -------------------------------------------------------

      doc
        .fillColor('#000000')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(
          'REPORTE DE INFORMES DEL SISTEMA',
          {
            align: 'center'
          }
        );

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          'Empresas Públicas de Calarcá - EMCA E.S.P.',
          {
            align: 'center'
          }
        );

      doc.moveDown(1.5);

      // -------------------------------------------------------
      // SIN REGISTROS
      // -------------------------------------------------------

      if (rows.length === 0) {

        doc
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text(
            'No hay registros disponibles.',
            {
              align: 'center'
            }
          );

      } else {

        // -----------------------------------------------------
        // RECORRER INFORMES
        // -----------------------------------------------------

        rows.forEach((item) => {

          if (doc.y > 700) {
            doc.addPage();
          }

          const fechaInicioLimpia =
            item.fechaInicio
              ? String(item.fechaInicio).split('T')[0]
              : 'N/A';

          const fechaFinLimpia =
            item.fechaFin
              ? String(item.fechaFin).split('T')[0]
              : 'N/A';

          // ---------------------------------------------------
          // TÍTULO DEL REGISTRO
          // ---------------------------------------------------

          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#003366')
            .text(
              `Registro #${item.id} - ${item.nombre || 'Sin Nombre'}`
            );

          // ---------------------------------------------------
          // INFORMACIÓN
          // ---------------------------------------------------

          doc
            .fillColor('#000000')
            .font('Helvetica')
            .fontSize(9);

          doc.text(
            `Empleado: ${item.empleado_nombre || 'N/A'}`
          );

          doc.text(
            `Tipo: ${item.tipo || 'General'}`
          );

          doc.text(
            `Estado: ${item.estado || 'Pendiente'}`
          );

          doc.text(
            `Periodo: ${fechaInicioLimpia} al ${fechaFinLimpia}`
          );

          if (item.respuesta) {
            doc.text(
              `Descripción / Respuesta: ${item.respuesta}`
            );
          }

          // ---------------------------------------------------
          // SEPARADOR
          // ---------------------------------------------------

          doc.moveDown(0.5);

          doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke('#E0E0E0');

          doc.moveDown(0.5);
        });
      }

      // =======================================================
      // ENCABEZADO Y PIE DE PÁGINA
      // =======================================================

      const range =
        doc.bufferedPageRange();

      for (
        let i = range.start;
        i < range.start + range.count;
        i++
      ) {

        doc.switchToPage(i);

        doc.save();

        // -----------------------------------------------------
        // TABLA DEL ENCABEZADO
        // -----------------------------------------------------

        doc
          .lineWidth(1)
          .rect(40, 30, 515, 60)
          .stroke('#000000');

        doc
          .moveTo(180, 30)
          .lineTo(180, 90)
          .stroke('#000000');

        doc
          .moveTo(380, 30)
          .lineTo(380, 90)
          .stroke('#000000');

        doc
          .moveTo(380, 50)
          .lineTo(555, 50)
          .stroke('#000000');

        doc
          .moveTo(380, 70)
          .lineTo(555, 70)
          .stroke('#000000');

        // -----------------------------------------------------
        // INFORMACIÓN EMCA
        // -----------------------------------------------------

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(
            'EMCA E.S.P.',
            50,
            50,
            {
              width: 120,
              align: 'center'
            }
          );

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(
            'REPORTES INFORMES',
            185,
            45,
            {
              width: 190,
              align: 'center'
            }
          );

        // -----------------------------------------------------
        // DATOS DEL FORMATO
        // -----------------------------------------------------

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(
            'Versión:',
            385,
            36
          );

        doc
          .font('Helvetica')
          .text(
            '2',
            480,
            36
          );

        doc
          .font('Helvetica-Bold')
          .text(
            'Código:',
            385,
            56
          );

        doc
          .font('Helvetica')
          .text(
            'F-GA-028',
            480,
            56
          );

        doc
          .font('Helvetica-Bold')
          .text(
            'Vigente desde:',
            385,
            76
          );

        doc
          .font('Helvetica')
          .text(
            '2023-12-14',
            480,
            76
          );

        // -----------------------------------------------------
        // NÚMERO DE PÁGINA
        // -----------------------------------------------------

        doc.text(
          `Hoja ${i + 1} de ${range.count}`,
          420,
          98,
          {
            align: 'right'
          }
        );

        doc
          .moveTo(40, 112)
          .lineTo(555, 112)
          .stroke('#CCCCCC');

        // -----------------------------------------------------
        // PIE DE PÁGINA
        // -----------------------------------------------------

        const footerY = 800;

        doc
          .moveTo(40, footerY - 8)
          .lineTo(555, footerY - 8)
          .stroke('#CCCCCC');

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#555555')
          .text(
            `EMPRESAS PÚBLICAS DE CALARCÁ E.S.P NIT 890 000 377 - 0
Carrera 24 No. 39-54 Teléfonos:(57) 3156127130
Sitios WEB: ww.emca-calarca-quindio-gov.co
E-mail: notificacionesjudiciales@emca-calarca-quindio.gov.co;
contactenos@emca-calarca-quindio.gov.co`,
            40,
            footerY,
            {
              width: 515,
              align: 'center'
            }
          );

        doc.restore();
      }

      // -------------------------------------------------------
      // FINALIZAR PDF
      // -------------------------------------------------------

      doc.end();

    } catch (error) {
      console.error(
        '❌ Error al generar PDF:',
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          mensaje:
            'Error al generar el archivo PDF'
        });
      }
    }
  }


  // =========================================================
  // 6. GENERAR EXCEL
  // =========================================================

  /**
   * Genera un archivo Excel con el listado de informes registrados.
   */
  static async generarExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    try {

      const [rows] =
        await db.execute<InformeRow[]>(
          `
            SELECT *
            FROM reporte_informes
            ORDER BY id DESC
          `
        );

      // -------------------------------------------------------
      // CREAR LIBRO
      // -------------------------------------------------------

      const workbook =
        new ExcelJS.Workbook();

      const sheet =
        workbook.addWorksheet(
          'Informes EMCA'
        );

      // =======================================================
      // ENCABEZADO
      // =======================================================

      sheet.mergeCells('A1:G1');

      const titleCell =
        sheet.getCell('A1');

      titleCell.value =
        'EMCA E.S.P. - REPORTE DE INFORMES DEL SISTEMA';

      titleCell.font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: {
          argb: 'FFFFFF'
        }
      };

      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: '004A99'
        }
      };

      titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };

      sheet.getRow(1).height = 30;

      // =======================================================
      // INFORMACIÓN DEL FORMATO
      // =======================================================

      sheet.mergeCells('A2:G2');

      const subCell =
        sheet.getCell('A2');

      subCell.value =
        `Código: F-GA-028 | Versión: 2 | Generado: ${new Date().toLocaleDateString('es-CO')}`;

      subCell.font = {
        name: 'Arial',
        size: 9,
        italic: true,
        color: {
          argb: '555555'
        }
      };

      subCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };

      sheet.getRow(2).height = 18;

      sheet.addRow([]);

      // =======================================================
      // ENCABEZADOS
      // =======================================================

      const headers = [
        'ID',
        'Empleado',
        'Nombre Informe',
        'Tipo',
        'Fecha Inicio',
        'Fecha Final',
        'Estado',
        'Descripción / Respuesta'
      ];

      const headerRow =
        sheet.addRow(headers);

      headerRow.height = 24;

      headerRow.eachCell((cell) => {

        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
          color: {
            argb: 'FFFFFF'
          }
        };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: '003366'
          }
        };

        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
      });

      // =======================================================
      // DATOS
      // =======================================================

      rows.forEach((r, idx) => {

        const fechaIni =
          r.fechaInicio
            ? String(r.fechaInicio).split('T')[0]
            : 'N/A';

        const fechaFin =
          r.fechaFin
            ? String(r.fechaFin).split('T')[0]
            : 'N/A';

        const row =
          sheet.addRow([
            r.id,
            r.empleado_nombre || 'N/A',
            r.nombre || 'Sin Nombre',
            r.tipo || 'General',
            fechaIni,
            fechaFin,
            r.estado || 'Pendiente',
            r.respuesta || '-'
          ]);

        row.height = 20;

        const bgPattern =
          idx % 2 === 0
            ? 'F9FAFC'
            : 'FFFFFF';

        row.eachCell(
          (cell, colNumber) => {

            cell.font = {
              name: 'Arial',
              size: 9
            };

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: bgPattern
              }
            };

            cell.alignment =
              [1, 5, 6, 7].includes(
                colNumber
              )
                ? {
                    horizontal: 'center',
                    vertical: 'middle'
                  }
                : {
                    horizontal: 'left',
                    vertical: 'middle'
                  };
          }
        );
      });

      // =======================================================
      // ANCHO DE COLUMNAS
      // =======================================================

      sheet.columns = [
        {
          width: 10
        },
        {
          width: 25
        },
        {
          width: 30
        },
        {
          width: 20
        },
        {
          width: 15
        },
        {
          width: 15
        },
        {
          width: 18
        },
        {
          width: 40
        }
      ];

      // =======================================================
      // HEADERS DE RESPUESTA
      // =======================================================

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Reporte_Informes_EMCA.xlsx'
      );

      // =======================================================
      // GENERAR ARCHIVO
      // =======================================================

      await workbook.xlsx.write(res);

      res.end();

    } catch (error) {
      console.error(
        '❌ Error al generar Excel:',
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          mensaje:
            'Error al generar el archivo Excel'
        });
      }
    }
  }
}