import Express from 'express';
import { menuController } from '../controllers/menuController.js';
const menurouter = Express.Router();
menurouter.get('./', menuController.createMenu);
menurouter.post('./', menuController.BringMenu);
menurouter.put('./', menuController.updateMenu);
menurouter.delete('./', menuController.deleteMenu);
export default menurouter;
