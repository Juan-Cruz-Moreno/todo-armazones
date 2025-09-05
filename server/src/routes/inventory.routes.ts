import { Router } from 'express';
import { InventoryController } from '@controllers/inventory.controller';
import { checkAdmin } from '@middlewares/authMiddleware';
import { validateRequest } from '@middlewares/validate-request';
import { createStockEntrySchema, createStockExitSchema } from '@schemas/inventory.schema';

const router: Router = Router();
const inventoryController: InventoryController = new InventoryController();

// Crear entrada de stock (solo admin)
router.post(
  '/stock-entry',
  checkAdmin,
  validateRequest({ body: createStockEntrySchema }),
  inventoryController.createStockEntry,
);

// Crear salida de stock (solo admin)
router.post(
  '/stock-exit',
  checkAdmin,
  validateRequest({ body: createStockExitSchema }),
  inventoryController.createStockExit,
);

// Obtener historial de movimientos de stock para una variante
router.get('/movements/:productVariantId', inventoryController.getStockMovementHistory);

// Obtener resumen de stock para todas las variantes de un producto
router.get('/summary/:productId', inventoryController.getProductStockSummary);

export default router;
