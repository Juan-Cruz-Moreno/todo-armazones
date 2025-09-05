import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes'; // Assuming user routes are under auth
import dollarRoutes from './dollar.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import categoryRoutes from './category.routes';
import subcategoryRoutes from './subcategory.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import expenseRoutes from './expense.routes';
import analyticsRoutes from './analytics.routes';
import catalogRoutes from './catalog.routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dollar', dollarRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/catalog', catalogRoutes);

export default router;
