const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter product title'],
      trim: true,
    },
    SKU: {
      type: String,
      required: [true, 'Please enter SKU'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please enter selling price'],
      min: [0, 'Price must be positive'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price must be positive'],
    },
    stock: {
      type: Number,
      required: [true, 'Please enter available stock'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    unit: {
      type: String,
      default: 'Units',
    },
    description: {
      type: String,
      default: '',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual property to check low stock
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.reorderLevel;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
