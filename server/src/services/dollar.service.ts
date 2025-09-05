import axios from 'axios';
import Dollar from '@models/Dollar';
import { dollarResponseDTO, updateDollarAddedValueDTO } from '@dto/dollar.dto';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';

export class DollarService {
  private bluelyticsUrl = 'https://api.bluelytics.com.ar/v2/latest';
  private dolarApiUrl = 'https://dolarapi.com/v1/dolares/blue';

  private async fetchDollarBaseValue(): Promise<{
    baseValue: number;
    source: 'bluelytics' | 'dolarapi';
    apiUpdatedAt: Date;
  }> {
    try {
      const { data } = await axios.get(this.bluelyticsUrl, { timeout: 5000 });
      logger.info('Cotización obtenida de Bluelytics', {
        value: data?.blue?.value_sell,
      });
      return {
        baseValue: data?.blue?.value_sell,
        source: 'bluelytics',
        apiUpdatedAt: new Date(data?.last_update),
      };
    } catch (err) {
      logger.warn('Fallo Bluelytics, intentando con DolarApi...', {
        error: err,
      });
      try {
        const { data } = await axios.get(this.dolarApiUrl, { timeout: 5000 });
        logger.info('Cotización obtenida de DolarApi', { value: data?.venta });
        return {
          baseValue: data?.venta,
          source: 'dolarapi',
          apiUpdatedAt: new Date(data?.fechaActualizacion),
        };
      } catch (err2) {
        logger.error('Fallo también DolarApi', { error: err2 });
        throw new AppError('No se pudo obtener la cotización del dólar', 503, 'error', true, {
          cause: 'Fallo en Bluelytics y DolarApi',
          hint: 'Verifica la conectividad con las APIs externas',
        });
      }
    }
  }

  private applyAddedValue(baseValue: number, addedValue: number, isPercentage: boolean): number {
    return isPercentage ? baseValue * (1 + addedValue / 100) : baseValue + addedValue;
  }

  public async updateDollarValue(): Promise<dollarResponseDTO> {
    const { baseValue, source, apiUpdatedAt } = await this.fetchDollarBaseValue();

    let dollar = await Dollar.findOne();

    if (!dollar) {
      dollar = new Dollar({
        baseValue,
        value: baseValue,
        addedValue: 0,
        isPercentage: false,
        source,
        apiUpdatedAt,
      });
      logger.info('Nuevo registro de dólar creado en la base de datos', {
        baseValue,
      });
    } else {
      if (dollar.baseValue === baseValue) {
        logger.info('El valor base obtenido es igual al almacenado. No se realizaron cambios.', {
          baseValue,
        });
        return {
          baseValue: dollar.baseValue,
          value: dollar.value,
          addedValue: dollar.addedValue,
          isPercentage: dollar.isPercentage,
          source: dollar.source,
          apiUpdatedAt: dollar.apiUpdatedAt,
          updatedAt: dollar.updatedAt,
        };
      }

      dollar.baseValue = baseValue;
      dollar.source = source;
      dollar.apiUpdatedAt = apiUpdatedAt;
      dollar.value = this.applyAddedValue(baseValue, dollar.addedValue, dollar.isPercentage);
    }

    await dollar.save();

    logger.info('Valor del dólar actualizado en la base de datos', {
      finalValue: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      source,
      apiUpdatedAt,
    });

    return {
      baseValue: dollar.baseValue,
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      source: dollar.source,
      apiUpdatedAt: dollar.apiUpdatedAt,
      updatedAt: dollar.updatedAt,
    };
  }

  public async updateDollarConfig(dto: updateDollarAddedValueDTO): Promise<dollarResponseDTO> {
    const dollar = await Dollar.findOne();

    if (!dollar) {
      logger.warn('Intento de configurar dólar sin registro en la base de datos');
      throw new AppError('No existe un registro de dólar en la base de datos', 404, 'error', true, {
        cause: 'No se ejecutó aún updateDollarValue',
        hint: 'Ejecuta primero la actualización desde las APIs externas',
      });
    }

    if (dollar.addedValue === dto.addedValue && dollar.isPercentage === dto.isPercentage) {
      logger.info('Los valores proporcionados son iguales a los almacenados. No se realizaron cambios.', {
        addedValue: dto.addedValue,
        isPercentage: dto.isPercentage,
      });
      return {
        baseValue: dollar.baseValue,
        value: dollar.value,
        addedValue: dollar.addedValue,
        isPercentage: dollar.isPercentage,
        source: dollar.source,
        apiUpdatedAt: dollar.apiUpdatedAt,
        updatedAt: dollar.updatedAt,
      };
    }

    dollar.addedValue = dto.addedValue;
    dollar.isPercentage = dto.isPercentage;

    // Evitamos consultar una nueva base: usamos la ya guardada
    dollar.value = this.applyAddedValue(dollar.baseValue, dto.addedValue, dto.isPercentage);

    await dollar.save();

    logger.info('Configuración del dólar actualizada', {
      addedValue: dto.addedValue,
      isPercentage: dto.isPercentage,
      finalValue: dollar.value,
    });

    return {
      baseValue: dollar.baseValue,
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      source: dollar.source,
      apiUpdatedAt: dollar.apiUpdatedAt,
      updatedAt: dollar.updatedAt,
    };
  }

  public async getDollar(): Promise<dollarResponseDTO> {
    const dollar = await Dollar.findOne();

    if (!dollar) {
      logger.warn('Intento de obtener dólar sin registro en la base de datos');
      throw new AppError('No existe un registro de dólar en la base de datos', 404, 'error', true, {
        cause: 'No se ejecutó aún updateDollarValue',
        hint: 'Ejecuta primero la actualización desde las APIs externas',
      });
    }

    logger.info('Valor del dólar obtenido de la base de datos', {
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
    });

    return {
      baseValue: dollar.baseValue,
      value: dollar.value,
      addedValue: dollar.addedValue,
      isPercentage: dollar.isPercentage,
      source: dollar.source,
      apiUpdatedAt: dollar.apiUpdatedAt,
      updatedAt: dollar.updatedAt,
    };
  }
}
