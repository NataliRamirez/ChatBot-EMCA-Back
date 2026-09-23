import Express from 'express';
import { employeController } from '../controllers/employeController.js';

const emplorouter = Express.Router();


emplorouter.get('/', employeController.getAllEmployes);
// 🌟 Rutas limpias apuntando a la raíz del prefijo asignado en app.js
emplorouter.post('/register', employeController.createEmploye);
emplorouter.post('/login', employeController.login);
emplorouter.put('/:id', employeController.updateEmploye);
emplorouter.delete('/:id', employeController.deleteEmploye);

export default emplorouter;

