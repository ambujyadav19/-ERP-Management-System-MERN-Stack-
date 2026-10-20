const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantityOrdered: {
    type: Number,
    required: true,
  },
  quantityReceived: {
    type: Number,
    required: true,
    min: 0,
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  remarks: {
    type: String,
    default: '',
  },
});

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    itemsReceived: [grnItemSchema],
    warehouseLocation: {
      type: String,
      default: 'Main Warehouse - Section A',
    },
    invoiceBillRef: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Verified', 'Pending Inspection', 'Discrepancy'],
      default: 'Verified',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GRN', grnSchema);
