import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validateRequest } from '@middlewares/validate-request';
import { createCategorySchema } from 'schemas/category.schema';

const router: Router = Router();

const categoryController = new CategoryController();

router.post('/', validateRequest({ body: createCategorySchema }), categoryController.createCategory);

export default router;
