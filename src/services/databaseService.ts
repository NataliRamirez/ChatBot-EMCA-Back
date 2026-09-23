import { db } from '../config/db.js'; 

/**
 * @file databaseService.ts
 * @author Juan David Nieto
 * @description Servicio encargado de la interacción con la base de datos para la gestión de mensajes y usuarios del ecosistema central.
 * Permite validar conexiones, registrar mensajes, consultar usuarios y registrar información de usuarios.
 */

/**
 * Inicializador de conexión a la base de datos.
 *
 * Verifica la disponibilidad de la conexión MySQL al iniciar la aplicación y registra el resultado en consola.
 */
db.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos MySQL (Ecosistema Central)');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Error conectando a la base de datos:', error.message);
    });

/**
 * Guarda un mensaje enviado o recibido dentro del sistema.
 *
 * Registra la información del mensaje junto con el número telefónico, emisor y posibles botones de interacción.
 *
 * @async
 * @param {string} telefono Número telefónico asociado al mensaje.
 * @param {string} mensaje Contenido del mensaje.
 * @param {string} emisor Identificador del remitente del mensaje.
 * @param {string[]} [botones=[]] Lista de botones o acciones asociadas.
 * @returns {Promise<object>} Resultado de la operación de almacenamiento.
 *
 * @throws {Error} Cuando ocurre un error durante el registro del mensaje.
 */
export const guardarMensaje = async ( 
    telefono: string, 
    mensaje: string, 
    emisor: string, 
    botones: string[] = [] ) => { 
        await db.execute(
             `INSERT INTO mensajes (telefono_usuario, mensaje, emisor, botones) VALUES (?, ?, ?, ?)`, 
             [ 
                telefono,
                mensaje,
                 emisor, JSON.stringify(botones) 
                ] 
            ); return { success: true } };

/**
 * Consulta la existencia de un usuario mediante su número telefónico.
 *
 * Busca la información básica del usuario en la base de datos y retorna los datos encontrados.
 *
 * @async
 * @param {string} telefono Número telefónico del usuario.
 * @returns {Promise<object | null>} Información del usuario o null si no existe.
 *
 * @throws {Error} Cuando ocurre un error durante la consulta.
 */
export const checkUserInDB = async (telefono: string) => {
    try {
        const [rows]: any = await db.query(
            'SELECT nombre AS nombres, cedula, email FROM usuarios WHERE telefono = ? LIMIT 1', 
            [telefono]
        );
        if (rows && rows.length > 0) return rows[0]; 
        return null; 
    } catch (error) {
        console.error('❌ Error al consultar usuario en DB:', error);
        return null; 
    }
};

/**
 * Registra o actualiza la información de un usuario.
 *
 * Inserta un nuevo usuario en la base de datos o actualiza los datos existentes si el número telefónico ya se encuentra registrado.
 *
 * @async
 * @param {string} telefono Número telefónico del usuario.
 * @param {string} nombre Nombre completo del usuario.
 * @param {string} cedula Número de identificación del usuario.
 * @param {string} email Correo electrónico del usuario.
 * @returns {Promise<object>} Resultado de la operación de registro.
 *
 * @throws {Error} Cuando ocurre un error durante el proceso de inserción o actualización.
 */
export const registrarUsuario = async (
    telefono: string,
    nombre: string,
    cedula: string,
    email: string
) => {

    try {

        await db.execute(
            `
            INSERT INTO usuarios
            (telefono, nombre, cedula, email)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                nombre = VALUES(nombre),
                cedula = VALUES(cedula),
                email = VALUES(email)
            `,
            [
                telefono,
                nombre,
                cedula,
                email
            ]
        );

        return {
            success: true
        };

    } catch (error) {

        console.error(error);

        return {
            success: false
        };

    }

};