import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '@services/catalog.service';
import { GenerateCatalogRequestDto } from '@dto/catalog.dto';
import { ApiResponse } from '../types/response';
import logger from '@config/logger';
import { randomUUID } from 'crypto';
import { getCatalogIo } from '../socket/socketManager';

export class CatalogController {
  private catalogService: CatalogService = new CatalogService();

  public generateCatalog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const catalogData: GenerateCatalogRequestDto = req.body;
      const logoFile = req.file; // Archivo de logo subido
      const roomId = randomUUID(); // Generar ID único para el room

      // Iniciar generación en background
      this.catalogService.generateCatalog(catalogData, logoFile, roomId).catch((error) => {
        logger.error('Error en generación de catálogo', { error, roomId, stack: error.stack });
        const catalogIo = getCatalogIo();
        if (catalogIo) {
          catalogIo
            .to(roomId)
            .emit('catalog-error', { message: 'Error generating catalog', error: error.message }, (ack: unknown) => {
              if (ack) logger.info(`ACK received for error in room ${roomId}`);
            });
        }
      });

      // Retornar roomId para que el frontend se conecte
      const response: ApiResponse<{ roomId: string }> = {
        status: 'success',
        message: 'Catalog generation started',
        data: { roomId },
      };
      res.json(response);
    } catch (error) {
      logger.error('Error en CatalogController.generateCatalog', { error, body: req.body });
      next(error);
    }
  };
}
