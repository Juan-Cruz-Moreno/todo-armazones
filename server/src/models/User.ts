import { IUser } from '@interfaces/user';
import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, UserStatus } from '@enums/user.enum';

// Interfaz que extiende Document para incluir las propiedades de IUser
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  passwordResetAt?: Date;
}

// Definición del esquema de Mongoose correspondiente a IUser
const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    displayName: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    dni: { type: String },
    cuit: { type: String },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.User,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      required: true,
      default: UserStatus.Active,
    },
    lastLogin: { type: Date },
    passwordResetAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetTokenUsed: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Agrega campos createdAt y updatedAt automáticamente
  },
);

// Creación del modelo de Mongoose
const User = model<IUserDocument>('User', userSchema);

// Agregar índice compuesto de texto para búsquedas eficientes en campos de nombre
userSchema.index({ firstName: 'text', lastName: 'text', displayName: 'text' });

export default User;
