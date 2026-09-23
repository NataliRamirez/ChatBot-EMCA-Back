import Express from 'express';
import { LoginController } from '../controllers/LoginController.js';
const Loginrouter = Express.Router();
Loginrouter.post('/register', LoginController.createLogin);
Loginrouter.post('/login', LoginController.BringLogin);
Loginrouter.put('/:id', LoginController.updateLogin);
Loginrouter.delete('/:id', LoginController.deleteLogin);
export default Loginrouter;
