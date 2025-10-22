import { Request, Response } from 'express';
import { UserService } from '@services/user.service';
import { ApiResponse } from '../types/response';

export class UserController {
  private userService: UserService = new UserService();

  /**
   * Busca un usuario por email (solo admin)
   */
  public findUserByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query;

      // Validación manual del email
      if (!email || typeof email !== 'string') {
        res.status(400).json({ status: 'error', message: 'Email is required' });
        return;
      }

      // Validación del formato del email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ status: 'error', message: 'Invalid email format' });
        return;
      }

      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to fetch user by email',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to fetch user by email',
            };
      res.status(500).json(response);
    }
  };

  /**
   * Obtiene la dirección más reciente de un usuario (solo admin)
   */
  public getMostRecentAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ status: 'error', message: 'User ID is required' });
        return;
      }

      const address = await this.userService.getMostRecentAddress(userId);

      // Es válido que un usuario no tenga direcciones, retornar null
      res.status(200).json({ status: 'success', data: address });
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to fetch user address',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to fetch user address',
            };
      res.status(500).json(response);
    }
  };
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    const { limit = 10, cursor } = req.query;
    const parsedLimit = parseInt(limit as string, 10);

    try {
      const users = await this.userService.getUsers(parsedLimit, cursor as string);
      const response: ApiResponse<typeof users> = {
        status: 'success',
        data: users,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to fetch users',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to fetch users',
            };
      res.status(500).json(response);
    }
  };

  /**
   * Busca usuarios de manera flexible (solo admin)
   */
  public searchUsers = async (req: Request, res: Response): Promise<void> => {
    const { query, fields, limit, cursor } = req.query;
    const parsedFields = fields
      ? (fields as string).split(',').map((f) => f.trim())
      : ['firstName', 'lastName', 'displayName'];
    const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

    try {
      const users = await this.userService.searchUsers(query as string, parsedFields, parsedLimit, cursor as string);
      const response: ApiResponse<typeof users> = {
        status: 'success',
        data: users,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to search users',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to search users',
            };
      res.status(500).json(response);
    }
  };

  /**
   * Actualiza los datos del usuario autenticado
   */
  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // getSessionUserId se usa internamente en el service
      const updateData = req.body;
      const updatedUser = await this.userService.updateUserById(req.session, updateData);
      const response: ApiResponse<typeof updatedUser> = {
        status: 'success',
        data: updatedUser,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to update user',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to update user',
            };
      res.status(500).json(response);
    }
  };

  /**
   * Actualiza cualquier campo de un usuario (solo admin)
   */
  public updateUserAsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const updatedUser = await this.userService.updateUserAsAdmin(userId, updateData);
      const response: ApiResponse<typeof updatedUser> = {
        status: 'success',
        message: 'Usuario actualizado exitosamente por administrador',
        data: updatedUser,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to update user as admin',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to update user as admin',
            };
      res.status(500).json(response);
    }
  };

  /**
   * Actualiza la dirección favorita (isDefault: true) de un usuario (solo admin)
   */
  public updateDefaultAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const updatedAddress = await this.userService.updateDefaultAddress(userId, updateData);
      const response: ApiResponse<typeof updatedAddress> = {
        status: 'success',
        data: updatedAddress,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse =
        error instanceof Error && 'stack' in error
          ? {
              status: 'error',
              message: 'Failed to update default address',
              details: { message: error.message, stack: error.stack },
            }
          : {
              status: 'error',
              message: 'Failed to update default address',
            };
      res.status(500).json(response);
    }
  };
}
