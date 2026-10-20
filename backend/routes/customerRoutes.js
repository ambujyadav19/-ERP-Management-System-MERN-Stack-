const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(authorize('admin', 'sales'), createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(authorize('admin', 'sales'), updateCustomer)
  .delete(authorize('admin', 'sales'), deleteCustomer);

module.exports = router;
