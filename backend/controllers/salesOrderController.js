const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get all sales orders
// @route   GET /api/sales-orders
// @access  Private
const getSalesOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await SalesOrder.countDocuments(query);
    const orders = await SalesOrder.find(query)
      .populate('customer', 'name email contact phone address')
      .populate('items.product', 'title SKU price stock')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: orders,
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

// @desc    Get single sales order
// @route   GET /api/sales-orders/:id
// @access  Private
const getSalesOrderById = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Create sales order
// @route   POST /api/sales-orders
// @access  Private (Admin, Sales)
const createSalesOrder = async (req, res, next) => {
  try {
    const { customer, items, shippingAddress, notes, taxRate = 10, status = 'Confirmed' } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Please provide customer and at least one item' });
    }

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ success: false, message: 'Customer not found' });
    }

    // Auto-generate orderNumber: SO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await SalesOrder.countDocuments();
    const orderNumber = `SO-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    let subTotal = 0;
    const formattedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not found` });
      }

      const qty = Number(item.quantity) || 1;
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.price;

      // Check stock availability
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${product.title}'. Requested: ${qty}, Available: ${product.stock}`,
        });
      }

      const lineTotal = qty * unitPrice;
      subTotal += lineTotal;

      formattedItems.push({
        product: product._id,
        title: product.title,
        quantity: qty,
        unitPrice,
        total: lineTotal,
      });

      // Deduct stock upon order confirmation
      if (status !== 'Draft') {
        product.stock -= qty;
        await product.save();
      }
    }

    const taxAmount = (subTotal * Number(taxRate)) / 100;
    const grandTotal = subTotal + taxAmount;

    const salesOrder = await SalesOrder.create({
      orderNumber,
      customer: customerDoc._id,
      items: formattedItems,
      totalPrice: subTotal,
      tax: taxAmount,
      grandTotal,
      status,
      paymentStatus: 'Unpaid',
      shippingAddress: shippingAddress || (customerDoc.address ? `${customerDoc.address.street}, ${customerDoc.address.city}` : ''),
      notes: notes || '',
      createdBy: req.user ? req.user._id : null,
    });

    const populatedSO = await SalesOrder.findById(salesOrder._id)
      .populate('customer')
      .populate('items.product');

    res.status(201).json({ success: true, data: populatedSO });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sales order
// @route   PUT /api/sales-orders/:id
// @access  Private (Admin, Sales)
const updateSalesOrder = async (req, res, next) => {
  try {
    const { status, paymentStatus, notes, shippingAddress } = req.body;
    const order = await SalesOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }

    if (status) {
      // If cancelling an active order, replenish inventory stock
      if (status === 'Cancelled' && order.status !== 'Cancelled' && order.status !== 'Draft') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
      order.status = status;
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes !== undefined) order.notes = notes;
    if (shippingAddress) order.shippingAddress = shippingAddress;

    await order.save();

    const updated = await SalesOrder.findById(order._id)
      .populate('customer')
      .populate('items.product');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Private (Admin)
const deleteSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }
    res.json({ success: true, message: 'Sales Order deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
};
