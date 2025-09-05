import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '@services/catalog.service';
import { GenerateCatalogRequestDto } from '@dto/catalog.dto';
import { ApiResponse } from '../types/response';
import logger from '@config/logger';

export class CatalogController {
  private catalogService: CatalogService = new CatalogService();

  public generateCatalog = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const catalogData: GenerateCatalogRequestDto = req.body;
      const logoFile = req.file; // Archivo de logo subido

      const result = await this.catalogService.generateCatalog(catalogData, logoFile);

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          pdfUrl: result.pdfUrl,
          fileName: result.fileName,
        },
      });
    } catch (error) {
      logger.error('Error en CatalogController.generateCatalog', { error, body: req.body });
      next(error);
    }
  };
}
