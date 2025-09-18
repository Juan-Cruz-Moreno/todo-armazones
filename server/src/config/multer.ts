import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError';

// Carpeta de destino
const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Configuración con límites de archivo
const limits = {
  fileSize: 15 * 1024 * 1024, // 15MB máximo por archivo
  files: 50, // Máximo 50 archivos por request
};

// Filtro de archivos para validar tipos MIME
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WebP)'));
  }
};

// Middleware para manejar errores de multer
const handleMulterError = (error: Error | multer.MulterError, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('El archivo es demasiado grande. Máximo 15MB por archivo.', 400, 'fail', false));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Demasiados archivos. Máximo 50 archivos por solicitud.', 400, 'fail', false));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Tipo de archivo no permitido.', 400, 'fail', false));
    }
  }

  // Si es un error de tipo de archivo personalizado
  if (error.message && error.message.includes('Solo se permiten archivos de imagen')) {
    return next(new AppError(error.message, 400, 'fail', false));
  }

  next(error);
};

export const upload = multer({
  storage,
  limits,
  fileFilter,
});

// Exportar el middleware de manejo de errores
export { handleMulterError };
