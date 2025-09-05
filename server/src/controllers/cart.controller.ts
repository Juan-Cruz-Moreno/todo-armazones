import logger from '@config/logger';
import {
  AddItemToCartRequestDto,
  DecrementItemQuantityRequestDto,
  IncrementItemQuantityRequestDto,
  RemoveItemFromCartRequestDto,
} from '@dto/cart.dto';
import { CartService } from '@services/cart.service';
import { AppError } from '@utils/AppError';
import { getSessionUserId } from '@utils/sessionUtils';
import { Request, Response } from 'express';
import { ApiResponse } from '../types/response';

export class CartController {
  private cartService: CartService = new CartService();

  public getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const cart = await this.cartService.getCart(userId);
      const response: ApiResponse = {
        status: 'success',
        data: cart,
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      logger.error('Error fetching cart:', { error });
      if (error instanceof AppError) {
        const response: ApiResponse = {
          status: error.status,
          message: error.message,
          ...(error.details && { details: error.details }),
        };
        res.status(error.statusCode).json(response);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        const response: ApiResponse = {
          status: appError.status,
          message: appError.message,
        };
        res.status(appError.statusCode).json(response);
      }
    }
  };

  public addItemToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const dto: AddItemToCartRequestDto = {
        ...req.body,
        quantity: req.body.quantity ?? 1,
      };
      const result = await this.cartService.addItemToCart(userId, dto);
      const response: ApiResponse = {
        status: 'success',
        data: result,
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      logger.error('Error adding item to cart:', { error });
      if (error instanceof AppError) {
        const response: ApiResponse = {
          status: error.status,
          message: error.message,
          ...(error.details && { details: error.details }),
        };
        res.status(error.statusCode).json(response);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        const response: ApiResponse = {
          status: appError.status,
          message: appError.message,
        };
        res.status(appError.statusCode).json(response);
      }
    }
  };

  public increaseItemInCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const dto: IncrementItemQuantityRequestDto = req.body;
      const updatedCart = await this.cartService.incrementItemInCart(userId, dto);
      const response: ApiResponse = {
        status: 'success',
        data: updatedCart,
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      logger.error('Error increasing item quantity in cart:', { error });
      if (error instanceof AppError) {
        const response: ApiResponse = {
          status: error.status,
          message: error.message,
          ...(error.details && { details: error.details }),
        };
        res.status(error.statusCode).json(response);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        const response: ApiResponse = {
          status: appError.status,
          message: appError.message,
        };
        res.status(appError.statusCode).json(response);
      }
    }
  };

  public decreaseItemInCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const dto: DecrementItemQuantityRequestDto = req.body;
      const updatedCart = await this.cartService.decrementItemInCart(userId, dto);
      const response: ApiResponse = {
        status: 'success',
        data: updatedCart,
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      logger.error('Error decreasing item quantity in cart:', { error });
      if (error instanceof AppError) {
        const response: ApiResponse = {
          status: error.status,
          message: error.message,
          ...(error.details && { details: error.details }),
        };
        res.status(error.statusCode).json(response);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        const response: ApiResponse = {
          status: appError.status,
          message: appError.message,
        };
        res.status(appError.statusCode).json(response);
      }
    }
  };

  public removeItemFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const dto: RemoveItemFromCartRequestDto = req.body;
      const updatedCart = await this.cartService.removeItemFromCart(userId, dto);
      const response: ApiResponse = {
        status: 'success',
        data: updatedCart,
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      logger.error('Error removing item from cart:', { error });
      if (error instanceof AppError) {
        const response: ApiResponse = {
          status: error.status,
          message: error.message,
          ...(error.details && { details: error.details }),
        };
        res.status(error.statusCode).json(response);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        const response: ApiResponse = {
          status: appError.status,
          message: appError.message,
        };
        res.status(appError.statusCode).json(response);
      }
    }
  };
}
