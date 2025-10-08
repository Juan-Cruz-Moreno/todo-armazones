import cron from 'node-cron';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import { DollarService } from '@services/dollar.service';
import { OrderService } from '@services/order.service';
import { ProductService } from '@services/product.service';

const dollarService: DollarService = new DollarService();
const orderService: OrderService = new OrderService();
const productService: ProductService = new ProductService();

// Programar la tarea para ejecutarse cada 30 minutos
cron.schedule('*/30 * * * *', async () => {
  try {
    logger.info('Iniciando tarea programada: Actualización del dólar');
    const dollarUpdated = await dollarService.updateDollarValue();
    logger.info('Tarea programada completada: Actualización del dólar');

    // Actualizar las órdenes solo si el dólar fue actualizado
    if (dollarUpdated.updated) {
      logger.info('Iniciando actualización de precios en ARS de variantes de productos con el nuevo valor del dólar');
      await productService.updateAllProductVariantsPriceARS();
      logger.info('Precios en ARS de variantes de productos actualizados con el nuevo valor del dólar');

      logger.info('Iniciando actualización de órdenes con el nuevo valor del dólar');
      await orderService.updateOrdersWithDollarValue();
      logger.info('Órdenes actualizadas con el nuevo valor del dólar');
    }

    // Migración única: actualizar itemsCount en todas las órdenes existentes
    logger.info('Iniciando migración única de itemsCount en todas las órdenes');
    const updatedOrdersCount = await orderService.updateAllOrdersItemsCount();
    logger.info('Migración de itemsCount completada', { updatedOrdersCount });
  } catch (error) {
    const appError = new AppError(
      'Error en la tarea programada: Actualización del dólar y órdenes',
      500,
      'error',
      true,
      {
        cause:
          'Fallo en la ejecución de updateDollarValue, updateAllProductVariantsPriceARS o updateOrdersWithDollarValue',
        context: { error },
      },
    );
    logger.error(appError.message, { error: appError });
  }
});

logger.info('Cron de actualización del dólar configurado.');
