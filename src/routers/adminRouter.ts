import Express from 'express';
import { AdminController } from '../controllers/AdminController.js';

const AdminRouter = Express.Router();

AdminRouter.post('/register', AdminController.createAdmin);

AdminRouter.post('/login', AdminController.loginAdmin); 

export default AdminRouter;