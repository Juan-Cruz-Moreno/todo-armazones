import { Router } from 'express';
import { ExpenseController } from '@controllers/expense.controller';
import { checkAdmin } from '@middlewares/authMiddleware';

const router: Router = Router();
const expenseController: ExpenseController = new ExpenseController();

// Crear gasto manual (solo admin)
router.post('/', checkAdmin, expenseController.createManualExpense);

// Obtener gastos por mes
router.get('/:year/:month', expenseController.getMonthlyExpenses);

// Actualizar gasto manual (solo admin)
router.patch('/:id', checkAdmin, expenseController.updateExpense);

export default router;
