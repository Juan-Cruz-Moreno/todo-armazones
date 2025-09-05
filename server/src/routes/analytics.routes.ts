import { Router } from 'express';
import { AnalyticsController } from '@controllers/analytics.controller';
import { checkAdmin } from '@middlewares/authMiddleware';

const router: Router = Router();
const analyticsController = new AnalyticsController();

// Endpoints para analytics de órdenes (funcionalidad existente)
router.get('/orders', checkAdmin, analyticsController.getOrderAnalytics);

// Endpoints para analytics de usuarios (nueva funcionalidad simplificada)
router.get('/users-list', checkAdmin, analyticsController.getUsersAnalyticsList);
router.get('/users/:userId/detailed', checkAdmin, analyticsController.getUserDetailedAnalytics);

// Endpoints para analytics de stock
router.get('/stock/valuation', checkAdmin, analyticsController.getStockValuation);
router.get('/stock/by-product', checkAdmin, analyticsController.getStockAnalyticsByProduct);
router.get('/stock/low-stock-alerts', checkAdmin, analyticsController.getLowStockAlerts);
router.get('/stock/by-category', checkAdmin, analyticsController.getStockAnalyticsByCategory);
router.get('/stock/by-subcategory', checkAdmin, analyticsController.getStockAnalyticsBySubcategory);
router.get(
  '/stock/by-category-with-subcategories',
  checkAdmin,
  analyticsController.getStockAnalyticsByCategoryWithSubcategories,
);

export default router;
