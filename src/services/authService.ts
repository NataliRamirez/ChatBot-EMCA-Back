import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { envs } from '../config/Envs.js';

export class AuthService {
      // 1. Encriptar
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, envs.SALT_ROUNDS);
    }

    // 2. Comparar (para el Login)
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    // 3. Crear el Token JWT
    static generateToken(payload: object): string {
        return jwt.sign(payload, envs.JWT_SECRET, { expiresIn: '2h' });
    }
}