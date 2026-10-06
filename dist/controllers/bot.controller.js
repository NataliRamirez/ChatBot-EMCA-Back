import { db } from '../config/db.js';
import { guardarMensaje as guardarMensajeDB, checkUserInDB, registrarUsuario } from '../services/databaseService.js';
// Helper para forzar timeout en promesas
const withTimeout = (promise, ms = 8000) => {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`Database/Service timeout after ${ms}ms`)), ms));
    return Promise.race([promise, timeout]);
};
export class BotController {
    // =========================================================
    // WEBHOOK META
    // =========================================================
    static async metaWebhook(req, res) {
        try {
            const body = req.body;
            const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (message?.text?.body) {
                const telefono = String(message.from).replace(/\D/g, '');
                const texto = String(message.text.body).trim();
                console.log(`📩 META [${telefono}]: ${texto}`);
                // NO BLOQUEAR: Guarda el mensaje entrante en segundo plano
                void guardarMensajeDB(telefono, texto, 'USUARIO').catch((err) => console.error('❌ Error en guardarMensaje background:', err));
            }
            return res.status(200).send('EVENT_RECEIVED');
        }
        catch (error) {
            console.error('❌ Error metaWebhook:', error);
            return res.status(500).json({ error: true, message: error.message });
        }
    }
    // =========================================================
    // ACCIONES DEL BOT (LEGACY / MULTI-ACTION)
    // =========================================================
    static async handleBotAction(req, res) {
        console.log('🚀 handleBotAction ejecutándose');
        try {
            const apiKey = String(req.headers['x-api-key'] || '');
            if (apiKey !== 'EmcaSecret2026') {
                return res.status(401).json({ error: 'No autorizado' });
            }
            const { tipo = '', telefono = '', mensaje = '', emisor = 'BOT', botones = [], nombre = '', cedula = '', email = '' } = req.body;
            if (!tipo || !telefono) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }
            const telLimpio = String(telefono).replace(/\D/g, '');
            // GUARDAR MENSAJE DESDE HANDLER
            if (tipo === 'GUARDAR_MENSAJE') {
                console.log('📌 GUARDAR_MENSAJE');
                res.status(201).json({ success: true });
                void guardarMensajeDB(telLimpio, mensaje, emisor, botones).catch((err) => console.error('❌ Error async guardarMensaje:', err));
                return;
            }
            // REGISTRO USUARIO
            if (tipo === 'REGISTRO_USUARIO') {
                console.log('📌 REGISTRO_USUARIO');
                const resultado = await withTimeout(registrarUsuario(telLimpio, nombre, cedula, email), 8000);
                console.log('📌 Resultado:', resultado);
                if (!resultado.success) {
                    return res.status(500).json({ error: 'No se pudo registrar el usuario' });
                }
                return res.status(201).json({ success: true });
            }
            return res.status(400).json({ error: `Tipo no reconocido: ${tipo}` });
        }
        catch (error) {
            console.error('❌ Error handleBotAction:', error.message || error);
            return res.status(500).json({ error: error.message || 'Error interno' });
        }
    }
    // =========================================================
    // ENDPOINT DEDICADO: GUARDAR MENSAJE (/messages/guardar)
    // =========================================================
    static async guardarMensaje(req, res) {
        try {
            const apiKey = String(req.headers['x-api-key'] || '');
            if (apiKey !== (process.env.API_KEY || 'EmcaSecret2026')) {
                return res.status(401).json({ error: 'No autorizado' });
            }
            const { telefono = '', mensaje = '', emisor = 'USUARIO', tipo_mensaje = 'TEXTO', url_media = '', botones = [] } = req.body;
            if (!telefono) {
                return res.status(400).json({ error: 'El teléfono es obligatorio' });
            }
            const telLimpio = String(telefono).replace(/\D/g, '');
            const botonesJson = JSON.stringify(Array.isArray(botones) ? botones : []);
            const textoFinal = mensaje && mensaje.trim() !== '' ? mensaje : (url_media ? 'Archivo adjunto' : ' ');
            await withTimeout(db.execute(`INSERT INTO mensajes (telefono_usuario, mensaje, emisor, botones, url_media, tipo_mensaje, fecha)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`, [telLimpio, textoFinal, emisor, botonesJson, url_media, tipo_mensaje]), 5000);
            return res.status(201).json({ success: true });
        }
        catch (error) {
            console.error('❌ Error en guardarMensaje:', error.message || error);
            return res.status(500).json({ error: 'Error interno al guardar mensaje' });
        }
    }
    // =========================================================
    // CONSULTAR USUARIO
    // =========================================================
    static async checkUser(req, res) {
        try {
            const { telefono } = req.params;
            const telLimpio = String(telefono).replace(/\D/g, '');
            const usuario = await withTimeout(checkUserInDB(telLimpio), 5000);
            if (usuario) {
                return res.json(usuario);
            }
            return res.status(404).json({ message: 'Usuario no registrado' });
        }
        catch (error) {
            console.error('❌ Error checkUser:', error.message || error);
            return res.status(500).json({ error: 'Error de consulta o tiempo de espera agotado' });
        }
    }
    // =========================================================
    // REGISTRO DE USUARIO (POST)
    // =========================================================
    static async registerUser(req, res) {
        try {
            const { telefono, nombre, cedula, email } = req.body;
            if (!telefono || !nombre || !cedula || !email) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }
            const telLimpio = String(telefono).replace(/\D/g, '');
            const resultado = await withTimeout(registrarUsuario(telLimpio, nombre, cedula, email), 5000);
            if (!resultado.success) {
                return res.status(500).json({ error: 'No se pudo registrar el usuario en BD' });
            }
            return res.status(201).json({ success: true, user: resultado });
        }
        catch (error) {
            console.error('❌ Error registerUser:', error.message || error);
            return res.status(500).json({ error: 'Error al registrar el usuario en BD' });
        }
    }
    // =========================================================
    // REACTIVAR BOT
    // =========================================================
    static async reactivarBot(req, res) {
        try {
            const { telefono = '' } = req.body;
            const telLimpio = String(telefono).replace(/\D/g, '');
            await withTimeout(db.execute('UPDATE usuarios SET bot_activo = TRUE WHERE telefono = ?', [telLimpio]), 5000);
            try {
                await fetch('http://127.0.0.1:3008/v1/reactivar-local', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telefono: telLimpio })
                });
            }
            catch (err) {
                console.error('⚠️ No se pudo notificar a BuilderBot (reactivar):', err);
            }
            return res.status(200).json({ success: true });
        }
        catch (error) {
            console.error('❌ Error reactivarBot:', error);
            return res.status(500).json({ error: 'Error al reactivar bot' });
        }
    }
    // =========================================================
    // HISTORIAL CHAT
    // =========================================================
    static async getChatHistory(req, res) {
        try {
            const { telefono = '' } = req.params;
            const telLimpio = String(telefono).replace(/\D/g, '');
            const [rows] = await withTimeout(db.execute(`SELECT 
             id, 
             telefono_usuario AS telefono, 
             mensaje, 
             emisor, 
             botones, 
             url_media, 
             tipo_mensaje, 
             fecha 
           FROM mensajes
           WHERE telefono_usuario = ?
           ORDER BY fecha ASC`, [telLimpio]), 5000);
            return res.status(200).json(rows || []);
        }
        catch (error) {
            console.error('❌ Error en getChatHistory:', error.message || error);
            return res.status(500).json({
                error: 'Error al obtener historial',
                detalle: error.message
            });
        }
    }
    // =========================================================
    // SOLICITAR ASESOR
    // =========================================================
    static async solicitarAsesor(req, res) {
        try {
            const { telefono = '' } = req.body;
            const telLimpio = String(telefono).replace(/\D/g, '');
            await withTimeout(Promise.all([
                db.execute('UPDATE usuarios SET bot_activo = FALSE WHERE telefono = ?', [telLimpio]),
                db.execute('INSERT INTO solicitudes_asesor (telefono_usuario) VALUES (?)', [telLimpio])
            ]), 5000);
            try {
                await fetch('http://127.0.0.1:3008/v1/pausar-bot-local', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telefono: telLimpio })
                });
            }
            catch (err) {
                console.error('⚠️ No se pudo notificar a BuilderBot (pausar):', err);
            }
            return res.status(200).json({
                success: true,
                message: 'Modo humano activado'
            });
        }
        catch (error) {
            console.error('❌ Error solicitarAsesor:', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    }
    // =========================================================
    // LISTAR USUARIOS
    // =========================================================
    static async getAllUsers(req, res) {
        try {
            // 2. Consulta tipada con MySQL
            const [rows] = await withTimeout(db.execute(`SELECT 
             nombre AS nombres, 
             telefono, 
             bot_activo, 
             cedula, 
             email 
           FROM usuarios`), 5000);
            // 3. Formatear la respuesta asegurando booleanos verdaderos para bot_activo
            const users = rows.map((user) => ({
                ...user,
                bot_activo: Boolean(user.bot_activo)
            }));
            return res.status(200).json(users);
        }
        catch (error) {
            console.error('❌ Error getAllUsers:', error);
            if (error.message === 'Timeout' || error.code === 'ETIMEDOUT') {
                return res.status(504).json({ error: 'La consulta a la base de datos agotó el tiempo de espera' });
            }
            return res.status(500).json({ error: 'Error interno al obtener usuarios' });
        }
    }
    // =========================================================
    // METODOS DE COMPATIBILIDAD
    // =========================================================
    static async sendMessage(req, res) {
        return BotController.handleBotAction(req, res);
    }
    static async saveData(req, res) {
        return BotController.handleBotAction(req, res);
    }
}
