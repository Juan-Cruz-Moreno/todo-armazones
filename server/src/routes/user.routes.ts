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

// Solo el usuario autenticado puede obtener la dirección más reciente de un usuario
router.get('/:userId/address/recent', checkSession, userController.getMostRecentAddress);

// Solo el usuario autenticado puede actualizar o crear la dirección favorita de un usuario
router.patch('/:userId/address/default', checkSession, userController.updateDefaultAddress);

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
