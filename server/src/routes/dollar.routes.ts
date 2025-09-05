import { Router } from 'express';
import { DollarController } from '@controllers/dollar.controller';
import { validateRequest } from '@middlewares/validate-request';
import { updateDollarConfigBodySchema } from '@schemas/dollar.schema';

const router: Router = Router();

const dollarController: DollarController = new DollarController();

router.get('/', dollarController.getDollar);
router.put('/update', dollarController.updateDollarValue);
router.patch('/config', validateRequest({ body: updateDollarConfigBodySchema }), dollarController.updateDollarConfig);

export default router;
