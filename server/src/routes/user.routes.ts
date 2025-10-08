import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { checkAdmin, checkSession } from '@middlewares/authMiddleware';
import { validateRequest } from '@middlewares/validate-request';
import { updateUserSchema, updateUserAsAdminSchema } from 'schemas/user.schema';

const router: Router = Router();
const userController: UserController = new UserController();

// Solo admin puede listar usuarios
router.get('/', checkAdmin, userController.getUsers);

// Solo admin puede buscar usuario por email
router.get('/by-email', checkAdmin, userController.findUserByEmail);

// Solo admin puede buscar usuarios de manera flexible
router.get('/search', checkAdmin, userController.searchUsers);

// El usuario autenticado puede actualizar sus propios datos
router.patch('/me', checkSession, validateRequest({ body: updateUserSchema }), userController.updateUser);

// Solo admin puede actualizar cualquier usuario (incluyendo password, role, status)
router.patch(
  '/:userId',
  checkAdmin,
  validateRequest({ body: updateUserAsAdminSchema }),
  userController.updateUserAsAdmin,
);

export default router;
