import Express from "express";
import multer from "multer";
import { PerfilController } from "../controllers/PerfilController.js";
// Configurar guardado de archivos de imagen
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Asegúrate de crear la carpeta 'uploads' en el backend
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split(".").pop();
        cb(null, `foto-${Date.now()}.${ext}`);
    }
});
const upload = multer({ storage });
const Perfilrouter = Express.Router();
Perfilrouter.post("/", PerfilController.CreatePerfil);
Perfilrouter.get("/:id", PerfilController.BringPerfil);
// 🟢 Añadimos upload.single('foto') para interceptar la imagen
Perfilrouter.put("/:id", upload.single("foto"), PerfilController.UpdatePerfil);
Perfilrouter.delete("/:id", PerfilController.DeletePerfil);
export default Perfilrouter;
