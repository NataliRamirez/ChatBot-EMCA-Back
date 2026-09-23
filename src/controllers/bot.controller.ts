import { db } from '../config/db.js'
import { type Request, type Response } from 'express'
import { guardarMensaje as guardarMensajeDB, checkUserInDB, registrarUsuario } from '../services/databaseService.js'
import { type RowDataPacket } from 'mysql2'
import { MultimediaDTO, type MultimediaRow } from '../dtos/dtos.js'

/**
 * @file BotController.ts
 * @author Juan David Nieto
 * @description Controlador encargado de la gestión de las operaciones relacionadas con el chatbot, 
 * incluyendo la recepción de mensajes, gestión de usuarios, almacenamiento de conversaciones, consulta
 * de historial y comunicación con asesores humanos.
 */

interface UsuarioRow extends RowDataPacket {
  nombres: string
  telefono: string
  bot_activo: number | boolean
  cedula: string
  email: string | null
}

const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Database/Service timeout after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout])
}

/**
 * Controlador encargado de la gestión de las funcionalidades del chatbot.
 *
 * Funcionalidades:
 * - Recepción de mensajes desde Meta WhatsApp.
 * - Registro y consulta de usuarios.
 * - Almacenamiento de mensajes y conversaciones.
 * - Consulta de historial de chat.
 * - Solicitud de atención por asesor humano.
 * - Activación y desactivación del bot.
 * - Gestión de acciones internas del chatbot.
 */
export class BotController {

  /**
 * Procesa los eventos recibidos desde el webhook de Meta WhatsApp.
 *
 * Recibe los mensajes enviados por los usuarios, extrae la información
 * relevante y registra los mensajes en la base de datos.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP enviada por Meta.
 * @param {Response} res Respuesta HTTP enviada al proveedor.
 * @returns {Promise<Response>} Confirmación de recepción del evento.
 * @throws {Error} Cuando ocurre un error durante el procesamiento del webhook.
 */
  static async metaWebhook(req: Request, res: Response) {
    try {
      const body = req.body
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

      if (message?.text?.body) {
        const telefono = String(message.from).replace(/\D/g, '')
        const texto = String(message.text.body).trim()

        console.log(`📩 META [${telefono}]: ${texto}`)

        // Guarda el mensaje entrante en segundo plano sin bloquear la respuesta HTTP
        void guardarMensajeDB(telefono, texto, 'USUARIO').catch((err) =>
          console.error('❌ Error en guardarMensaje background:', err)
        )
      }

      return res.status(200).send('EVENT_RECEIVED')
    } catch (error: any) {
      console.error('❌ Error metaWebhook:', error)
      return res.status(500).json({ error: true, message: error.message })
    }
  }

  /**
 * Gestiona las acciones ejecutadas por el chatbot.
 *
 * Permite procesar diferentes tipos de acciones como almacenamiento de mensajes y registro de usuarios.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con la acción solicitada.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Resultado de la acción ejecutada.
 * @throws {Error} Cuando ocurre un error durante el procesamiento.
 */
  static async handleBotAction(req: Request, res: Response) {
    console.log('🚀 handleBotAction ejecutándose')

    try {
      const apiKey = String(req.headers['x-api-key'] || '')

      if (apiKey !== (process.env.API_KEY || 'EmcaSecret2026')) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const {
        tipo = '',
        telefono = '',
        mensaje = '',
        emisor = 'BOT',
        botones = [],
        nombre = '',
        cedula = '',
        email = ''
      } = req.body

      if (!tipo || !telefono) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' })
      }

      const telLimpio = String(telefono).replace(/\D/g, '')

      // GUARDAR MENSAJE DESDE HANDLER
      if (tipo === 'GUARDAR_MENSAJE') {
        res.status(201).json({ success: true })

        void guardarMensajeDB(telLimpio, mensaje, emisor, botones).catch((err) =>
          console.error('❌ Error async guardarMensaje:', err)
        )

        return
      }

      // REGISTRO USUARIO
      if (tipo === 'REGISTRO_USUARIO') {
        const resultado = await withTimeout(
          registrarUsuario(telLimpio, nombre, cedula, email),
          8000
        )

        if (!resultado.success) {
          return res.status(500).json({ error: 'No se pudo registrar el usuario' })
        }

        return res.status(201).json({ success: true })
      }

      return res.status(400).json({ error: `Tipo no reconocido: ${tipo}` })
    } catch (error: any) {
      console.error('❌ Error handleBotAction:', error.message || error)
      return res.status(500).json({ error: error.message || 'Error interno' })
    }
  }

  /**
 * Guarda un mensaje dentro del historial de conversaciones.
 *
 * Registra mensajes de usuarios o del bot, incluyendo archivos adjuntos, botones interactivos y metadatos asociados.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con la información del mensaje.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Confirmación del almacenamiento.
 * @throws {Error} Cuando ocurre un error durante el registro del mensaje.
 */
  static async guardarMensaje(req: Request, res: Response) {
    try {
      const apiKey = String(req.headers['x-api-key'] || '')
      if (apiKey !== (process.env.API_KEY || 'EmcaSecret2026')) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const {
        telefono = '',
        mensaje = '',
        emisor = 'USUARIO',
        tipo_mensaje = 'TEXTO',
        url_media = '',
        botones = []
      } = req.body

      if (!telefono) {
        return res.status(400).json({ error: 'El teléfono es obligatorio' })
      }

      const telLimpio = String(telefono).replace(/\D/g, '')
      const botonesJson = JSON.stringify(Array.isArray(botones) ? botones : [])

      // Normalización del texto visible para el chat de usuario
      const textoFinal = mensaje && mensaje.trim() !== ''
        ? mensaje
        : (url_media ? 'Archivo adjunto' : ' ')

      const [result]: any = await withTimeout(
        db.execute(
          `INSERT INTO mensajes (telefono_usuario, mensaje, emisor, botones, url_media, tipo_mensaje, fecha)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [telLimpio, textoFinal, emisor, botonesJson, url_media, tipo_mensaje]
        ),
        5000
      )

      // 🟢 EMITIR EVENTO EN TIEMPO REAL VÍA SOCKET.IO
      const io = req.app.get('io')
      if (io) {
        const nuevoMensaje = {
          id: result.insertId,
          telefono_usuario: telLimpio,
          mensaje: textoFinal,
          emisor,
          botones: Array.isArray(botones) ? botones : [],
          url_media,
          tipo_mensaje,
          fecha: new Date().toISOString()
        }

        // Emitir al canal específico de la conversación del usuario
        io.emit(`mensaje_${telLimpio}`, nuevoMensaje)

        // Emitir evento general para actualizar la lista de chats en el panel
        io.emit('actualizar_chat', nuevoMensaje)
      }

      return res.status(201).json({ success: true })
    } catch (error: any) {
      console.error('❌ Error en guardarMensaje:', error.message || error)
      return res.status(500).json({ error: 'Error interno al guardar mensaje' })
    }
  }

  /**
 * Consulta la información de un usuario registrado.
 *
 * Busca un usuario mediante su número telefónico y retorna la información almacenada en el sistema.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con el teléfono del usuario.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Información del usuario consultado.
 * @throws {Error} Cuando ocurre un error durante la consulta.
 */
  static async checkUser(req: Request, res: Response) {
    try {
      const { telefono } = req.params
      const telLimpio = String(telefono).replace(/\D/g, '')

      const usuario = await withTimeout(checkUserInDB(telLimpio), 5000)

      if (usuario) {
        return res.json(usuario)
      }

      return res.status(404).json({ message: 'Usuario no registrado' })
    } catch (error: any) {
      console.error('❌ Error checkUser:', error.message || error)
      return res.status(500).json({ error: 'Error de consulta o tiempo de espera agotado' })
    }
  }

  /**
 * Registra un nuevo usuario en el sistema.
 *
 * Almacena los datos básicos del usuario para permitir su interacción con el chatbot.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con la información del usuario.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Resultado del registro.
 * @throws {Error} Cuando ocurre un error durante el proceso.
 */
  static async registerUser(req: Request, res: Response) {
    try {
      const { telefono, nombre, cedula, email } = req.body

      if (!telefono || !nombre || !cedula || !email) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' })
      }

      const telLimpio = String(telefono).replace(/\D/g, '')

      const resultado = await withTimeout(
        registrarUsuario(telLimpio, nombre, cedula, email),
        5000
      )

      if (!resultado.success) {
        return res.status(500).json({ error: 'No se pudo registrar el usuario en BD' })
      }

      return res.status(201).json({ success: true, user: resultado })
    } catch (error: any) {
      console.error('❌ Error registerUser:', error.message || error)
      return res.status(500).json({ error: 'Error al registrar el usuario en BD' })
    }
  }

  /**
 * Reactiva el funcionamiento automático del chatbot para un usuario.
 *
 * Actualiza el estado del usuario y notifica al servicio correspondiente para habilitar nuevamente la atención automática.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con el teléfono del usuario.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Confirmación de la reactivación.
 * @throws {Error} Cuando ocurre un error durante la operación.
 */
  static async reactivarBot(req: Request, res: Response) {
    try {
      const { telefono = '' } = req.body
      const telLimpio = String(telefono).replace(/\D/g, '')

      await withTimeout(
        db.execute('UPDATE usuarios SET bot_activo = TRUE WHERE telefono = ?', [telLimpio]),
        5000
      )

      try {
        await fetch('http://127.0.0.1:3008/v1/reactivar-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefono: telLimpio })
        })
      } catch (err) {
        console.error('⚠️ No se pudo notificar a BuilderBot (reactivar):', err)
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('❌ Error reactivarBot:', error)
      return res.status(500).json({ error: 'Error al reactivar bot' })
    }
  }

  /**
 * Obtiene el historial completo de conversación de un usuario.
 *
 * Consulta todos los mensajes asociados a un número telefónico, incluyendo contenido multimedia y metadatos relacionados.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con el teléfono del usuario.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Historial de mensajes del usuario.
 * @throws {Error} Cuando ocurre un error durante la consulta.
 */
  static async getChatHistory(req: Request, res: Response) {
    try {
      const { telefono = '' } = req.params
      const telLimpio = String(telefono).replace(/\D/g, '')
      const baseUrl = `${req.protocol}://${req.get('host')}`

      const query = `
        SELECT 
          id, 
          telefono_usuario AS telefono, 
          mensaje, 
          emisor, 
          botones, 
          url_media AS archivo, 
          tipo_mensaje, 
          fecha 
        FROM mensajes
        WHERE REPLACE(telefono_usuario, '+', '') LIKE CONCAT('%', ?, '%')
        ORDER BY fecha ASC
      `

      const [rows]: any = await db.execute(query, [telLimpio])

      const historialFormateado = (rows || []).map((row: any) => {
        let mediaDTO: MultimediaDTO | null = null

        // Si existe un archivo adjunto, se construye la URL estática usando el DTO
        if (row.archivo && String(row.archivo).trim() !== '') {
          const rawRow: MultimediaRow = {
            id: row.id,
            nombre: row.mensaje && row.mensaje !== 'Archivo adjunto' ? row.mensaje : 'Adjunto WhatsApp',
            archivo: row.archivo,
            fecha: row.fecha
          }
          mediaDTO = new MultimediaDTO(rawRow, baseUrl)
        }

        return {
          id: row.id,
          telefono: row.telefono,
          mensaje: row.mensaje,
          emisor: row.emisor,
          botones: row.botones,
          tipo_mensaje: row.tipo_mensaje,
          fecha: row.fecha,
          media: mediaDTO
        }
      })

      return res.status(200).json(historialFormateado)
    } catch (error: any) {
      console.error('❌ Error en getChatHistory:', error.message || error)
      return res.status(500).json({
        error: 'Error al obtener historial',
        detalle: error.message
      })
    }
  }

  /**
 * Solicita la intervención de un asesor humano.
 *
 * Desactiva temporalmente el chatbot para el usuario y registra la solicitud de atención personalizada.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP con el teléfono del usuario.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Confirmación de la solicitud.
 * @throws {Error} Cuando ocurre un error durante el proceso.
 */
  static async solicitarAsesor(req: Request, res: Response) {
    try {
      const { telefono = '' } = req.body
      const telLimpio = String(telefono).replace(/\D/g, '')

      await withTimeout(
        Promise.all([
          db.execute('UPDATE usuarios SET bot_activo = FALSE WHERE telefono = ?', [telLimpio]),
          db.execute('INSERT INTO solicitudes_asesor (telefono_usuario) VALUES (?)', [telLimpio])
        ]),
        5000
      )

      try {
        await fetch('http://127.0.0.1:3008/v1/pausar-bot-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefono: telLimpio })
        })
      } catch (err) {
        console.error('⚠️ No se pudo notificar a BuilderBot (pausar):', err)
      }

      return res.status(200).json({
        success: true,
        message: 'Modo humano activado'
      })
    } catch (error) {
      console.error('❌ Error solicitarAsesor:', error)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  /**
 * Obtiene el listado completo de usuarios registrados.
 *
 * Consulta la información de todos los usuarios almacenados en la base de datos.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP recibida por el servidor.
 * @param {Response} res Respuesta HTTP enviada al cliente.
 * @returns {Promise<Response>} Listado de usuarios registrados.
 * @throws {Error} Cuando ocurre un error durante la consulta.
 */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const [rows] = await withTimeout<[UsuarioRow[], any]>(
        db.execute<UsuarioRow[]>(
          `SELECT 
             nombre AS nombres, 
             telefono, 
             bot_activo, 
             cedula, 
             email 
           FROM usuarios`
        ),
        5000
      )

      const users = rows.map((user) => ({
        ...user,
        bot_activo: Boolean(user.bot_activo)
      }))

      return res.status(200).json(users)

    } catch (error: any) {
      console.error('❌ Error getAllUsers:', error)

      if (error.message === 'Database/Service timeout after 5000ms' || error.code === 'ETIMEDOUT') {
        return res.status(504).json({ error: 'La consulta a la base de datos agotó el tiempo de espera' })
      }

      return res.status(500).json({ error: 'Error interno al obtener usuarios' })
    }
  }

  /**
 * Método de compatibilidad para el envío de mensajes.
 *
 * Redirige la solicitud al manejador principal de acciones del bot.
 *
 * @async
 * @static
 * @param {Request} req Solicitud HTTP recibida.
 * @param {Response} res Respuesta HTTP enviada.
 * @returns {Promise<Response>} Resultado de la acción ejecutada.
 */
  static async sendMessage(req: Request, res: Response) {
    return BotController.handleBotAction(req, res)
  }

  static async saveData(req: Request, res: Response) {
    return BotController.handleBotAction(req, res)
  }
}