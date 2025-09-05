import { Router } from 'express';
import { SubcategoryController } from '../controllers/subcategory.controller';
import { validateRequest } from '@middlewares/validate-request';
import { createSubcategorySchema } from 'schemas/subcategory.schema';

const router: Router = Router();

const subcategoryController = new SubcategoryController();

router.post('/', validateRequest({ body: createSubcategorySchema }), subcategoryController.createSubcategory);

export default router;
