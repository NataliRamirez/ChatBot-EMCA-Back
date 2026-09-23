import { type Response, type Request } from 'express'
import { db } from '../config/db.js'
import { crearMediaDTO, type MediaDTOInput } from '../dtos/dtos.js'

export class multimediaController {
  
  // 1. Guardar archivo formateado
  static async createMultimedia(req: Request, res: Response) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`
      
      // Nombre del archivo generado por Multer o enviado en el body
      const nombreArchivo = req.file ? req.file.filename : req.body.archivo

      if (!nombreArchivo) {
        return res.status(400).json({ mensaje: 'No se recibió ningún archivo o URL' })
      }

      const telefono = req.body.telefono || ''
      
      // Mapeo dinámico del tipo de media según MIME o body
      let tipoMedia = req.body.tipoMensaje || 'DOCUMENT'
      if (req.file?.mimetype) {
        if (req.file.mimetype.startsWith('image/')) tipoMedia = 'IMAGEN'
        else if (req.file.mimetype.startsWith('audio/')) tipoMedia = 'AUDIO'
        else if (req.file.mimetype.startsWith('video/')) tipoMedia = 'VIDEO'
        else tipoMedia = 'DOCUMENTO'
      }

      const emisor = req.body.emisor || 'ASESOR'
      // Formato compatible con el DTO (ej: ASESOR_IMAGEN, USUARIO_IMAGEN)
      const tipoMensajeFinal = `${emisor}_${tipoMedia}` as MediaDTOInput['tipoMensaje']

      const urlCompleta = nombreArchivo.startsWith('http') 
        ? nombreArchivo 
        : `${baseUrl}/uploads/${nombreArchivo}`

      // A) Inserción en la tabla MENSAJES (chat en vivo)
      const queryMensaje = `
        INSERT INTO mensajes 
        (telefono_usuario, mensaje, emisor, url_media, tipo_mensaje) 
        VALUES (?, ?, ?, ?, ?)
      `
      await db.execute(queryMensaje, [
        telefono,
        req.body.nombre || req.file?.originalname || 'Archivo adjunto',
        emisor,
        urlCompleta,
        tipoMensajeFinal
      ])

      // B) Inserción en REPORTES_DOCUMENTOS mediante DTO
      const mediaInput: MediaDTOInput = {
        telefono,
        nombreArchivo,
        tipoMensaje: tipoMensajeFinal,
        leyendaTexto: req.body.nombre || req.file?.originalname || 'Archivo adjunto',
        estado: req.body.estado || 'PENDIENTE',
        respuesta: req.body.respuesta || '',
        baseUrl
      }

      const mediaDTO = crearMediaDTO(mediaInput)

      const queryReporte = `
        INSERT INTO reportes_documentos 
        (telefono_usuario, nombre, archivo, tipo_mensaje, estado, respuesta, fecha_creacion) 
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

      return res.status(201).json({
        success: true,
        mensaje: 'Contenido multimedia registrado correctamente',
        url_media: urlCompleta,
        tipo_mensaje: tipoMensajeFinal,
        datos: mediaDTO
      })
    } catch (error: any) {
      console.error('❌ Error en createMultimedia:', error)
      return res.status(500).json({ mensaje: 'Error al cargar contenido multimedia', error: error.message })
    }
  }

  // 2. Obtener reportes formateados
  static async BringMultimedia(req: Request, res: Response) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`
      const query = 'SELECT * FROM reportes_documentos ORDER BY id DESC'
      const [rows]: any = await db.execute(query)

      const datosFormateados = rows.map((row: any) => 
        crearMediaDTO({
          telefono: row.telefono_usuario,
          nombreArchivo: row.archivo,
          tipoMensaje: row.tipo_mensaje as MediaDTOInput['tipoMensaje'],
          leyendaTexto: row.nombre,
          estado: row.estado,
          respuesta: row.respuesta,
          baseUrl
        })
      )

      return res.status(200).json({
        mensaje: 'Datos obtenidos con éxito',
        datos: datosFormateados
      })
    } catch (error) {
      console.error('❌ Error en BringMultimedia:', error)
      return res.status(500).json({ mensaje: 'No se encontró información multimedia' })
    }
  }

  // 3. Actualizar estado / respuesta
  static async updateMultimedia(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { estado, respuesta } = req.body

      const query = 'UPDATE reportes_documentos SET estado = ?, respuesta = ? WHERE id = ?'
      await db.execute(query, [estado, respuesta, id])

      return res.status(200).json({ mensaje: 'Contenido multimedia actualizado' })
    } catch (error) {
      console.error('❌ Error en updateMultimedia:', error)
      return res.status(500).json({ mensaje: 'Error al actualizar contenido multimedia' })
    }
  }

  // 4. Eliminar registro
  static async deleteMultimedia(req: Request, res: Response) {
    try {
      const { id } = req.params
      const query = 'DELETE FROM reportes_documentos WHERE id = ?'
      await db.execute(query, [id])

      return res.status(200).json({ mensaje: 'Contenido multimedia eliminado' })
    } catch (error) {
      console.error('❌ Error en deleteMultimedia:', error)
      return res.status(500).json({ mensaje: 'Error al eliminar contenido multimedia' })
    }
  }
}