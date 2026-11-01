import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { can, canAny } from '../../middleware/authorize.js';
import { enforceTenantScope } from '../../middleware/enforce-tenant-scope.js';
import { validate } from '../../middleware/validate.js';
import { expensesController } from './expenses.controller.js';
import {
  createExpenseCategorySchema,
  createExpenseSchema,
  expenseCategoryIdSchema,
  expenseIdSchema,
  listExpenseCategoriesSchema,
  listExpensesSchema,
  updateExpenseCategorySchema,
  updateExpenseSchema,
} from './expenses.validator.js';

const router = Router();

router.use(authenticate, enforceTenantScope);

router.get(
  '/categories',
  canAny('expenses.read', 'expenses.create', 'expenses.categories.manage'),
  validate(listExpenseCategoriesSchema),
  expensesController.listCategories,
);
router.post(
  '/categories',
  can('expenses.categories.manage'),
  validate(createExpenseCategorySchema),
  expensesController.createCategory,
);
router.patch(
  '/categories/:id',
  can('expenses.categories.manage'),
  validate(updateExpenseCategorySchema),
  expensesController.updateCategory,
);
router.delete(
  '/categories/:id',
  can('expenses.categories.manage'),
  validate(expenseCategoryIdSchema),
  expensesController.deleteCategory,
);

router.get('/', can('expenses.read'), validate(listExpensesSchema), expensesController.list);
router.post('/', can('expenses.create'), validate(createExpenseSchema), expensesController.create);
router.get('/:id', can('expenses.read'), validate(expenseIdSchema), expensesController.getById);
router.patch(
  '/:id',
  can('expenses.update'),
  validate(updateExpenseSchema),
  expensesController.update,
);
router.delete(
  '/:id',
  can('expenses.delete'),
  validate(expenseIdSchema),
  expensesController.remove,
);

export default router;
