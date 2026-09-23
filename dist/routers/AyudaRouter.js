import { Router } from "express";
import { ayudaController } from "../controllers/AyudaController.js";
const router = Router();
router.get("/", ayudaController.obtenerAyuda);
export default router;
