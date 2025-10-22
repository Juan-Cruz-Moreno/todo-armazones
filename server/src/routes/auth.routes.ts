import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { validateRequest } from '@middlewares/validate-request';
import { loginSchema, registerSchema, createUserByAdminSchema } from 'schemas/auth.schema';
import { forgotPasswordSchema, resetPasswordBodySchema } from 'schemas/reset-password.schema';
import { checkAdmin } from '@middlewares/authMiddleware';

const router: Router = Router();
const authController = new AuthController();

router.post('/register', validateRequest({ body: registerSchema }), authController.register);
router.post('/login', validateRequest({ body: loginSchema }), authController.login);
router.post('/login-admin', validateRequest({ body: loginSchema }), authController.loginAdmin);
router.post('/logout', authController.logout);
router.get('/me', authController.currentUser);
router.get('/me-admin', authController.checkAdminSession);
router.post(
  '/create-user-admin',
  checkAdmin,
  validateRequest({ body: createUserByAdminSchema }),
  authController.createUserByAdmin,
);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordBodySchema }), authController.resetPassword);

export default router;
