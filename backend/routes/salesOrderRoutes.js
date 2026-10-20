const express = require('express');
const router = express.Router();
const {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
} = require('../controllers/salesOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSalesOrders)
  .post(authorize('admin', 'sales'), createSalesOrder);

router.route('/:id')
  .get(getSalesOrderById)
  .put(authorize('admin', 'sales'), updateSalesOrder)
  .delete(authorize('admin'), deleteSalesOrder);

module.exports = router;
