import { type Request, type Response } from "express";
import { db } from "../config/db.js";
import { type RowDataPacket, type ResultSetHeader } from "mysql2";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

/**
 * @file bitacorasController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de bitácoras del sistema,
 * permitiendo crear, consultar, actualizar y eliminar registros.
 *
 * Funcionalidades:
 * - Creación de bitácoras.
 * - Consulta de bitácoras registradas.
 * - Consulta de una bitácora por ID.
 * - Actualización de bitácoras.
 * - Eliminación de bitácoras.
 * - Generación de reportes PDF.
 * - Generación de reportes Excel.
 */

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

    /**
     * Crea una nueva bitácora.
     */
    static async CreateBitacoras(
        req: Request,
        res: Response
    ): Promise<void> {
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

            const [result] =
                await db.execute<ResultSetHeader>(
                    query,
                    [
                        titulo,
                        nombre,
                        fechaInicio,
                        fechaFin,
                        estado,
                        descripcion,
                        texto
                    ]
                );

            res.status(201).json({
                success: true,
                mensaje: "Bitácora creada con éxito",
                id: result.insertId
            });

        } catch (error: any) {
            console.error(
                "❌ Error al crear la bitácora:",
                error
            );

            res.status(500).json({
                success: false,
                mensaje: "Error al crear la bitácora",
                error: error.message
            });
        }
    }


    /**
     * Consulta todas las bitácoras registradas.
     */
    static async BringBitacoras(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const [rows] =
                await db.execute<BitacoraRow[]>(`
                    SELECT *
                    FROM bitacora
                    ORDER BY id DESC
                `);

            res.status(200).json(rows);

        } catch (error: any) {
            console.error(
                "❌ Error al consultar las bitácoras:",
                error
            );

            res.status(500).json({
                success: false,
                mensaje: "Error al consultar las bitácoras",
                error: error.message
            });
        }
    }


    /**
     * Consulta una bitácora específica por ID.
     */
    static async BringBitacora(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    mensaje: "El ID de la bitácora es obligatorio"
                });
                return;
            }

            const [rows] =
                await db.execute<BitacoraRow[]>(
                    `
                        SELECT *
                        FROM bitacora
                        WHERE id = ?
                    `,
                    [id]
                );

            if (rows.length === 0) {
                res.status(404).json({
                    success: false,
                    mensaje: "Bitácora no encontrada"
                });
                return;
            }

            res.status(200).json(rows[0]);

        } catch (error: any) {
            console.error(
                "❌ Error al obtener la bitácora:",
                error
            );

            res.status(500).json({
                success: false,
                mensaje: "Error al obtener la bitácora",
                error: error.message
            });
        }
    }


    /**
     * Actualiza una bitácora existente.
     */
    static async UpdateBitacoras(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    mensaje: "El ID de la bitácora es obligatorio"
                });
                return;
            }

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

            const [result] =
                await db.execute<ResultSetHeader>(
                    query,
                    [
                        titulo,
                        nombre,
                        fechaInicio,
                        fechaFin,
                        estado,
                        descripcion,
                        texto,
                        id
                    ]
                );

            if (result.affectedRows === 0) {
                res.status(404).json({
                    success: false,
                    mensaje: "Bitácora no encontrada"
                });
                return;
            }

            res.status(200).json({
                success: true,
                mensaje: "Bitácora actualizada con éxito"
            });

        } catch (error: any) {
            console.error(
                "❌ Error al actualizar la bitácora:",
                error
            );

            res.status(500).json({
                success: false,
                mensaje: "Error al actualizar la bitácora",
                error: error.message
            });
        }
    }


    /**
     * Elimina una bitácora.
     */
    static async DeleteBitacoras(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    mensaje: "El ID de la bitácora es obligatorio"
                });
                return;
            }

            const [result] =
                await db.execute<ResultSetHeader>(
                    `
                        DELETE FROM bitacora
                        WHERE id = ?
                    `,
                    [id]
                );

            if (result.affectedRows === 0) {
                res.status(404).json({
                    success: false,
                    mensaje: "Bitácora no encontrada"
                });
                return;
            }

            res.status(200).json({
                success: true,
                mensaje: "Bitácora eliminada con éxito"
            });

        } catch (error: any) {
            console.error(
                "❌ Error al eliminar la bitácora:",
                error
            );

            res.status(500).json({
                success: false,
                mensaje: "Error al eliminar la bitácora",
                error: error.message
            });
        }
    }


    /**
     * Genera el reporte de bitácoras en PDF.
     */
    static async generarPDF(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const [rows] =
                await db.execute<BitacoraRow[]>(
                    `
                        SELECT *
                        FROM bitacora
                        ORDER BY id DESC
                    `
                );

            const doc = new PDFDocument({
                size: "A4",
                bufferPages: true,
                margins: {
                    top: 130,
                    bottom: 60,
                    left: 40,
                    right: 40
                }
            });

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                "attachment; filename=Reporte_Bitacoras_EMCA.pdf"
            );

            doc.pipe(res);

            doc
                .fillColor("#000000")
                .fontSize(12)
                .font("Helvetica-Bold")
                .text(
                    "REPORTE DE BITÁCORAS DEL SISTEMA",
                    {
                        align: "center"
                    }
                );

            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "Empresas Públicas de Calarcá - EMCA E.S.P.",
                    {
                        align: "center"
                    }
                );

            doc.moveDown(1.5);

            if (rows.length === 0) {

                doc
                    .fontSize(10)
                    .font("Helvetica-Oblique")
                    .text(
                        "No hay registros disponibles.",
                        {
                            align: "center"
                        }
                    );

            } else {

                rows.forEach((item) => {

                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    const fechaInicioLimpia =
                        item.fechaInicio
                            ? String(item.fechaInicio).split("T")[0]
                            : "N/A";

                    const fechaFinLimpia =
                        item.fechaFin
                            ? String(item.fechaFin).split("T")[0]
                            : "N/A";

                    const nombreBitacora =
                        item.nombre ||
                        item.titulo ||
                        "Sin Nombre";

                    const descripcion =
                        item.descripcion ||
                        item.texto ||
                        item.respuesta ||
                        "";

                    doc
                        .fontSize(10)
                        .font("Helvetica-Bold")
                        .fillColor("#003366")
                        .text(
                            `Registro #${item.id} - ${nombreBitacora}`
                        );

                    doc
                        .fillColor("#000000")
                        .font("Helvetica")
                        .fontSize(9);

                    doc.text(
                        `Empleado: ${item.empleado_nombre || "N/A"}`
                    );

                    doc.text(
                        `Tipo: ${item.tipo || "General"}`
                    );

                    doc.text(
                        `Estado: ${item.estado || "Pendiente"}`
                    );

                    doc.text(
                        `Periodo: ${fechaInicioLimpia} al ${fechaFinLimpia}`
                    );

                    if (descripcion) {
                        doc.text(
                            `Descripción / Respuesta: ${descripcion}`
                        );
                    }

                    doc.moveDown(0.5);

                    doc
                        .moveTo(40, doc.y)
                        .lineTo(555, doc.y)
                        .stroke("#E0E0E0");

                    doc.moveDown(0.5);
                });
            }

            const range = doc.bufferedPageRange();

            for (
                let i = range.start;
                i < range.start + range.count;
                i++
            ) {

                doc.switchToPage(i);
                doc.save();

                // ==========================================
                // ENCABEZADO F-GA-028
                // ==========================================

                doc
                    .lineWidth(1)
                    .rect(40, 30, 515, 60)
                    .stroke("#000000");

                doc
                    .moveTo(180, 30)
                    .lineTo(180, 90)
                    .stroke("#000000");

                doc
                    .moveTo(380, 30)
                    .lineTo(380, 90)
                    .stroke("#000000");

                doc
                    .moveTo(380, 50)
                    .lineTo(555, 50)
                    .stroke("#000000");

                doc
                    .moveTo(380, 70)
                    .lineTo(555, 70)
                    .stroke("#000000");

                doc
                    .fontSize(14)
                    .font("Helvetica-Bold")
                    .fillColor("#000000")
                    .text(
                        "EMCA E.S.P.",
                        50,
                        50,
                        {
                            width: 120,
                            align: "center"
                        }
                    );

                doc
                    .fontSize(11)
                    .font("Helvetica-Bold")
                    .text(
                        "REPORTES BITACORAS",
                        185,
                        45,
                        {
                            width: 190,
                            align: "center"
                        }
                    );

                doc
                    .fontSize(8)
                    .font("Helvetica-Bold")
                    .text(
                        "Versión:",
                        385,
                        36
                    );

                doc
                    .font("Helvetica")
                    .text(
                        "2",
                        480,
                        36
                    );

                doc
                    .font("Helvetica-Bold")
                    .text(
                        "Código:",
                        385,
                        56
                    );

                doc
                    .font("Helvetica")
                    .text(
                        "F-GA-028",
                        480,
                        56
                    );

                doc
                    .font("Helvetica-Bold")
                    .text(
                        "Vigente desde:",
                        385,
                        76
                    );

                doc
                    .font("Helvetica")
                    .text(
                        "2023-12-14",
                        480,
                        76
                    );

                doc
                    .font("Helvetica")
                    .fontSize(8)
                    .text(
                        `Hoja ${i + 1} de ${range.count}`,
                        420,
                        98,
                        {
                            align: "right"
                        }
                    );

                doc
                    .moveTo(40, 112)
                    .lineTo(555, 112)
                    .stroke("#CCCCCC");

                // ==========================================
                // PIE DE PÁGINA
                // ==========================================

                const footerY = 740;

                doc
                    .moveTo(40, footerY - 8)
                    .lineTo(555, footerY - 8)
                    .stroke("#CCCCCC");

                doc
                    .fontSize(8)
                    .font("Helvetica")
                    .fillColor("#555555")
                    .text(
                        `EMPRESAS PÚBLICAS DE CALARCÁ E.S.P NIT 890 000 377 - 0
Carrera 24 No. 39-54 Teléfonos:(57) 3156127130
Sitios WEB: www.emca-calarca-quindio-gov.co
E-mail: contactenos@emca-calarca-quindio.gov.co`,
                        40,
                        footerY,
                        {
                            width: 515,
                            align: "center"
                        }
                    );

                doc.restore();
            }

            doc.end();

        } catch (error: any) {

            console.error(
                "❌ Error al generar PDF:",
                error
            );

            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    mensaje: "Error al generar el archivo PDF",
                    error: error.message
                });
            }
        }
    }


    /**
     * Genera el reporte de bitácoras en Excel.
     */
    static async descargarExcel(
        req: Request,
        res: Response
    ): Promise<void> {
        try {

            const [rows] =
                await db.execute<BitacoraRow[]>(
                    `
                        SELECT *
                        FROM bitacora
                        ORDER BY id DESC
                    `
                );

            const workbook =
                new ExcelJS.Workbook();

            const worksheet =
                workbook.addWorksheet(
                    "Reporte de Bitácoras"
                );

            worksheet.columns = [
                {
                    header: "ID",
                    key: "id",
                    width: 10
                },
                {
                    header: "Título / Nombre",
                    key: "titulo",
                    width: 30
                },
                {
                    header: "Empleado",
                    key: "empleado_nombre",
                    width: 25
                },
                {
                    header: "Tipo",
                    key: "tipo",
                    width: 18
                },
                {
                    header: "Fecha Inicio",
                    key: "fechaInicio",
                    width: 15
                },
                {
                    header: "Fecha Fin",
                    key: "fechaFin",
                    width: 15
                },
                {
                    header: "Estado",
                    key: "estado",
                    width: 15
                },
                {
                    header: "Descripción",
                    key: "descripcion",
                    width: 45
                }
            ];

            rows.forEach((row) => {

                const fechaInicio =
                    row.fechaInicio
                        ? String(row.fechaInicio).split("T")[0]
                        : "N/A";

                const fechaFin =
                    row.fechaFin
                        ? String(row.fechaFin).split("T")[0]
                        : "N/A";

                worksheet.addRow({
                    id: row.id,

                    titulo:
                        row.nombre ||
                        row.titulo ||
                        "N/A",

                    empleado_nombre:
                        row.empleado_nombre ||
                        "N/A",

                    tipo:
                        row.tipo ||
                        "General",

                    fechaInicio,

                    fechaFin,

                    estado:
                        row.estado ||
                        "Pendiente",

                    descripcion:
                        row.descripcion ||
                        row.texto ||
                        row.respuesta ||
                        "N/A"
                });
            });

            // ==========================================
            // ESTILO DEL ENCABEZADO
            // ==========================================

            const headerRow =
                worksheet.getRow(1);

            headerRow.height = 24;

            headerRow.eachCell((cell) => {

                cell.font = {
                    bold: true,
                    color: {
                        argb: "FFFFFF"
                    }
                };

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "003366"
                    }
                };

                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle"
                };
            });

            // ==========================================
            // ESTILO DE LAS FILAS
            // ==========================================

            worksheet.eachRow(
                (row, rowNumber) => {

                    if (rowNumber === 1) {
                        return;
                    }

                    row.height = 20;

                    row.eachCell(
                        (cell, columnNumber) => {

                            cell.alignment = {
                                vertical: "middle",
                                horizontal:
                                    [1, 4, 5, 6, 7]
                                        .includes(columnNumber)
                                        ? "center"
                                        : "left",
                                wrapText: true
                            };
                        }
                    );
                }
            );

            worksheet.views = [
                {
                    state: "frozen",
                    ySplit: 1
                }
            ];

            // ==========================================
            // RESPUESTA HTTP
            // ==========================================

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

            res.setHeader(
                "Content-Disposition",
                "attachment; filename=Reporte_Bitacoras_EMCA.xlsx"
            );

            await workbook.xlsx.write(res);

            res.end();

        } catch (error: any) {

            console.error(
                "❌ Error al generar Excel:",
                error
            );

            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    mensaje:
                        "Error al generar la hoja de Excel",
                    error: error.message
                });
            }
        }
    }
}