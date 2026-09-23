import mysql from 'mysql2/promise';
import { envs } from './Envs.js'; 

/**
 * @author Juan David Nieto
 * @file Pool de conexiones a la base de datos MySQL.
 * @description Este pool permite reutilizar conexiones para optimizar el rendimiento
 * de la aplicación, evitando la creación y cierre constante de conexiones.
 *
 * Configuración:
 * - Host, puerto y credenciales obtenidos desde variables de entorno.
 * - Máximo de 10 conexiones simultáneas.
 * - Espera automática cuando no hay conexiones disponibles.
 * - Keep Alive habilitado para mantener conexiones activas.
 *
 * @constant {mysql.Pool}
 */
export const db = mysql.createPool({
    host: envs.DB_HOST,
    port: envs.DB_PORT,
    user: envs.DB_USER,
    password: envs.DB_PASSWORD,
    database: envs.DB_NAME, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true, 
    keepAliveInitialDelay: 10000
});