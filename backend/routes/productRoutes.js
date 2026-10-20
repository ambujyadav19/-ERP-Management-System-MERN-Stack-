const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('admin', 'inventory', 'purchase'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('admin', 'inventory', 'purchase'), updateProduct)
  .delete(authorize('admin', 'inventory'), deleteProduct);

module.exports = router;
