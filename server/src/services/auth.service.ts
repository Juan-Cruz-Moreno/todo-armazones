import argon2 from 'argon2';
import session from 'express-session';
import { JwtPayload, decode as jwtDecode } from 'jsonwebtoken';
import { RegisterRequestDto, LoginRequestDto, RegisterResponseDto, LoginResponseDto } from '@dto/auth.dto';
import { capitalizeFirstLetter } from '@utils/stringUtils';
import { setSessionUser } from '@utils/sessionUtils';
import User from '@models/User';
import Address, { IAddressDocument } from '@models/Address';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import { UserRole } from '@enums/user.enum';
import { isArgon2Hash } from '@utils/hashUtils';
import {
  generateResetPasswordToken,
  verifyResetPasswordToken,
  ResetPasswordTokenPayload,
} from '@utils/resetPasswordToken';
import { hashToken } from '@utils/hashToken';
import transporter from '@config/nodemailer.config';
import env from '@config/env';
import { renderResetPasswordEmail } from '@utils/renderResetPasswordEmail';
import { isModernWpHash, verifyModernWpPassword } from '@utils/wordpressHashUtils';
import { withTransaction } from '@helpers/withTransaction';
import { DeliveryType } from '@enums/order.enum';

export class AuthService {
  /**
   * Crea un usuario sin iniciar sesión (uso exclusivo para administradores)
   * Opcionalmente puede crear una dirección favorita para el usuario
   */
  public async createUserByAdmin(data: {
    email: string;
    password: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
    cuit?: string;
    phone?: string;
    address?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      email?: string;
      phoneNumber?: string;
      dni?: string;
      cuit?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      shippingCompany?: string;
      declaredShippingAmount?: string;
      deliveryWindow?: string;
      deliveryType?: DeliveryType;
      pickupPointAddress?: string;
    };
  }): Promise<RegisterResponseDto & { address?: IAddressDocument }> {
    try {
      const normalizedEmail = data.email.toLowerCase();

      // Verificar que el usuario no exista
      const existingUser = await User.findOne({
        email: normalizedEmail,
      }).lean();
      if (existingUser) {
        logger.warn('Intento de creación de usuario por admin con correo ya registrado', {
          email: normalizedEmail,
        });
        throw new AppError('El correo ya está registrado', 409, 'fail', true, {
          code: 'USER_EXISTS',
          fields: { email: ['El correo ya está en uso'] },
        });
      }

      const displayName = data.displayName ? data.displayName : capitalizeFirstLetter(normalizedEmail.split('@')[0]);

      const hashedPassword = await argon2.hash(data.password, {
        type: argon2.argon2id,
      });

      // Usar transacción para garantizar atomicidad
      const result = await withTransaction(async (session) => {
        // Crear usuario
        const newUserDoc = await User.create(
          [
            {
              email: normalizedEmail,
              displayName,
              ...(data.firstName && { firstName: data.firstName }),
              ...(data.lastName && { lastName: data.lastName }),
              ...(data.dni && { dni: data.dni }),
              ...(data.cuit && { cuit: data.cuit }),
              ...(data.phone && { phone: data.phone }),
              password: hashedPassword,
            },
          ],
          { session },
        );

        const userId = newUserDoc[0]._id;

        // Crear dirección si se proporcionó
        let addressDoc: IAddressDocument | undefined;
        if (data.address) {
          const addressData = data.address;

          // Validar campos requeridos para dirección
          const requiredFields = [
            'firstName',
            'lastName',
            'email',
            'phoneNumber',
            'dni',
            'city',
            'state',
            'postalCode',
          ];
          const missingFields = requiredFields.filter((field) => !addressData[field as keyof typeof addressData]);

          if (missingFields.length > 0) {
            throw new AppError(
              `Faltan campos requeridos para la dirección: ${missingFields.join(', ')}`,
              400,
              'fail',
              true,
              { code: 'MISSING_ADDRESS_FIELDS', missingFields },
            );
          }

          // Validar deliveryType específico
          const deliveryType = addressData.deliveryType || DeliveryType.HomeDelivery;
          if (deliveryType === DeliveryType.HomeDelivery && !addressData.streetAddress) {
            throw new AppError(
              'streetAddress es requerido cuando el tipo de entrega es a domicilio',
              400,
              'fail',
              true,
              { code: 'MISSING_STREET_ADDRESS' },
            );
          }

          if (deliveryType === DeliveryType.PickupPoint && !addressData.pickupPointAddress) {
            throw new AppError(
              'pickupPointAddress es requerido cuando el tipo de entrega es punto de retiro',
              400,
              'fail',
              true,
              { code: 'MISSING_PICKUP_POINT_ADDRESS' },
            );
          }

          // Crear dirección con isDefault: true
          const createdAddress = await Address.create(
            [
              {
                userId,
                firstName: addressData.firstName,
                lastName: addressData.lastName,
                email: addressData.email,
                phoneNumber: addressData.phoneNumber,
                dni: addressData.dni,
                city: addressData.city,
                state: addressData.state,
                postalCode: addressData.postalCode,
                ...(addressData.companyName && { companyName: addressData.companyName }),
                ...(addressData.cuit && { cuit: addressData.cuit }),
                ...(addressData.streetAddress && { streetAddress: addressData.streetAddress }),
                ...(addressData.shippingCompany && { shippingCompany: addressData.shippingCompany }),
                ...(addressData.declaredShippingAmount && {
                  declaredShippingAmount: addressData.declaredShippingAmount,
                }),
                ...(addressData.deliveryWindow && { deliveryWindow: addressData.deliveryWindow }),
                deliveryType,
                ...(addressData.pickupPointAddress && { pickupPointAddress: addressData.pickupPointAddress }),
                isDefault: true,
              },
            ],
            { session },
          );

          addressDoc = createdAddress[0];

          logger.info('Dirección creada exitosamente junto con usuario', {
            userId: userId.toString(),
            addressId: addressDoc._id.toString(),
          });
        }

        return { userId, addressDoc };
      });

      // Obtener usuario creado sin password
      const newUser = await User.findById(result.userId).select('-password').lean();
      if (!newUser) {
        logger.error('Usuario no encontrado después de creación por admin', {
          userId: result.userId,
        });
        throw new AppError('Error interno del servidor', 500, 'error', true);
      }

      logger.info('Usuario creado exitosamente por admin', {
        userId: newUser._id,
        email: newUser.email,
        displayName: newUser.displayName,
        withAddress: !!result.addressDoc,
      });

      const response: RegisterResponseDto & { address?: IAddressDocument } = {
        id: newUser._id.toString(),
        email: newUser.email,
        displayName: newUser.displayName,
        ...(newUser.firstName && { firstName: newUser.firstName }),
        ...(newUser.lastName && { lastName: newUser.lastName }),
        ...(newUser.dni && { dni: newUser.dni }),
        ...(newUser.cuit && { cuit: newUser.cuit }),
        ...(newUser.phone && { phone: newUser.phone }),
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      // Agregar dirección a la respuesta si se creó
      if (result.addressDoc) {
        response.address = result.addressDoc;
      }

      return response;
    } catch (err) {
      logger.error('Error en AuthService.createUserByAdmin', {
        error: err,
        input: { email: data.email, hasAddress: !!data.address },
      });
      throw err;
    }
  }

  public async register(
    userData: RegisterRequestDto,
    session: session.Session & Partial<session.SessionData>,
  ): Promise<RegisterResponseDto> {
    try {
      const { email, password, confirmPassword } = userData;
      if (password !== confirmPassword) {
        logger.warn('Las contraseñas no coinciden en el registro', { email });
        throw new AppError('Las contraseñas no coinciden', 400, 'fail', true, {
          code: 'PASSWORDS_DO_NOT_MATCH',
          fields: {
            password: ['Las contraseñas no coinciden'],
            confirmPassword: ['Las contraseñas no coinciden'],
          },
        });
      }

      const normalizedEmail = email.toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
      }).lean();
      if (existingUser) {
        logger.warn('Intento de registro con correo ya registrado', {
          email: normalizedEmail,
        });

        throw new AppError('El correo ya está registrado', 409, 'fail', true, {
          code: 'USER_EXISTS',
          fields: { email: ['El correo ya está en uso'] },
        });
      }

      // DisplayName se genera a partir del email
      const emailName = normalizedEmail.split('@')[0];
      const displayName = capitalizeFirstLetter(emailName);

      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
      });

      const newUserDoc = await User.create({
        email: normalizedEmail,
        displayName: displayName,
        password: hashedPassword,
        // role y status se toman de los defaults definidos en el modelo
      });

      const newUser = await User.findById(newUserDoc._id).select('-password').lean();

      if (!newUser) {
        logger.error('Error inesperado: Usuario no encontrado después de creación', {
          userId: newUserDoc._id,
        });

        throw new AppError('Error interno del servidor', 500, 'error', true);
      }

      setSessionUser(session, {
        _id: newUser._id.toString(),
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        status: newUser.status,
      });

      logger.info('Usuario registrado exitosamente', {
        userId: newUser._id,
        email: newUser.email,
        displayName: newUser.displayName,
      });

      return {
        id: newUser._id.toString(),
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };
    } catch (err) {
      logger.error('Error en AuthService.register', {
        error: err,
        input: userData,
      });
      throw err;
    }
  }

  public async login(
    loginData: LoginRequestDto,
    session: session.Session & Partial<session.SessionData>,
  ): Promise<LoginResponseDto> {
    try {
      const { email, password } = loginData;
      const normalizedEmail = email.toLowerCase();

      const userWithPassword = await User.findOne({ email: normalizedEmail });

      if (!userWithPassword) {
        logger.warn('Intento de login con email no registrado', {
          email: normalizedEmail,
        });

        throw new AppError('Usuario no encontrado', 404, 'fail', true, {
          code: 'USER_NOT_FOUND',
        });
      }

      let isPasswordValid = false;

      if (isArgon2Hash(userWithPassword.password)) {
        // Hash moderno → verificar con argon2
        isPasswordValid = await argon2.verify(userWithPassword.password, password);
      } else if (isModernWpHash(userWithPassword.password)) {
        // Hash moderno de WordPress
        isPasswordValid = await verifyModernWpPassword(password, userWithPassword.password);

        if (isPasswordValid) {
          // Si validó OK → rehash a argon2
          const newArgon2Hash = await argon2.hash(password, {
            type: argon2.argon2id,
          });
          userWithPassword.password = newArgon2Hash;
          await userWithPassword.save();

          logger.info('Password actualizada a argon2 tras login exitoso', {
            userId: userWithPassword._id,
            email: userWithPassword.email,
          });
        }
      }

      if (!isPasswordValid) {
        logger.warn('Contraseña incorrecta en login', {
          email: normalizedEmail,
        });

        throw new AppError('Contraseña incorrecta', 401, 'fail', true, {
          code: 'INVALID_PASSWORD',
        });
      }

      // Actualizar lastLogin al hacer login
      await User.findByIdAndUpdate(userWithPassword._id, {
        lastLogin: new Date(),
      });

      const user = await User.findById(userWithPassword._id).select('-password').lean();

      if (!user) {
        logger.error('Error inesperado: usuario no encontrado después de validación', {
          userId: userWithPassword._id,
        });

        throw new AppError('Error interno del servidor', 500, 'error', true);
      }

      setSessionUser(session, {
        _id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.dni && { dni: user.dni }),
        ...(user.cuit && { cuit: user.cuit }),
        ...(user.phone && { phone: user.phone }),
        role: user.role,
        status: user.status,
      });

      logger.info('Usuario inició sesión', {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.dni && { dni: user.dni }),
        ...(user.cuit && { cuit: user.cuit }),
        ...(user.phone && { phone: user.phone }),
        role: user.role,
        status: user.status,
      });

      return {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.dni && { dni: user.dni }),
        ...(user.cuit && { cuit: user.cuit }),
        ...(user.phone && { phone: user.phone }),
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (err) {
      logger.error('Error en AuthService.login', {
        error: err,
        input: loginData,
      });
      throw err;
    }
  }

  public async loginAdmin(
    loginData: LoginRequestDto,
    session: session.Session & Partial<session.SessionData>,
  ): Promise<LoginResponseDto> {
    try {
      const { email, password } = loginData;
      const normalizedEmail = email.toLowerCase();

      const userWithPassword = await User.findOne({ email: normalizedEmail });

      if (!userWithPassword) {
        logger.warn('Intento de login admin con email no registrado', {
          email: normalizedEmail,
        });

        throw new AppError('Usuario no encontrado', 404, 'fail', true, {
          code: 'USER_NOT_FOUND',
        });
      }

      if (userWithPassword.role !== UserRole.Admin) {
        logger.warn('Intento de login admin con usuario no admin', {
          email: normalizedEmail,
          role: userWithPassword.role,
        });

        throw new AppError('Acceso restringido solo para administradores', 403, 'fail', true, {
          code: 'NOT_ADMIN',
        });
      }

      const isPasswordValid = await argon2.verify(userWithPassword.password, password);
      if (!isPasswordValid) {
        logger.warn('Contraseña incorrecta en login admin', {
          email: normalizedEmail,
        });

        throw new AppError('Contraseña incorrecta', 401, 'fail', true, {
          code: 'INVALID_PASSWORD',
        });
      }

      // Actualizar lastLogin al hacer login admin
      await User.findByIdAndUpdate(userWithPassword._id, {
        lastLogin: new Date(),
      });

      const user = await User.findById(userWithPassword._id).select('-password').lean();

      if (!user) {
        logger.error('Error inesperado: usuario admin no encontrado después de validación', {
          userId: userWithPassword._id,
        });

        throw new AppError('Error interno del servidor', 500, 'error', true);
      }

      setSessionUser(session, {
        _id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.dni && { dni: user.dni }),
        ...(user.cuit && { cuit: user.cuit }),
        ...(user.phone && { phone: user.phone }),
        role: user.role,
        status: user.status,
      });

      logger.info('Administrador inició sesión', {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.dni && { dni: user.dni }),
        ...(user.cuit && { cuit: user.cuit }),
        ...(user.phone && { phone: user.phone }),
        role: user.role,
        status: user.status,
      });

      return {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.dni && { dni: user.dni }),
        ...(user.cuit && { cuit: user.cuit }),
        ...(user.phone && { phone: user.phone }),
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (err) {
      logger.error('Error en AuthService.loginAdmin', {
        error: err,
        input: loginData,
      });
      throw err;
    }
  }

  /**
   * Solicita el reseteo de contraseña: genera y retorna el token (en producción, deberías enviarlo por email)
   */
  public async requestPasswordReset(email: string): Promise<string> {
    try {
      const normalizedEmail = email.toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        logger.info('Solicitud de reseteo de contraseña para email no registrado', {
          email: normalizedEmail,
        });
        // No revelar si el usuario existe o no
        return 'ok';
      }

      // Invalidar cualquier token previo
      user.passwordResetToken = undefined;
      user.passwordResetTokenUsed = false;

      const token = generateResetPasswordToken({
        userId: user._id.toString(),
        email: user.email,
      });
      // Guardar el hash del token y marcarlo como no usado
      user.passwordResetToken = hashToken(token);
      user.passwordResetTokenUsed = false;
      await user.save();

      // Enviar email de reseteo usando template handlebars
      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: user.email,
        subject: 'Restablece tu contraseña',
        html: await renderResetPasswordEmail({
          displayName: user.displayName || user.email,
          resetUrl,
        }),
      });

      logger.info('Solicitud de reseteo de contraseña exitosa', {
        userId: user._id,
        email: user.email,
      });

      return token;
    } catch (err) {
      logger.error('Error en AuthService.requestPasswordReset', {
        error: err,
        input: email,
      });
      throw new AppError('No se pudo procesar la solicitud de reseteo de contraseña', 500, 'error', true);
    }
  }

  /**
   * Cambia la contraseña usando el token de reset e inicia sesión
   */
  public async resetPassword(
    token: string,
    newPassword: string,
    session?: session.Session & Partial<session.SessionData>,
  ): Promise<LoginResponseDto | void> {
    let payload: ResetPasswordTokenPayload;
    try {
      payload = verifyResetPasswordToken(token);
    } catch (err) {
      logger.warn('Token de reseteo inválido o expirado', {
        token,
        error: err,
      });
      throw new AppError('Token inválido o expirado', 400, 'fail', true, {
        code: 'INVALID_TOKEN',
      });
    }
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'fail', true, {
        code: 'USER_NOT_FOUND',
      });
    }
    // Verifica que el hash del token coincida y no haya sido usado
    const tokenHash = hashToken(token);
    if (!user.passwordResetToken || user.passwordResetTokenUsed || user.passwordResetToken !== tokenHash) {
      throw new AppError('El token ya fue usado o no es válido.', 400, 'fail', true, { code: 'TOKEN_USED_OR_INVALID' });
    }
    // Verifica que el token no sea anterior al último reseteo de contraseña
    if (user.passwordResetAt) {
      const decoded = jwtDecode(token) as JwtPayload | null;
      if (!decoded || typeof decoded.iat !== 'number') {
        throw new AppError('Token inválido', 400, 'fail', true, {
          code: 'INVALID_TOKEN',
        });
      }
      if (user.passwordResetAt.getTime() > decoded.iat * 1000) {
        throw new AppError(
          'El token ya no es válido porque la contraseña fue cambiada recientemente.',
          400,
          'fail',
          true,
          { code: 'TOKEN_USED_OR_OLD' },
        );
      }
    }
    user.password = await argon2.hash(newPassword, { type: argon2.argon2id });
    user.passwordResetAt = new Date();
    user.passwordResetTokenUsed = true;
    user.passwordResetToken = undefined;
    await user.save();

    // Iniciar sesión automáticamente si se pasa la sesión
    if (session) {
      const userData = await User.findById(user._id).select('-password').lean();
      if (userData) {
        setSessionUser(session, {
          _id: userData._id.toString(),
          email: userData.email,
          displayName: userData.displayName,
          ...(userData.firstName && { firstName: userData.firstName }),
          ...(userData.lastName && { lastName: userData.lastName }),
          ...(userData.dni && { dni: userData.dni }),
          ...(userData.cuit && { cuit: userData.cuit }),
          ...(userData.phone && { phone: userData.phone }),
          role: userData.role,
          status: userData.status,
        });
        return {
          id: userData._id.toString(),
          email: userData.email,
          displayName: userData.displayName,
          ...(userData.firstName && { firstName: userData.firstName }),
          ...(userData.lastName && { lastName: userData.lastName }),
          ...(userData.dni && { dni: userData.dni }),
          ...(userData.cuit && { cuit: userData.cuit }),
          ...(userData.phone && { phone: userData.phone }),
          role: userData.role,
          status: userData.status,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        };
      }
    }
  }
}
