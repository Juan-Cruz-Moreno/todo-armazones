import User, { IUserDocument } from '@models/User';
import { GetUsersPaginatedResponse, UpdateUserRequestDto } from '@dto/user.dto';
import session from 'express-session';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';

export class UserService {
  /**
   * Busca un usuario por su email
   */
  public async findUserByEmail(email: string): Promise<IUserDocument | null> {
    const user = await User.findOne({ email });
    return user;
  }
  public async getUsers(limit: number = 10, cursor?: string): Promise<GetUsersPaginatedResponse> {
    // Validate and normalize inputs
    const maxLimit = 100;
    if (limit <= 0) {
      throw new AppError('Limit must be greater than 0', 400, 'fail', true);
    }
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    let query: Record<string, unknown> = {};
    if (cursor) {
      try {
        const cursorId = new Types.ObjectId(cursor);
        query = { _id: { $gt: cursorId } };
      } catch (_err) {
        throw new AppError('Invalid cursor format', 400, 'fail', true);
      }
    }

    const users = await User.find(query)
      .sort({ _id: 1 })
      .limit(limit + 1);

    const hasNextPage = users.length > limit;
    const usersToReturn = hasNextPage ? users.slice(0, limit) : users;

    const result: GetUsersPaginatedResponse = {
      users: usersToReturn.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        status: u.status,
        ...(u.lastLogin && { lastLogin: u.lastLogin }),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      nextCursor: hasNextPage ? usersToReturn[usersToReturn.length - 1]._id.toString() : null,
    };

    return result;
  }
  /**
   * Actualiza los campos editables del usuario autenticado
   * @param session La sesión actual (para obtener el userId)
   * @param updateData Los datos a actualizar (email, displayName, firstName, lastName)
   */
  public async updateUserById(
    session: session.Session & Partial<session.SessionData>,
    updateData: UpdateUserRequestDto,
  ) {
    // Utiliza la utilidad para obtener el userId de la sesión
    const { getSessionUserId } = await import('@utils/sessionUtils');
    const userId = getSessionUserId(session);

    // Only allow these fields to be updated
    const allowedFields: Array<keyof UpdateUserRequestDto> = [
      'email',
      'displayName',
      'firstName',
      'lastName',
      'dni',
      'cuit',
      'phone',
    ];
    const update: Partial<Record<keyof UpdateUserRequestDto, string>> = {};
    for (const key of allowedFields) {
      const value = (updateData as UpdateUserRequestDto)[key];
      if (value !== undefined && typeof value === 'string') {
        (update as Partial<Record<keyof UpdateUserRequestDto, string>>)[key] = value;
      }
    }

    // No valid fields
    if (Object.keys(update).length === 0) {
      throw new AppError('No valid fields to update', 400, 'fail', true);
    }

    // Normalize email if provided
    if (update.email) {
      update.email = (update.email as string).toLowerCase();
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true });

      if (!updatedUser) {
        throw new AppError('User not found', 404, 'fail', true);
      }

      logger.info('User updated', { userId: userId.toString(), updatedFields: Object.keys(update) });

      return {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        status: updatedUser.status,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        dni: updatedUser.dni,
        cuit: updatedUser.cuit,
        phone: updatedUser.phone,
      };
    } catch (_err: unknown) {
      // If it's an AppError, rethrow it
      if (_err instanceof AppError) throw _err;

      // Narrow the unknown error to a shape we can inspect without using `any`
      const err = _err as { code?: number; keyPattern?: Record<string, unknown>; message?: string } | undefined;

      // Handle duplicate email (Mongo duplicate key) safely
      if (
        err &&
        err.code === 11000 &&
        err.keyPattern &&
        Object.prototype.hasOwnProperty.call(err.keyPattern, 'email')
      ) {
        throw new AppError('Email already in use', 409, 'fail', true);
      }

      // Log and wrap unknown errors
      logger.error('Error updating user', {
        error: err ?? _err,
        userId: typeof userId === 'object' && userId?.toString ? userId.toString() : String(userId),
      });
      throw new AppError('Failed to update user', 500, 'error', true);
    }
  }
}
