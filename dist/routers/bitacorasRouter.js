import Express from 'express';
import { bitacorasController } from '../controllers/bitacorasController.js';
const bitacorasrouter = Express.Router();
bitacorasrouter.get('/', bitacorasController.BringBitacoras);
bitacorasrouter.post('/', bitacorasController.CreateBitacoras);
bitacorasrouter.put('/:id', bitacorasController.UpdateBitacoras);
bitacorasrouter.delete('/:id', bitacorasController.DeleteBitacoras);
export default bitacorasrouter;
