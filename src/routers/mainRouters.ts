import express from 'express';
import { mainController } from '../controllers/mainController.js';


const mainrouter =express.Router();

mainrouter.get('./', mainController.createMain);
mainrouter.post('./', mainController.BringMain);
mainrouter.put('./', mainController.updateMain);
mainrouter.delete('./', mainController.deleteMain);


export default mainrouter;