import { db } from '../config/db.js'; 

// Inicializador de instancia de base de datos
db.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos MySQL (Ecosistema Central)');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Error conectando a la base de datos:', error.message);
    });

/**
 * Guarda el mensaje directo en la DB de forma nativa.
 * NO SE USA FETCH AQUÍ PORQUE ESTO YA ES EL BACKEND.
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