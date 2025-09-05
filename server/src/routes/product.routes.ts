import { Router } from 'express';
import { ProductController } from '@controllers/product.controller';
import { upload } from '@config/multer';
import { checkAdmin } from '@middlewares/authMiddleware';
import { validateRequest } from '@middlewares/validate-request';
import { bulkPriceUpdateSchema } from '@schemas/bulk-price-update.schema';

const router: Router = Router();
const productController: ProductController = new ProductController();

router.post('/', checkAdmin, upload.any(), productController.createProductWithVariants);
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);

// Nueva ruta para actualización masiva de precios
router.patch(
  '/bulk-update-prices',
  checkAdmin,
  validateRequest({ body: bulkPriceUpdateSchema }),
  productController.bulkUpdatePrices,
);

router.get('/:slug', productController.getProductVariantsByProductSlug);
router.patch('/:productId', checkAdmin, upload.any(), productController.updateProductWithVariants);

export default router;
