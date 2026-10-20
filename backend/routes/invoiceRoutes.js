const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(authorize('admin', 'sales'), createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(authorize('admin', 'sales'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

module.exports = router;
