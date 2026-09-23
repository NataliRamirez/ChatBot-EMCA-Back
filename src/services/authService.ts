import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { envs } from '../config/Envs.js';

/**
 * @file AuthService.ts
 * @author Juan David Nieto
 * @description Servicio encargado de la autenticación de usuarios,
 * proporcionando funcionalidades para el cifrado de contraseñas,
 * validación de credenciales y generación de tokens JWT.
 *
 * Funcionalidades:
 * - Encriptación de contraseñas.
 * - Validación de contraseñas.
 * - Generación de tokens JWT.
 *
 * @class AuthService
 */
export class AuthService {

    /**
     * Encripta una contraseña utilizando bcrypt.
     *
     * Genera un hash seguro a partir de la contraseña recibida, utilizando la cantidad de rondas configuradas en la aplicación.
     *
     * @async
     * @static
     * @param {string} password Contraseña en texto plano.
     * @returns {Promise<string>} Contraseña cifrada mediante bcrypt.
     *
     * @throws {Error} Cuando ocurre un error durante el proceso de cifrado.
     */
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, envs.SALT_ROUNDS);
    }

    /**
     * Compara una contraseña en texto plano con una contraseña cifrada.
     *
     * Verifica si la contraseña ingresada coincide con el hash almacenado previamente en la base de datos.
     *
     * @async
     * @static
     * @param {string} password Contraseña ingresada por el usuario.
     * @param {string} hash Contraseña cifrada almacenada en el sistema.
     * @returns {Promise<boolean>} Resultado de la validación de credenciales.
     *
     * @throws {Error} Cuando ocurre un error durante la comparación.
     */
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Genera un token JWT para la autenticación de usuarios.
     *
     * Crea un token firmado digitalmente con la información
     * suministrada en el payload y una vigencia de dos horas.
     *
     * @static
     * @param {object} payload Información que será incluida dentro del token.
     * @returns {string} Token JWT generado correctamente.
     *
     * @throws {Error} Cuando ocurre un error durante la generación del token.
     */
    static generateToken(payload: object): string {
        return jwt.sign(payload, envs.JWT_SECRET, { expiresIn: '2h' });
    }
}