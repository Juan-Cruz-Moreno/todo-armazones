import { Router } from 'express';
import { MaintenanceController } from '@controllers/maintenance.controller';
import { validateRequest } from '@middlewares/validate-request';
import { updateMaintenanceBodySchema } from '@schemas/maintenance.schema';

const router: Router = Router();

const maintenanceController: MaintenanceController = new MaintenanceController();

router.get('/', maintenanceController.getMaintenance);
router.put('/', validateRequest({ body: updateMaintenanceBodySchema }), maintenanceController.updateMaintenance);

export default router;
