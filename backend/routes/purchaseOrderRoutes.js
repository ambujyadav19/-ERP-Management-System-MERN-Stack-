const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} = require('../controllers/purchaseOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getPurchaseOrders)
  .post(authorize('admin', 'purchase'), createPurchaseOrder);

router.route('/:id')
  .get(getPurchaseOrderById)
  .put(authorize('admin', 'purchase'), updatePurchaseOrder)
  .delete(authorize('admin'), deletePurchaseOrder);

module.exports = router;
