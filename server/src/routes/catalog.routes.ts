import { Router } from 'express';
import { CatalogController } from '@controllers/catalog.controller';
import { upload } from '@config/multer';
import { validateRequest } from '@middlewares/validate-request';
import { GenerateCatalogRequestSchema } from '../schemas/catalog.schema';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getSocketMetrics } from '../socket/socketManager';

const router = Router();
const catalogController = new CatalogController();

/**
 * POST /catalog/generate
 * Inicia la generación de un catálogo en PDF y retorna un roomId para seguimiento en tiempo real
 * - Acepta un archivo de logo opcional
 * - Body: GenerateCatalogRequestDto
 */
router.post(
  '/generate',
  upload.single('logo'), // Campo opcional para el logo
  validateRequest(GenerateCatalogRequestSchema),
  catalogController.generateCatalog,
);

/**
 * GET /catalog/download/:fileName
 * Descarga el PDF generado una vez completado
 */
router.get('/download/:fileName', (req: Request, res: Response) => {
  const { fileName } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', fileName);

  // Verificar que el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.sendFile(filePath);
});

/**
 * GET /catalog/metrics
 * Obtiene métricas básicas de sockets (para monitoreo)
 */
router.get('/metrics', (_req: Request, res: Response) => {
  const metrics = getSocketMetrics();
  res.json(metrics);
});

export default router;
