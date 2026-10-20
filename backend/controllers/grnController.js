const GRN = require('../models/GRN');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

// @desc    Get all Goods Receipt Notes
// @route   GET /api/grn
// @access  Private
const getGRNs = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { grnNumber: { $regex: search, $options: 'i' } },
        { invoiceBillRef: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await GRN.countDocuments(query);
    const grns = await GRN.find(query)
      .populate('purchaseOrder', 'poNumber status totalAmount')
      .populate('supplier', 'name email contact phone')
      .populate('itemsReceived.product', 'title SKU stock unit')
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: grns,
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

// @desc    Get single GRN
// @route   GET /api/grn/:id
// @access  Private
const getGRNById = async (req, res, next) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('supplier')
      .populate('itemsReceived.product')
      .populate('receivedBy', 'name email');

    if (!grn) {
      return res.status(404).json({ success: false, message: 'GRN record not found' });
    }
    res.json({ success: true, data: grn });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Goods Receipt Note (Linked to Purchase Order & updates Product Stock)
// @route   POST /api/grn
// @access  Private (Admin, Inventory, Purchase)
const createGRN = async (req, res, next) => {
  try {
    const {
      purchaseOrderId,
      itemsReceived,
      warehouseLocation,
      invoiceBillRef,
      status,
      notes,
    } = req.body;

    if (!purchaseOrderId) {
      return res.status(400).json({ success: false, message: 'Please provide purchaseOrderId' });
    }

    const po = await PurchaseOrder.findById(purchaseOrderId).populate('items.product');
    if (!po) {
      return res.status(404).json({ success: false, message: 'Associated Purchase Order not found' });
    }

    // Auto-generate GRN number: GRN-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const grnCount = await GRN.countDocuments();
    const grnNumber = `GRN-${dateStr}-${String(grnCount + 1).padStart(4, '0')}`;

    // Process items received and UPDATE PRODUCT INVENTORY STOCK
    const processedItems = [];
    let totalItemsExpected = 0;
    let totalItemsReceived = 0;

    for (const poItem of po.items) {
      totalItemsExpected += poItem.quantity;
      // Find matching item in request or default to full received
      const match = itemsReceived
        ? itemsReceived.find((i) => i.product.toString() === poItem.product._id.toString())
        : null;

      const qtyRecv = match ? Number(match.quantityReceived) : poItem.quantity;
      totalItemsReceived += qtyRecv;

      // Update product stock in database!
      if (qtyRecv > 0) {
        await Product.findByIdAndUpdate(poItem.product._id, {
          $inc: { stock: qtyRecv },
        });
      }

      processedItems.push({
        product: poItem.product._id,
        quantityOrdered: poItem.quantity,
        quantityReceived: qtyRecv,
        unitCost: poItem.unitCost,
        remarks: match ? match.remarks || '' : 'Verified upon receipt',
      });
    }

    // Update Purchase Order status
    if (totalItemsReceived >= totalItemsExpected) {
      po.status = 'Received';
    } else if (totalItemsReceived > 0) {
      po.status = 'Partially Received';
    }
    await po.save();

    // Create GRN
    const grn = await GRN.create({
      grnNumber,
      purchaseOrder: po._id,
      supplier: po.supplier,
      receivedDate: new Date(),
      receivedBy: req.user ? req.user._id : null,
      itemsReceived: processedItems,
      warehouseLocation: warehouseLocation || 'Main Warehouse - Section A',
      invoiceBillRef: invoiceBillRef || '',
      status: status || 'Verified',
      notes: notes || `Goods received against PO ${po.poNumber}. Stock automatically updated.`,
    });

    const populatedGRN = await GRN.findById(grn._id)
      .populate('purchaseOrder', 'poNumber status')
      .populate('supplier', 'name email contact')
      .populate('itemsReceived.product', 'title SKU stock');

    res.status(201).json({
      success: true,
      message: `GRN ${grnNumber} generated successfully. Product stocks updated!`,
      data: populatedGRN,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGRNs,
  getGRNById,
  createGRN,
};
