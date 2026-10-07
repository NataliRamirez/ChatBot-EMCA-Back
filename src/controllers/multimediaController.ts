import { type Response, type Request } from 'express'
import { db } from '../config/db.js'
import { crearMediaDTO, type MediaDTOInput } from '../dtos/dtos.js'

export class multimediaController {

  // =========================================================
  // 1. CREAR / GUARDAR MULTIMEDIA
  // =========================================================
  static async createMultimedia(req: Request, res: Response) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`

      // -----------------------------------------------------
      // ARCHIVO RECIBIDO POR MULTER
      // -----------------------------------------------------
      const nombreArchivo = req.file
        ? req.file.filename
        : req.body.archivo

      if (!nombreArchivo) {
        return res.status(400).json({
          success: false,
          mensaje: 'No se recibió ningún archivo o URL'
        })
      }

      // -----------------------------------------------------
      // DATOS DEL MENSAJE
      // -----------------------------------------------------
      const telefono = String(req.body.telefono || '').trim()

      if (!telefono) {
        return res.status(400).json({
          success: false,
          mensaje: 'No se recibió el número de teléfono'
        })
      }

      // -----------------------------------------------------
      // DETERMINAR TIPO DE MULTIMEDIA
      // -----------------------------------------------------
      let tipoMedia = req.body.tipoMensaje || 'DOCUMENT'

      if (req.file?.mimetype) {
        if (req.file.mimetype.startsWith('image/')) {
          tipoMedia = 'IMAGEN'
        } else if (req.file.mimetype.startsWith('audio/')) {
          tipoMedia = 'AUDIO'
        } else if (req.file.mimetype.startsWith('video/')) {
          tipoMedia = 'VIDEO'
        } else {
          tipoMedia = 'DOCUMENTO'
        }
      }

      // -----------------------------------------------------
      // EMISOR
      // -----------------------------------------------------
      let emisor = req.body.emisor || 'ADMIN'

      // La tabla mensajes solo permite:
      // BOT | USUARIO | ADMIN
      if (!['BOT', 'USUARIO', 'ADMIN'].includes(emisor)) {
        emisor = 'ADMIN'
      }

      // -----------------------------------------------------
      // TIPO DE MENSAJE
      // Ejemplo:
      // ADMIN_IMAGEN
      // ADMIN_VIDEO
      // ADMIN_AUDIO
      // ADMIN_DOCUMENTO
      // -----------------------------------------------------
      const tipoMensajeFinal =
        `${emisor}_${tipoMedia}` as MediaDTOInput['tipoMensaje']

      // -----------------------------------------------------
      // URL FINAL DEL ARCHIVO
      // -----------------------------------------------------
      const urlCompleta = String(nombreArchivo).startsWith('http')
        ? String(nombreArchivo)
        : `${baseUrl}/uploads/${nombreArchivo}`

      // -----------------------------------------------------
      // NOMBRE PARA MOSTRAR
      // -----------------------------------------------------
      const nombreMostrar =
        req.body.nombre ||
        req.file?.originalname ||
        'Archivo adjunto'

      // =====================================================
      // A. GUARDAR EN TABLA MENSAJES
      // =====================================================
      const queryMensaje = `
        INSERT INTO mensajes
        (
          telefono_usuario,
          mensaje,
          emisor,
          url_media,
          tipo_mensaje
        )
        VALUES (?, ?, ?, ?, ?)
      `

      await db.execute(queryMensaje, [
        telefono,
        nombreMostrar,
        emisor,
        urlCompleta,
        tipoMensajeFinal
      ])

      // =====================================================
      // B. CREAR DTO
      // =====================================================
      const mediaInput: MediaDTOInput = {
        telefono,
        nombreArchivo: String(nombreArchivo),
        tipoMensaje: tipoMensajeFinal,
        leyendaTexto: nombreMostrar,
        estado: req.body.estado || 'PENDIENTE',
        respuesta: req.body.respuesta || '',
        baseUrl
      }

      const mediaDTO = crearMediaDTO(mediaInput)

      // =====================================================
      // C. GUARDAR EN REPORTES_DOCUMENTOS
      // =====================================================
      try {
        const queryReporte = `
          INSERT INTO reportes_documentos
          (
            telefono_usuario,
            nombre,
            archivo,
            tipo_mensaje,
            estado,
            respuesta,
            fecha_creacion
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `

        await db.execute(queryReporte, [
          mediaDTO.telefono_usuario,
          mediaDTO.nombre,
          mediaDTO.url_media,
          mediaDTO.tipo_mensaje,
          mediaDTO.estado,
          mediaDTO.respuesta,
          mediaDTO.fecha_creacion
        ])

      } catch (reporteError: any) {
        console.error(
          '⚠️ Error guardando en reportes_documentos:',
          reporteError
        )

        // El archivo ya quedó registrado en mensajes.
        // No se pierde el registro del chat.

        return res.status(201).json({
          success: true,
          advertencia: true,
          mensaje:
            'El archivo se guardó correctamente en mensajes, pero no pudo registrarse en reportes_documentos',

          errorReporte: reporteError.message,

          archivoUrl: urlCompleta,
          url: urlCompleta,
          url_media: urlCompleta,

          tipo_mensaje: tipoMensajeFinal,

          datos: mediaDTO
        })
      }

      // =====================================================
      // RESPUESTA FINAL
      // =====================================================
      return res.status(201).json({
        success: true,

        mensaje:
          'Contenido multimedia registrado correctamente',

        // Compatible con Panelusuario.jsx
        archivoUrl: urlCompleta,

        // Compatibilidad adicional
        url: urlCompleta,
        url_media: urlCompleta,

        tipo_mensaje: tipoMensajeFinal,

        datos: mediaDTO
      })

    } catch (error: any) {
      console.error(
        '❌ Error en createMultimedia:',
        error
      )

      return res.status(500).json({
        success: false,
        mensaje: 'Error al cargar contenido multimedia',
        error: error.message
      })
    }
  }


  // =========================================================
  // 2. OBTENER MULTIMEDIA
  // =========================================================
  static async BringMultimedia(
    req: Request,
    res: Response
  ) {
    try {
      const baseUrl =
        `${req.protocol}://${req.get('host')}`

      const query = `
        SELECT *
        FROM reportes_documentos
        ORDER BY id DESC
      `

      const [rows]: any = await db.execute(query)

      const datosFormateados = rows.map(
        (row: any) => {
          return crearMediaDTO({
            telefono:
              row.telefono_usuario ||
              row.telefono ||
              '',

            nombreArchivo:
              row.archivo ||
              row.url_media ||
              '',

            tipoMensaje:
              row.tipo_mensaje as MediaDTOInput['tipoMensaje'],

            leyendaTexto:
              row.nombre ||
              'Archivo adjunto',

            estado:
              row.estado ||
              'PENDIENTE',

            respuesta:
              row.respuesta ||
              '',

            baseUrl
          })
        }
      )

      return res.status(200).json({
        success: true,
        mensaje: 'Datos obtenidos con éxito',
        datos: datosFormateados
      })

    } catch (error: any) {
      console.error(
        '❌ Error en BringMultimedia:',
        error
      )

      return res.status(500).json({
        success: false,
        mensaje:
          'No se encontró información multimedia',
        error: error.message
      })
    }
  }


  // =========================================================
  // 3. ACTUALIZAR ESTADO / RESPUESTA
  // =========================================================
  static async updateMultimedia(
    req: Request,
    res: Response
  ) {
    try {
      const { id } = req.params

      const {
        estado,
        respuesta
      } = req.body

      if (!id) {
        return res.status(400).json({
          success: false,
          mensaje:
            'No se recibió el ID del registro'
        })
      }

      const query = `
        UPDATE reportes_documentos
        SET
          estado = ?,
          respuesta = ?
        WHERE id = ?
      `

      const [result]: any = await db.execute(
        query,
        [
          estado,
          respuesta,
          id
        ]
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          mensaje:
            'Registro multimedia no encontrado'
        })
      }

      return res.status(200).json({
        success: true,
        mensaje:
          'Contenido multimedia actualizado'
      })

    } catch (error: any) {
      console.error(
        '❌ Error en updateMultimedia:',
        error
      )

      return res.status(500).json({
        success: false,
        mensaje:
          'Error al actualizar contenido multimedia',
        error: error.message
      })
    }
  }


  // =========================================================
  // 4. ELIMINAR REGISTRO
  // =========================================================
  static async deleteMultimedia(
    req: Request,
    res: Response
  ) {
    try {
      const { id } = req.params

      if (!id) {
        return res.status(400).json({
          success: false,
          mensaje:
            'No se recibió el ID del registro'
        })
      }

      const query = `
        DELETE FROM reportes_documentos
        WHERE id = ?
      `

      const [result]: any = await db.execute(
        query,
        [id]
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          mensaje:
            'Registro multimedia no encontrado'
        })
      }

      return res.status(200).json({
        success: true,
        mensaje:
          'Contenido multimedia eliminado'
      })

    } catch (error: any) {
      console.error(
        '❌ Error en deleteMultimedia:',
        error
      )

      return res.status(500).json({
        success: false,
        mensaje:
          'Error al eliminar contenido multimedia',
        error: error.message
      })
    }
  }
}