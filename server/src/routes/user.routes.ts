import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { checkAdmin, checkSession } from '@middlewares/authMiddleware';
import { validateRequest } from '@middlewares/validate-request';
import { updateUserSchema } from 'schemas/user.schema';

const router: Router = Router();
const userController: UserController = new UserController();

// Solo admin puede listar usuarios
router.get('/', checkAdmin, userController.getUsers);

// Solo admin puede buscar usuario por email
router.get('/by-email', checkAdmin, userController.findUserByEmail);

// El usuario autenticado puede actualizar sus propios datos
router.patch('/me', checkSession, validateRequest({ body: updateUserSchema }), userController.updateUser);

export default router;
