const express = require('express');
const router = express.Router();
const { getGRNs, getGRNById, createGRN } = require('../controllers/grnController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getGRNs)
  .post(authorize('admin', 'inventory', 'purchase'), createGRN);

router.route('/:id')
  .get(getGRNById);

module.exports = router;
