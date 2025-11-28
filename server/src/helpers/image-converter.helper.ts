import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import logger from '@config/logger';

/**
 * Detecta si un archivo es HEIF/HEIC basándose en su MIME type o extensión
 * @param file - Archivo de Multer
 * @returns true si es HEIF/HEIC
 */
export const isHeifFormat = (file: Express.Multer.File): boolean => {
  const heifMimeTypes = ['image/heif', 'image/heic', 'image/heif-sequence', 'image/heic-sequence'];
  const heifExtensions = ['.heif', '.heic'];

  const hasHeifMime = heifMimeTypes.includes(file.mimetype.toLowerCase());
  const hasHeifExtension = heifExtensions.includes(path.extname(file.originalname).toLowerCase());

  return hasHeifMime || hasHeifExtension;
};

/**
 * Convierte una imagen HEIF/HEIC a JPEG
 * @param inputPath - Ruta del archivo HEIF/HEIC original
 * @param quality - Calidad del JPEG (1-100, default: 90)
 * @returns Ruta del archivo JPEG convertido
 */
export const convertHeifToJpeg = async (inputPath: string, quality: number = 90): Promise<string> => {
  try {
    // Generar nombre del archivo de salida (reemplazar extensión por .jpg)
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.jpg`);

    // Convertir usando Sharp
    await sharp(inputPath)
      .rotate() // Rotar según EXIF (importante para HEIF de iPhones)
      .jpeg({ quality, mozjpeg: true }) // Usar mozjpeg para mejor compresión
      .toFile(outputPath);

    // Eliminar el archivo HEIF original
    await fs.unlink(inputPath);

    logger.info(`HEIF/HEIC convertido a JPEG: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);

    return outputPath;
  } catch (error) {
    logger.error('Error al convertir HEIF/HEIC a JPEG:', {
      inputPath,
      error: error instanceof Error ? error.message : error,
    });

    // Si falla la conversión, intentar eliminar el archivo original para evitar archivos corruptos
    try {
      await fs.unlink(inputPath);
    } catch (unlinkError) {
      logger.error('Error al eliminar archivo HEIF corrupto:', { inputPath, error: unlinkError });
    }

    throw new Error(
      `No se pudo convertir la imagen HEIF/HEIC: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    );
  }
};

/**
 * Procesa un archivo: si es HEIF/HEIC lo convierte a JPEG, sino lo retorna sin cambios
 * Actualiza la información del archivo de Multer con los nuevos datos
 * @param file - Archivo de Multer
 * @param quality - Calidad del JPEG (1-100, default: 90)
 * @returns Archivo actualizado con la nueva ruta si hubo conversión
 */
export const processImageFile = async (
  file: Express.Multer.File,
  quality: number = 90,
): Promise<Express.Multer.File> => {
  if (!isHeifFormat(file)) {
    return file; // No es HEIF, retornar sin cambios
  }

  try {
    // Convertir a JPEG
    const newPath = await convertHeifToJpeg(file.path, quality);

    // Actualizar información del archivo
    const newFilename = path.basename(newPath);
    const stats = await fs.stat(newPath);

    return {
      ...file,
      path: newPath,
      filename: newFilename,
      mimetype: 'image/jpeg',
      size: stats.size,
    };
  } catch (error) {
    throw new Error(`Error al procesar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Procesa múltiples archivos en paralelo
 * @param files - Array de archivos de Multer
 * @param quality - Calidad del JPEG (1-100, default: 90)
 * @returns Array de archivos procesados
 */
export const processImageFiles = async (
  files: Express.Multer.File[],
  quality: number = 90,
): Promise<Express.Multer.File[]> => {
  return Promise.all(files.map((file) => processImageFile(file, quality)));
};
