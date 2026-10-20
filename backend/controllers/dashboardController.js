const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const GRN = require('../models/GRN');

// @desc    Get dashboard metrics & analytics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalSalesOrders,
      totalPurchaseOrders,
      totalInvoices,
      totalGRNs,
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments(),
      Supplier.countDocuments(),
      SalesOrder.countDocuments(),
      PurchaseOrder.countDocuments(),
      Invoice.countDocuments(),
      GRN.countDocuments(),
    ]);

    // Low stock items: stock <= reorderLevel
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    })
      .populate('supplier', 'name email phone')
      .limit(10);

    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    });

    // Total Inventory Value
    const inventoryValuation = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          totalCost: { $sum: { $multiply: ['$stock', '$costPrice'] } },
          totalUnits: { $sum: '$stock' },
        },
      },
    ]);

    // Total Sales Revenue (from confirmed/delivered sales orders)
    const salesRevenueAgg = await SalesOrder.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' } } },
    ]);

    // Total Purchase Spend
    const purchaseSpendAgg = await PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalSpend: { $sum: '$totalAmount' } } },
    ]);

    // Invoices breakdown
    const invoiceSummary = await Invoice.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Monthly revenue & purchase trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;

      const sales = await SalesOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: d, $lt: nextD },
            status: { $ne: 'Cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]);

      const purchases = await PurchaseOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: d, $lt: nextD },
            status: { $ne: 'Cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);

      monthlyTrends.push({
        month: monthLabel,
        sales: sales[0] ? sales[0].total : 0,
        purchases: purchases[0] ? purchases[0].total : 0,
      });
    }

    // Category breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          stock: { $sum: '$stock' },
        },
      },
      { $project: { category: '$_id', count: 1, stock: 1, _id: 0 } },
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await SalesOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Recent 5 Sales Orders
    const recentSales = await SalesOrder.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 GRNs
    const recentGRNs = await GRN.find()
      .populate('supplier', 'name')
      .populate('purchaseOrder', 'poNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        metrics: {
          totalProducts,
          totalCustomers,
          totalSuppliers,
          totalSalesOrders,
          totalPurchaseOrders,
          totalInvoices,
          totalGRNs,
          lowStockCount,
          totalSalesRevenue: salesRevenueAgg[0] ? salesRevenueAgg[0].totalSales : 0,
          totalPurchaseSpend: purchaseSpendAgg[0] ? purchaseSpendAgg[0].totalSpend : 0,
          totalInventoryValue: inventoryValuation[0] ? inventoryValuation[0].totalValue : 0,
          totalInventoryUnits: inventoryValuation[0] ? inventoryValuation[0].totalUnits : 0,
        },
        monthlyTrends,
        categoryBreakdown,
        orderStatusBreakdown,
        invoiceSummary,
        lowStockItems,
        recentSales,
        recentGRNs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
