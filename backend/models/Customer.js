const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter customer name or company'],
      trim: true,
    },
    contact: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter customer email'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    taxNumber: {
      type: String,
      default: '',
      trim: true,
    },
    creditLimit: {
      type: Number,
      default: 10000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
