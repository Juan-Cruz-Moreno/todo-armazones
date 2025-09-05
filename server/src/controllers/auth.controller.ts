import { Request, Response, NextFunction } from 'express'; // Externo
import { ApiResponse } from '../types/response';

import { AuthService } from '@services/auth.service'; // Servicios
import { RegisterRequestDto, LoginRequestDto } from '@dto/auth.dto'; // DTOs
import logger from '@config/logger'; // Configuración
import { AppError } from '@utils/AppError'; // Utilidades
import { UserRole } from '@enums/user.enum';

export class AuthController {
  private authService: AuthService = new AuthService();

  public register = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const userData: RegisterRequestDto = req.body;

      const user = await this.authService.register(userData, req.session);

      res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        data: { user },
      });
    } catch (error) {
      logger.error('Error en AuthController.register', { error });
      next(error);
    }
  };

  public createUserByAdmin = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const { email, password, displayName, firstName, lastName, dni, cuit, phone } = req.body;

      const user = await this.authService.createUserByAdmin({
        email,
        password,
        displayName,
        firstName,
        lastName,
        dni,
        cuit,
        phone,
      });

      res.status(201).json({
        status: 'success',
        message: 'Usuario creado exitosamente por administrador',
        data: { user },
      });
    } catch (error) {
      logger.error('Error en AuthController.createUserByAdmin', { error });
      next(error);
    }
  };

  public login = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginRequestDto = req.body;

      const user = await this.authService.login(loginData, req.session);

      res.status(200).json({
        status: 'success',
        message: 'Inicio de sesión exitoso',
        data: { user },
      });
    } catch (error) {
      logger.error('Error en AuthController.login', { error });
      next(error);
    }
  };

  public loginAdmin = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginRequestDto = req.body;

      const user = await this.authService.loginAdmin(loginData, req.session);

      res.status(200).json({
        status: 'success',
        message: 'Inicio de sesión como administrador exitoso',
        data: { user },
      });
    } catch (error) {
      logger.error('Error en AuthController.loginAdmin', { error });
      next(error);
    }
  };

  public logout = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Error al cerrar sesión', { error: err });
          return next(new AppError('No se pudo cerrar sesión', 500));
        }

        res.clearCookie('connect.sid'); // nombre por defecto de la cookie de sesión
        res.status(200).json({
          status: 'success',
          message: 'Sesión cerrada exitosamente',
        });
      });
    } catch (error) {
      logger.error('Error en AuthController.logout', { error });
      next(error);
    }
  };

  public currentUser = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      if (!req.session.user) {
        res.status(200).json({
          status: 'success',
          message: 'No hay sesión activa',
          data: {
            user: null,
            authenticated: false,
          },
        });
        return;
      }

      // Mapear _id a id
      const { _id, ...rest } = req.session.user;
      const user = { id: _id.toString(), ...rest };

      res.status(200).json({
        status: 'success',
        data: {
          user: user,
          authenticated: true,
        },
      });
    } catch (error) {
      logger.error('Error en AuthController.currentUser', { error });
      next(error);
    }
  };

  public checkAdminSession = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      if (!req.session.user) {
        res.status(200).json({
          status: 'success',
          message: 'No hay sesión activa',
          data: {
            user: null,
            authenticated: false,
            isAdmin: false,
          },
        });
        return;
      }

      if (req.session.user.role !== UserRole.Admin) {
        const { _id, ...rest } = req.session.user;
        const user = { id: _id.toString(), ...rest };
        res.status(200).json({
          status: 'success',
          message: 'Usuario autenticado pero no es administrador',
          data: {
            user: user,
            authenticated: true,
            isAdmin: false,
          },
        });
        return;
      }

      const { _id, ...rest } = req.session.user;
      const user = { id: _id.toString(), ...rest };
      res.status(200).json({
        status: 'success',
        data: {
          user: user,
          authenticated: true,
          isAdmin: true,
        },
      });
    } catch (error) {
      logger.error('Error en AuthController.checkAdminSession', { error });
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      // Genera el token (en producción deberías enviar el mail)
      const token = await this.authService.requestPasswordReset(email);
      // Por seguridad, siempre responde igual
      res.status(200).json({
        status: 'success',
        message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña.',
        data: process.env.NODE_ENV === 'development' ? { token } : undefined,
      });
    } catch (error) {
      logger.error('Error en AuthController.forgotPassword', { error });
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      const user = await this.authService.resetPassword(token, password, req.session);
      res.status(200).json({
        status: 'success',
        message: 'Contraseña restablecida exitosamente',
        data: { user },
      });
    } catch (error) {
      logger.error('Error en AuthController.resetPassword', { error });
      next(error);
    }
  };
}
