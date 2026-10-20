const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
const getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.poNumber = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query)
      .populate('supplier', 'name email contact phone')
      .populate('items.product', 'title SKU price costPrice stock')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: pos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
const getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', 'name email');

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }
    res.json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private (Admin, Purchase)
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, items, expectedDeliveryDate, notes } = req.body;

    if (!supplier || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Please provide supplier and at least one item' });
    }

    // Auto-generate PO Number: PO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await PurchaseOrder.countDocuments();
    const poNumber = `PO-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not found` });
      }
      const unitCost = item.unitCost !== undefined ? Number(item.unitCost) : product.costPrice || 0;
      const quantity = Number(item.quantity) || 1;
      const lineTotal = quantity * unitCost;
      totalAmount += lineTotal;

      formattedItems.push({
        product: product._id,
        quantity,
        unitCost,
        totalCost: lineTotal,
      });
    }

    const purchaseOrder = await PurchaseOrder.create({
      poNumber,
      supplier,
      items: formattedItems,
      totalAmount,
      status: req.body.status || 'Ordered',
      expectedDeliveryDate: expectedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: notes || '',
      createdBy: req.user ? req.user._id : null,
    });

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier')
      .populate('items.product');

    res.status(201).json({ success: true, data: populatedPO });
  } catch (error) {
    next(error);
  }
};

// @desc    Update purchase order status / details
// @route   PUT /api/purchase-orders/:id
// @access  Private (Admin, Purchase)
const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { status, notes, expectedDeliveryDate } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    if (status) po.status = status;
    if (notes !== undefined) po.notes = notes;
    if (expectedDeliveryDate) po.expectedDeliveryDate = expectedDeliveryDate;

    await po.save();

    const updated = await PurchaseOrder.findById(po._id)
      .populate('supplier')
      .populate('items.product');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (Admin)
const deletePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }
    res.json({ success: true, message: 'Purchase Order deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
};
