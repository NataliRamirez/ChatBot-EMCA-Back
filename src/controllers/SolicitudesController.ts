import { Request, Response } from "express";
import { db } from "../config/db.js";

import { RowDataPacket, ResultSetHeader } from "mysql2";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

interface SolicitudRow extends RowDataPacket {
    id: number;
    titulo?: string;
    nombre?: string;
    radicado?: string;
    tipo?: string;
    usuario?: string;
    asunto?: string;
    fechaInicio?: string;
    fechaFinal?: string;
    cargo?: string;
    estado?: string;
    observacion?: string;
}

// ======================================================
// FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS
// ======================================================

const formatearFechaServidor = (fecha: any): string => {
    if (!fecha || fecha === "N/A") {
        return "N/A";
    }

    const str = String(fecha);

    if (str.includes("T")) {
        return str.split("T")[0];
    }

    return str.length >= 10 ? str.substring(0, 10) : str;
};


// ======================================================
// CONTROLADOR DE SOLICITUDES
// ======================================================

export class SolicitudesController {

    // ==================================================
    // CREAR SOLICITUD
    // ==================================================

    static async CreateSolicitudes(req: Request, res: Response) {

        try {

            const {
                titulo,
                nombre,
                radicado,
                tipo,
                usuario,
                asunto,
                fechaInicio,
                fechaFinal,
                cargo,
                estado,
                observacion
            } = req.body;

            if (
                !titulo ||
                !nombre ||
                !radicado ||
                !tipo ||
                !asunto ||
                !cargo ||
                !estado ||
                !observacion
            ) {
                return res.status(400).json({
                    mensaje: "Todos los campos obligatorios deben ser diligenciados."
                });
            }

            const query = `
                INSERT INTO solicitudes
                (
                    titulo,
                    nombre,
                    radicado,
                    tipo,
                    usuario,
                    asunto,
                    fechaInicio,
                    fechaFinal,
                    cargo,
                    estado,
                    observacion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                titulo,
                nombre,
                radicado,
                tipo,
                usuario ?? null,
                asunto,
                fechaInicio || null,
                fechaFinal || null,
                cargo,
                estado,
                observacion
            ]);

            return res.status(201).json({
                mensaje: "Solicitud creada correctamente"
            });

        } catch (error) {

            console.error("Error al crear solicitud:", error);

            return res.status(500).json({
                mensaje: "Error al crear la solicitud"
            });
        }
    }


    // ==================================================
    // OBTENER TODAS LAS SOLICITUDES
    // ==================================================

    static async BringSolicitudes(req: Request, res: Response) {

        try {

            const [rows] = await db.execute<SolicitudRow[]>(
                "SELECT * FROM solicitudes ORDER BY id DESC"
            );

            return res.status(200).json(rows);

        } catch (error) {

            console.error("Error al obtener las solicitudes:", error);

            return res.status(500).json({
                mensaje: "Error al obtener las solicitudes"
            });
        }
    }


    // ==================================================
    // OBTENER UNA SOLICITUD POR ID
    // ==================================================

    static async BringSolicitud(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const [rows] = await db.execute<SolicitudRow[]>(
                "SELECT * FROM solicitudes WHERE id = ?",
                [id]
            );

            if (rows.length === 0) {

                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json(rows[0]);

        } catch (error) {

            console.error("Error al obtener la solicitud:", error);

            return res.status(500).json({
                mensaje: "Error al obtener la solicitud"
            });
        }
    }


    // ==================================================
    // ACTUALIZAR SOLICITUD
    // ==================================================

    static async UpdateSolicitudes(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const {
                titulo,
                nombre,
                radicado,
                tipo,
                usuario,
                asunto,
                fechaInicio,
                fechaFinal,
                cargo,
                estado,
                observacion
            } = req.body;

            const query = `
                UPDATE solicitudes
                SET
                    titulo = ?,
                    nombre = ?,
                    radicado = ?,
                    tipo = ?,
                    usuario = ?,
                    asunto = ?,
                    fechaInicio = ?,
                    fechaFinal = ?,
                    cargo = ?,
                    estado = ?,
                    observacion = ?
                WHERE id = ?
            `;

            const [result] = await db.execute<ResultSetHeader>(
                query,
                [
                    titulo,
                    nombre,
                    radicado,
                    tipo,
                    usuario ?? null,
                    asunto,
                    fechaInicio || null,
                    fechaFinal || null,
                    cargo,
                    estado,
                    observacion,
                    id
                ]
            );

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json({
                mensaje: "Solicitud actualizada correctamente"
            });

        } catch (error) {

            console.error("Error al actualizar la solicitud:", error);

            return res.status(500).json({
                mensaje: "Error al actualizar la solicitud"
            });
        }
    }


    // ==================================================
    // ELIMINAR SOLICITUD
    // ==================================================

    static async DeleteSolicitudes(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const [result] = await db.execute<ResultSetHeader>(
                "DELETE FROM solicitudes WHERE id = ?",
                [id]
            );

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json({
                mensaje: "Solicitud eliminada correctamente"
            });

        } catch (error) {

            console.error("Error al eliminar la solicitud:", error);

            return res.status(500).json({
                mensaje: "Error al eliminar la solicitud"
            });
        }
    }


    // ==================================================
    // ASIGNAR SOLICITUD
    // ==================================================

    static async CreateAsignarSolicitud(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const {
                nombre,
                estado,
                observacion
            } = req.body;

            if (!nombre || !estado || !observacion) {

                return res.status(400).json({
                    mensaje: "Todos los campos son obligatorios."
                });
            }

            const query = `
                UPDATE solicitudes
                SET
                    nombre = ?,
                    estado = ?,
                    observacion = ?
                WHERE id = ?
            `;

            const [result] = await db.execute<ResultSetHeader>(
                query,
                [
                    nombre,
                    estado,
                    observacion,
                    id
                ]
            );

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    mensaje: "Solicitud no encontrada"
                });
            }

            return res.status(200).json({
                mensaje: "Solicitud asignada correctamente"
            });

        } catch (error) {

            console.error("Error al asignar la solicitud:", error);

            return res.status(500).json({
                mensaje: "Error al asignar la solicitud"
            });
        }
    }


    // ==================================================
    // GENERAR PDF
    // ==================================================

    static async generarPDF(req: Request, res: Response) {

        try {

            const [rows] = await db.execute<SolicitudRow[]>(
                "SELECT * FROM solicitudes ORDER BY id DESC"
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
                "attachment; filename=Reporte_Solicitudes_EMCA.pdf"
            );

            doc.pipe(res);

            doc.fillColor("#000000");

            doc
                .fontSize(12)
                .font("Helvetica-Bold")
                .text(
                    "REPORTE DE SOLICITUDES DEL SISTEMA",
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
                        formatearFechaServidor(item.fechaInicio);

                    const fechaFinLimpia =
                        formatearFechaServidor(item.fechaFinal);

                    doc
                        .fontSize(10)
                        .font("Helvetica-Bold")
                        .fillColor("#003366")
                        .text(
                            `Radicado #${item.radicado || item.id} - ${item.titulo || "Sin Título"}`
                        );

                    doc
                        .fillColor("#000000")
                        .font("Helvetica")
                        .fontSize(9);

                    doc.text(
                        `Solicitante / Nombre: ${item.nombre || "N/A"}`
                    );

                    doc.text(
                        `Tipo: ${item.tipo || "N/A"} | Cargo: ${item.cargo || "N/A"}`
                    );

                    doc.text(
                        `Usuario Registra / Asignado: ${item.usuario || "N/A"}`
                    );

                    doc.text(
                        `Estado: ${item.estado || "Pendiente"}`
                    );

                    doc.text(
                        `Asunto: ${item.asunto || "N/A"}`
                    );

                    doc.text(
                        `Vigencia: ${fechaInicioLimpia} al ${fechaFinLimpia}`
                    );

                    if (item.observacion) {

                        doc.text(
                            `Observaciones: ${item.observacion}`
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

            // ==========================================
            // ENCABEZADO Y PIE DE CADA PÁGINA
            // ==========================================

            const range = doc.bufferedPageRange();

            for (
                let i = range.start;
                i < range.start + range.count;
                i++
            ) {

                doc.switchToPage(i);

                doc.save();

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
                        "REPORTE SOLICITUDES",
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

                doc.text(
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

        } catch (error) {

            console.error(
                "Error al generar PDF:",
                error
            );

            if (!res.headersSent) {

                res.status(500).json({
                    mensaje: "Error al generar el archivo PDF"
                });
            }
        }
    }


    // ==================================================
    // DESCARGAR EXCEL
    // ==================================================

    static async descargarExcel(req: Request, res: Response) {

        try {

            const [rows] = await db.execute<SolicitudRow[]>(
                "SELECT * FROM solicitudes ORDER BY id DESC"
            );

            const workbook = new ExcelJS.Workbook();

            const worksheet =
                workbook.addWorksheet(
                    "Reporte de Solicitudes"
                );


            // ==========================================
            // TÍTULO
            // ==========================================

            worksheet.mergeCells("A1:L1");

            const titleCell =
                worksheet.getCell("A1");

            titleCell.value =
                "EMCA E.S.P. - REPORTE DE SOLICITUDES DEL SISTEMA";

            titleCell.font = {
                name: "Arial",
                size: 14,
                bold: true,
                color: {
                    argb: "FFFFFF"
                }
            };

            titleCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "003366"
                }
            };

            titleCell.alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            worksheet.getRow(1).height = 30;


            // ==========================================
            // SUBTÍTULO
            // ==========================================

            worksheet.mergeCells("A2:L2");

            const subCell =
                worksheet.getCell("A2");

            subCell.value =
                `Código: F-GA-028 | Versión: 2 | Generado: ${new Date().toLocaleDateString("es-CO")}`;

            subCell.font = {
                name: "Arial",
                size: 9,
                italic: true,
                color: {
                    argb: "555555"
                }
            };

            subCell.alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            worksheet.getRow(2).height = 20;


            // ==========================================
            // COLUMNAS
            // ==========================================

            worksheet.columns = [

                {
                    header: "ID",
                    key: "id",
                    width: 8
                },

                {
                    header: "Radicado",
                    key: "radicado",
                    width: 15
                },

                {
                    header: "Título",
                    key: "titulo",
                    width: 25
                },

                {
                    header: "Nombre",
                    key: "nombre",
                    width: 25
                },

                {
                    header: "Tipo",
                    key: "tipo",
                    width: 15
                },

                {
                    header: "Usuario",
                    key: "usuario",
                    width: 20
                },

                {
                    header: "Cargo",
                    key: "cargo",
                    width: 20
                },

                {
                    header: "Asunto",
                    key: "asunto",
                    width: 30
                },

                {
                    header: "Fecha Inicio",
                    key: "fechaInicio",
                    width: 15
                },

                {
                    header: "Fecha Final",
                    key: "fechaFinal",
                    width: 15
                },

                {
                    header: "Estado",
                    key: "estado",
                    width: 15
                },

                {
                    header: "Observación",
                    key: "observacion",
                    width: 35
                }
            ];


            // ==========================================
            // ESTILO ENCABEZADOS
            // ==========================================

            const headerRow =
                worksheet.getRow(3);

            headerRow.height = 24;

            headerRow.eachCell((cell) => {

                cell.font = {
                    name: "Arial",
                    size: 10,
                    bold: true,
                    color: {
                        argb: "FFFFFF"
                    }
                };

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "004A99"
                    }
                };

                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle"
                };

                cell.border = {

                    top: {
                        style: "thin",
                        color: {
                            argb: "CCCCCC"
                        }
                    },

                    bottom: {
                        style: "medium",
                        color: {
                            argb: "002244"
                        }
                    },

                    left: {
                        style: "thin",
                        color: {
                            argb: "CCCCCC"
                        }
                    },

                    right: {
                        style: "thin",
                        color: {
                            argb: "CCCCCC"
                        }
                    }
                };
            });


            // ==========================================
            // DATOS
            // ==========================================

            rows.forEach((row) => {

                const addedRow =
                    worksheet.addRow({

                        id: row.id,

                        radicado:
                            row.radicado || "N/A",

                        titulo:
                            row.titulo || "N/A",

                        nombre:
                            row.nombre || "N/A",

                        tipo:
                            row.tipo || "N/A",

                        usuario:
                            row.usuario || "N/A",

                        cargo:
                            row.cargo || "N/A",

                        asunto:
                            row.asunto || "N/A",

                        fechaInicio:
                            formatearFechaServidor(
                                row.fechaInicio
                            ),

                        fechaFinal:
                            formatearFechaServidor(
                                row.fechaFinal
                            ),

                        estado:
                            row.estado || "Pendiente",

                        observacion:
                            row.observacion || "N/A"
                    });


                addedRow.eachCell((cell) => {

                    cell.font = {
                        name: "Arial",
                        size: 9
                    };

                    cell.alignment = {
                        vertical: "middle"
                    };

                    cell.border = {

                        top: {
                            style: "thin",
                            color: {
                                argb: "E0E0E0"
                            }
                        },

                        bottom: {
                            style: "thin",
                            color: {
                                argb: "E0E0E0"
                            }
                        },

                        left: {
                            style: "thin",
                            color: {
                                argb: "E0E0E0"
                            }
                        },

                        right: {
                            style: "thin",
                            color: {
                                argb: "E0E0E0"
                            }
                        }
                    };
                });
            });


            // ==========================================
            // DESCARGA DEL ARCHIVO
            // ==========================================

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

            res.setHeader(
                "Content-Disposition",
                "attachment; filename=Reporte_Solicitudes_EMCA.xlsx"
            );

            await workbook.xlsx.write(res);

            res.end();

        } catch (error) {

            console.error(
                "Error al generar Excel:",
                error
            );

            if (!res.headersSent) {

                res.status(500).json({
                    mensaje: "Error al generar la hoja de Excel"
                });
            }
        }
    }
}
