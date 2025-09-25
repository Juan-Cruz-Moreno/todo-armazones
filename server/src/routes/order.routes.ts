import { Router } from 'express';
import { OrderController } from '@controllers/order.controller';
import { validateRequest } from '@middlewares/validate-request';
import { checkAdmin } from '@middlewares/authMiddleware';
import {
  createOrderBodySchema,
  createOrderAdminBodySchema,
  getAllOrdersParamsSchema,
  updateOrderParamsSchema,
  updateOrderBodySchema,
  bulkUpdateOrderStatusBodySchema,
  checkStockAvailabilityParamsSchema,
  updateOrderStatusWithConflictsBodySchema,
  applyRefundParamsSchema,
  applyRefundBodySchema,
  cancelRefundParamsSchema,
} from 'schemas/order.schema';
import { updateItemPricesBodySchema } from 'schemas/updateItemPrices.schema';

const router: Router = Router();

const orderController: OrderController = new OrderController();

router.post('/', validateRequest({ body: createOrderBodySchema }), orderController.createOrder);
router.post(
  '/admin',
  checkAdmin,
  validateRequest({ body: createOrderAdminBodySchema }),
  orderController.createOrderAsAdmin,
);
router.get('/', validateRequest({ query: getAllOrdersParamsSchema }), orderController.getOrdersByUserId);
router.get(
  '/all',
  validateRequest({
    query: getAllOrdersParamsSchema,
  }),
  orderController.getAllOrders,
);

router.patch(
  '/bulk-status',
  checkAdmin,
  validateRequest({ body: bulkUpdateOrderStatusBodySchema }),
  orderController.bulkUpdateOrderStatus,
);

router.get('/:orderId', orderController.getOrderById);

router.patch(
  '/:orderId',
  validateRequest({
    params: updateOrderParamsSchema,
    body: updateOrderBodySchema,
  }),
  orderController.updateOrder,
);

// Ruta de conveniencia para actualizar solo precios
router.patch(
  '/:orderId/update-prices',
  validateRequest({
    params: updateOrderParamsSchema,
    body: updateItemPricesBodySchema,
  }),
  orderController.updateItemPrices,
);

router.get('/:orderId/pdf', orderController.getOrderPDF);

// Rutas para verificación de stock
router.get(
  '/:orderId/stock-availability',
  validateRequest({
    params: checkStockAvailabilityParamsSchema,
  }),
  orderController.checkOrderStockAvailability,
);
router.patch(
  '/:orderId/status-with-conflicts',
  validateRequest({
    params: updateOrderParamsSchema,
    body: updateOrderStatusWithConflictsBodySchema,
  }),
  orderController.updateOrderStatusWithConflictHandling,
);

// Rutas para reembolsos (solo admin)
router.post(
  '/:orderId/refund',
  checkAdmin,
  validateRequest({
    params: applyRefundParamsSchema,
    body: applyRefundBodySchema,
  }),
  orderController.applyRefund,
);

router.get(
  '/:orderId/refund',
  validateRequest({
    params: applyRefundParamsSchema,
  }),
  orderController.getRefundDetails,
);

router.get(
  '/:orderId/refund/eligibility',
  validateRequest({
    params: applyRefundParamsSchema,
  }),
  orderController.canApplyRefund,
);

// Cancelar reembolso (solo admin)
router.delete(
  '/:orderId/refund',
  checkAdmin,
  validateRequest({
    params: cancelRefundParamsSchema,
  }),
  orderController.cancelRefund,
);

// Verificar si se puede cancelar el reembolso
router.get(
  '/:orderId/refund/cancel-eligibility',
  validateRequest({
    params: cancelRefundParamsSchema,
  }),
  orderController.canCancelRefund,
);

export default router;
