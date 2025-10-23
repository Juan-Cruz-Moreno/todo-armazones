import { UpdateQuery } from 'mongoose';
import Maintenance, { IMaintenanceDocument } from '@models/Maintenance';
import { maintenanceResponseDTO, updateMaintenanceDTO } from '@dto/maintenance.dto';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';

export class MaintenanceService {
  public async getMaintenance(): Promise<maintenanceResponseDTO> {
    const maintenance = await Maintenance.findOne();

    if (!maintenance) {
      // Si no existe, crear uno por defecto
      const newMaintenance = await Maintenance.create({ active: false, image: 1 });
      logger.info('Nuevo registro de mantenimiento creado por defecto');
      return {
        active: newMaintenance.active,
        image: newMaintenance.image,
        title: newMaintenance.title,
        subtitle: newMaintenance.subtitle,
        updatedAt: newMaintenance.updatedAt,
      };
    }

    return {
      active: maintenance.active,
      image: maintenance.image,
      title: maintenance.title,
      subtitle: maintenance.subtitle,
      updatedAt: maintenance.updatedAt,
    };
  }

  public async updateMaintenance(dto: updateMaintenanceDTO): Promise<maintenanceResponseDTO> {
    const maintenance = await Maintenance.findOne();

    if (!maintenance) {
      // Crear uno nuevo con los valores proporcionados o por defecto
      const newMaintenance = await Maintenance.create({
        active: dto.active ?? false,
        image: dto.image ?? 1,
      });
      logger.info('Nuevo registro de mantenimiento creado y actualizado');
      return {
        active: newMaintenance.active,
        image: newMaintenance.image,
        title: newMaintenance.title,
        subtitle: newMaintenance.subtitle,
        updatedAt: newMaintenance.updatedAt,
      };
    }

    // Actualizar solo los campos proporcionados
    const updateObj: UpdateQuery<IMaintenanceDocument> = { $currentDate: { updatedAt: true } };
    const setObj: Partial<IMaintenanceDocument> = {};

    if (dto.active !== undefined) {
      setObj.active = dto.active;
    }
    if (dto.image !== undefined) {
      setObj.image = dto.image;
    }
    if (dto.title !== undefined) {
      setObj.title = dto.title;
    }
    if (dto.subtitle !== undefined) {
      setObj.subtitle = dto.subtitle;
    }

    if (Object.keys(setObj).length > 0) {
      updateObj.$set = setObj;
    }

    const updatedMaintenance = await Maintenance.findOneAndUpdate({}, updateObj, { new: true });

    if (!updatedMaintenance) {
      throw new AppError('Error al actualizar el mantenimiento', 500, 'error', false);
    }

    logger.info('Mantenimiento actualizado', {
      active: updatedMaintenance.active,
      image: updatedMaintenance.image,
    });

    return {
      active: updatedMaintenance.active,
      image: updatedMaintenance.image,
      title: updatedMaintenance.title,
      subtitle: updatedMaintenance.subtitle,
      updatedAt: updatedMaintenance.updatedAt,
    };
  }
}
