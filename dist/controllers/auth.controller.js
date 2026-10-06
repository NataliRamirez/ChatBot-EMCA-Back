import { db } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
export class authController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const [rows] = await db.execute('SELECT * FROM empleados WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({
                    mensaje: 'Usuario no encontrado'
                });
            }
            const empleado = rows[0];
            const valido = await bcrypt.compare(password, empleado.password_hash);
            if (!valido) {
                return res.status(401).json({
                    mensaje: 'Contraseña incorrecta'
                });
            }
            const token = jwt.sign({
                id: empleado.id,
                rol: empleado.rol
            }, 'SECRETO_EMCA_2026', { expiresIn: '8h' });
            return res.json({
                token,
                empleado: {
                    id: empleado.id,
                    nombre: empleado.nombre,
                    email: empleado.email,
                    rol: empleado.rol
                }
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error interno del servidor'
            });
        }
    }
    // REGISTER
    static async register(req, res) {
        try {
            const { nombre, apellido, telefono, email, password } = req.body;
            const hash = await bcrypt.hash(password, 10);
            await db.execute(`INSERT INTO empleados
            (nombre, apellido, telefono, email, rol, password_hash)
            VALUES (?, ?, ?, ?, ?, ?)`, [
                nombre,
                apellido,
                telefono,
                email,
                'usuario',
                hash
            ]);
            return res.status(201).json({
                mensaje: 'Usuario registrado correctamente',
                rol: 'usuario'
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error al registrar usuario'
            });
        }
    }
}
