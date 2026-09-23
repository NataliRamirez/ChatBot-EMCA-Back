import Express from "express";
import { reportesController } from '../controllers/reportesController.js';
const reportrouter = Express.Router();
reportrouter.post('/', reportesController.createReport);
reportrouter.get('/', reportesController.BringReport);
reportrouter.put('/:id', reportesController.updateReport);
reportrouter.delete('/:id', reportesController.deleteReport);
export default reportrouter;
