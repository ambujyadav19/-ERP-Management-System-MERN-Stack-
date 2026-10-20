const Invoice = require('../models/Invoice');
const SalesOrder = require('../models/SalesOrder');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const { paymentStatus, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name email phone contact address taxNumber')
      .populate('salesOrder', 'orderNumber status totalPrice grandTotal')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: invoices,
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

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('salesOrder')
      .populate('items.product');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice (linked to Sales Order)
// @route   POST /api/invoices
// @access  Private (Admin, Sales)
const createInvoice = async (req, res, next) => {
  try {
    const {
      salesOrderId,
      dueDate,
      taxRate = 10,
      discount = 0,
      paymentMethod = 'Bank Transfer',
      notes,
    } = req.body;

    if (!salesOrderId) {
      return res.status(400).json({ success: false, message: 'Please provide salesOrderId' });
    }

    const salesOrder = await SalesOrder.findById(salesOrderId).populate('customer');
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }

    // Check if invoice already exists for this sales order
    const existing = await Invoice.findOne({ salesOrder: salesOrderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An invoice (${existing.invoiceNumber}) has already been generated for this Sales Order`,
        data: existing,
      });
    }

    // Auto-generate invoiceNumber: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${dateStr}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const subTotal = salesOrder.totalPrice;
    const disc = Number(discount) || 0;
    const taxAmt = ((subTotal - disc) * Number(taxRate)) / 100;
    const totalAmount = subTotal - disc + taxAmt;

    const invoiceItems = salesOrder.items.map((item) => ({
      product: item.product,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    const invoice = await Invoice.create({
      invoiceNumber,
      salesOrder: salesOrder._id,
      customer: salesOrder.customer._id,
      issueDate: new Date(),
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: invoiceItems,
      subTotal,
      taxRate: Number(taxRate),
      taxAmount: taxAmt,
      discount: disc,
      totalAmount,
      paymentStatus: 'Pending',
      paymentMethod,
      notes: notes || 'Thank you for your business. Payment terms: Net 15 days.',
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer')
      .populate('salesOrder');

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: populatedInvoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice status (e.g., mark as Paid)
// @route   PUT /api/invoices/:id
// @access  Private (Admin, Sales)
const updateInvoice = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, notes, dueDate } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (paymentStatus) {
      invoice.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        invoice.paidAt = new Date();
        // Also update SalesOrder paymentStatus
        await SalesOrder.findByIdAndUpdate(invoice.salesOrder, { paymentStatus: 'Paid' });
      }
    }

    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate) invoice.dueDate = dueDate;

    await invoice.save();

    const updated = await Invoice.findById(invoice._id)
      .populate('customer')
      .populate('salesOrder');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin)
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
