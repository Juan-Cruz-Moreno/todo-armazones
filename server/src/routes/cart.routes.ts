import { Router } from 'express';
import { CartController } from '@controllers/cart.controller';
import { validateRequest } from '@middlewares/validate-request';
import {
  addItemToCartSchema,
  decrementItemQuantitySchema,
  incrementItemQuantitySchema,
  removeItemFromCartSchema,
} from 'schemas/cart.schema';

const router: Router = Router();

const cartController: CartController = new CartController();

router.get('/', cartController.getCart);
router.post('/add-item', validateRequest({ body: addItemToCartSchema }), cartController.addItemToCart);
router.patch(
  '/increment-item',
  validateRequest({ body: incrementItemQuantitySchema }),
  cartController.increaseItemInCart,
);
router.patch(
  '/decrement-item',
  validateRequest({ body: decrementItemQuantitySchema }),
  cartController.decreaseItemInCart,
);
router.post('/remove-item', validateRequest({ body: removeItemFromCartSchema }), cartController.removeItemFromCart);

export default router;
