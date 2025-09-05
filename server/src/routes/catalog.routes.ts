import { Router } from 'express';
import { CatalogController } from '@controllers/catalog.controller';
import { upload } from '@config/multer';
import { validateRequest } from '@middlewares/validate-request';
import { GenerateCatalogRequestSchema } from '../schemas/catalog.schema';

const router = Router();
const catalogController = new CatalogController();

/**
 * POST /catalog/generate
 * Genera un catálogo en PDF y lo envía por email
 * - Requiere un email válido para el envío
 * - Acepta un archivo de logo opcional
 * - Body: GenerateCatalogRequestDto (incluyendo email)
 */
router.post(
  '/generate',
  upload.single('logo'), // Campo opcional para el logo
  validateRequest(GenerateCatalogRequestSchema),
  catalogController.generateCatalog,
);

export default router;
