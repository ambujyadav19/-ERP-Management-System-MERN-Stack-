const Product = require('../models/Product');

// @desc    Get all products with pagination & filtering
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, category, lowStock, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { SKU: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$reorderLevel'] };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('supplier', 'name email contact')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get categories for filter dropdown
    const categories = await Product.distinct('category');

    res.json({
      success: true,
      data: products,
      categories,
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin, Inventory, Purchase)
const createProduct = async (req, res, next) => {
  try {
    const { title, SKU, price, costPrice, stock, reorderLevel, category, unit, description, supplier } = req.body;

    const existingProduct = await Product.findOne({ SKU: SKU.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: `Product with SKU '${SKU}' already exists` });
    }

    const product = await Product.create({
      title,
      SKU: SKU.toUpperCase(),
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : 0,
      stock: Number(stock) || 0,
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 10,
      category: category || 'General',
      unit: unit || 'Units',
      description: description || '',
      supplier: supplier || null,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Inventory, Purchase)
const updateProduct = async (req, res, next) => {
  try {
    const { title, SKU, price, costPrice, stock, reorderLevel, category, unit, description, supplier } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (SKU && SKU.toUpperCase() !== product.SKU) {
      const existing = await Product.findOne({ SKU: SKU.toUpperCase(), _id: { $ne: product._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: `SKU '${SKU}' is already used by another product` });
      }
      product.SKU = SKU.toUpperCase();
    }

    if (title) product.title = title;
    if (price !== undefined) product.price = Number(price);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (stock !== undefined) product.stock = Number(stock);
    if (reorderLevel !== undefined) product.reorderLevel = Number(reorderLevel);
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (description !== undefined) product.description = description;
    if (supplier !== undefined) product.supplier = supplier || null;

    const updatedProduct = await product.save();
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Inventory)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
