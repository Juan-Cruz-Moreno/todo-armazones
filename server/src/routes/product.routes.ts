import { Router } from 'express';
import { ProductController } from '@controllers/product.controller';
import { upload, handleMulterError } from '@config/multer';
import { checkAdmin } from '@middlewares/authMiddleware';
import { validateRequest } from '@middlewares/validate-request';
import { parseJsonFields } from '@middlewares/parse-json-fields';
import { bulkPriceUpdateSchema } from '@schemas/bulk-price-update.schema';
import { createProductWithVariantsSchema, updateProductWithVariantsSchema } from '@schemas/product.schema';

const router: Router = Router();
const productController: ProductController = new ProductController();

router.post(
  '/',
  checkAdmin,
  upload.any(),
  handleMulterError,
  parseJsonFields(['product', 'variants']),
  validateRequest({ body: createProductWithVariantsSchema }),
  productController.createProductWithVariants,
);
router.get('/', productController.getProducts);
router.get('/by-page', productController.getProductsByPage);
router.get('/pagination-info', productController.getProductsPaginationInfo);
router.get('/search', productController.searchProducts);

// Nueva ruta para actualización masiva de precios
router.patch(
  '/bulk-update-prices',
  checkAdmin,
  validateRequest({ body: bulkPriceUpdateSchema }),
  productController.bulkUpdatePrices,
);

router.get('/:slug', productController.getProductVariantsByProductSlug);
router.patch(
  '/:productId',
  checkAdmin,
  upload.any(),
  handleMulterError,
  parseJsonFields(['product', 'variants']),
  validateRequest({ body: updateProductWithVariantsSchema }),
  productController.updateProductWithVariants,
);

export default router;
