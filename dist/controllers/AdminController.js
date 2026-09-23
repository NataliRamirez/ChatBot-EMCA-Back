import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
export class AdminController {
    // ==========================================
    // REGISTRO DE ADMINISTRADORES
    // ==========================================
    static async createAdmin(req, res) {
        const { nombre, apellido, telefono, email, Password_hash } = req.body;
        if (!nombre || !apellido || !telefono || !email || !Password_hash) {
            return res.status(400).json({
                menssaje: "Faltan campos obligatorios para el registro de administrador"
            });
        }
        try {
            // Verificar si ya existe en la tabla Administrador
            const [existe] = await db.query('SELECT id FROM Administrador WHERE email = ?', [email]);
            if (existe && existe.length > 0) {
                return res.status(400).json({
                    menssaje: "El correo electrónico ya está registrado como administrador"
                });
            }
            // Encriptar la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Password_hash, salt);
            // Insertar en la tabla Administrador (asegúrate de agregar la columna Password_hash si no la tenías)
            const queryInsert = `
                INSERT INTO Administrador (nombre, apellido, telefono, email, estado, Password_hash) 
                VALUES (?, ?, ?, ?, 'Activo', ?)
            `;
            await db.query(queryInsert, [nombre, apellido, telefono, email, hashedPassword]);
            return res.status(201).json({
                res: true,
                menssaje: "Administrador registrado con éxito"
            });
        }
        catch (error) {
            console.error('❌ Error en registro de admin:', error);
            return res.status(500).json({
                menssaje: "Error interno en el servidor al registrar administrador"
            });
        }
    }
    static async loginAdmin(req, res) {
        const { email, Password_hash } = req.body;
        if (!email || !Password_hash) {
            return res.status(400).json({
                menssaje: "Por favor ingrese correo y contraseña"
            });
        }
        try {
            // Buscamos explícitamente en la tabla Administrador
            const [rows] = await db.query('SELECT * FROM Administrador WHERE email = ?', [email]);
            if (!rows || rows.length === 0) {
                return res.status(400).json({
                    menssaje: "El administrador con ese correo no está registrado"
                });
            }
            const admin = rows[0];
            // Validamos la contraseña contra el hash almacenado
            const validPassword = await bcrypt.compare(Password_hash, admin.Password_hash);
            if (!validPassword) {
                return res.status(400).json({
                    menssaje: "Contraseña incorrecta"
                });
            }
            if (admin.estado !== 'Activo') {
                return res.status(403).json({
                    menssaje: "Tu cuenta de jefatura se encuentra inactiva."
                });
            }
            // Generamos el token JWT con el rol 'jefe'
            const token = jwt.sign({ id: admin.id, email: admin.email, rol: 'jefe' }, process.env.JWT_SECRET || 'FirmaSecretaEMCA2026', { expiresIn: '8h' });
            return res.status(200).json({
                res: true,
                token,
                menssaje: "Autenticación exitosa",
                admin: {
                    id: admin.id,
                    nombre: admin.nombre,
                    email: admin.email
                }
            });
        }
        catch (error) {
            console.error('❌ Error en el login de admin:', error);
            return res.status(500).json({
                menssaje: "Error interno en el servidor al procesar el login de administración"
            });
        }
    }
}
