import Express from 'express';
import { contenPrincipalController }from '../controllers/contenPrincipalController.js';



const contenPrincipalrouter =Express.Router();


contenPrincipalrouter.get('./' , contenPrincipalController.createContenPrincipal);
contenPrincipalrouter.post('./', contenPrincipalController.BringContenPrincipal);
contenPrincipalrouter.put('./', contenPrincipalController.updateContenPrincipal);
contenPrincipalrouter.delete('./', contenPrincipalController.deleteContenPrincipal);


export default contenPrincipalrouter;