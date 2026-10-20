const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const GRN = require('../models/GRN');
const SalesOrder = require('../models/SalesOrder');
const Invoice = require('../models/Invoice');

const seedData = async () => {
  console.log('[Seed] Seeding sample ERP database...');

  // 1. Seed Users
  await User.deleteMany({});
  const admin = await User.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@erp.com',
    password: 'password123',
    role: 'admin',
    department: 'Executive Management',
    phone: '+1 (555) 019-2834',
  });

  const salesUser = await User.create({
    name: 'Marcus Brody (Sales)',
    email: 'sales@erp.com',
    password: 'password123',
    role: 'sales',
    department: 'Sales & Business Dev',
    phone: '+1 (555) 019-2835',
  });

  const purchaseUser = await User.create({
    name: 'Sophia Chen (Purchase)',
    email: 'purchase@erp.com',
    password: 'password123',
    role: 'purchase',
    department: 'Procurement & Vendor Ops',
    phone: '+1 (555) 019-2836',
  });

  const inventoryUser = await User.create({
    name: 'David Miller (Inventory)',
    email: 'inventory@erp.com',
    password: 'password123',
    role: 'inventory',
    department: 'Warehouse & Fulfillment',
    phone: '+1 (555) 019-2837',
  });

  // 2. Seed Suppliers
  await Supplier.deleteMany({});
  const s1 = await Supplier.create({
    name: 'Apex Semiconductor Ltd',
    contact: 'Robert Taylor',
    email: 'orders@apexsemicon.com',
    phone: '+1 (800) 456-7890',
    address: { street: '104 Innovation Way', city: 'San Jose', state: 'CA', country: 'USA', zipCode: '95112' },
    paymentTerms: 'Net 30',
    rating: 5,
  });

  const s2 = await Supplier.create({
    name: 'Zenith Metals & Alloys',
    contact: 'Helena Clark',
    email: 'supply@zenithmetals.com',
    phone: '+1 (800) 789-0123',
    address: { street: '500 Foundry Blvd', city: 'Pittsburgh', state: 'PA', country: 'USA', zipCode: '15201' },
    paymentTerms: 'Net 45',
    rating: 4,
  });

  const s3 = await Supplier.create({
    name: 'Global Packaging Solutions',
    contact: 'Gary Wong',
    email: 'sales@globalpack.com',
    phone: '+1 (888) 321-6549',
    address: { street: '88 Logistics Drive', city: 'Chicago', state: 'IL', country: 'USA', zipCode: '60607' },
    paymentTerms: 'Net 30',
    rating: 5,
  });

  // 3. Seed Customers
  await Customer.deleteMany({});
  const c1 = await Customer.create({
    name: 'NovaTech Industries Inc',
    contact: 'Samantha Hayes',
    email: 'purchasing@novatech.com',
    phone: '+1 (555) 234-5678',
    address: { street: '742 Evergreen Terrace', city: 'Austin', state: 'TX', country: 'USA', zipCode: '78701' },
    taxNumber: 'US-TX-9876543',
    creditLimit: 50000,
  });

  const c2 = await Customer.create({
    name: 'Vanguard Aerospace Systems',
    contact: 'Lt. Col. Frank Castle',
    email: 'contracts@vanguardaero.com',
    phone: '+1 (555) 345-6789',
    address: { street: '1000 Hangar Road', city: 'Seattle', state: 'WA', country: 'USA', zipCode: '98101' },
    taxNumber: 'US-WA-1234567',
    creditLimit: 120000,
  });

  const c3 = await Customer.create({
    name: 'Horizon Retail Distribution',
    contact: 'Maya Patel',
    email: 'inventory@horizonretail.com',
    phone: '+1 (555) 456-7890',
    address: { street: '45 Commerce Square', city: 'Atlanta', state: 'GA', country: 'USA', zipCode: '30303' },
    taxNumber: 'US-GA-5566778',
    creditLimit: 35000,
  });

  // 4. Seed Products
  await Product.deleteMany({});
  const p1 = await Product.create({
    title: 'Industrial ARM Cortex Microcontroller M4',
    SKU: 'MCU-ARM-M4',
    category: 'Electronics',
    price: 45.0,
    costPrice: 28.5,
    stock: 6, // Low stock! (reorderLevel = 25)
    reorderLevel: 25,
    unit: 'Pieces',
    description: 'High-performance embedded ARM microcontroller with CAN bus and ADC.',
    supplier: s1._id,
  });

  const p2 = await Product.create({
    title: 'Heavy Duty Structural Steel Bracket 100mm',
    SKU: 'BRK-STL-100',
    category: 'Hardware',
    price: 18.5,
    costPrice: 9.0,
    stock: 140,
    reorderLevel: 30,
    unit: 'Pieces',
    description: 'Galvanized zinc-coated mounting bracket for structural assemblies.',
    supplier: s2._id,
  });

  const p3 = await Product.create({
    title: 'Enterprise NVMe SSD 2TB PCIe Gen4',
    SKU: 'SSD-ENT-2TB',
    category: 'Electronics',
    price: 240.0,
    costPrice: 165.0,
    stock: 5, // Low stock! (reorderLevel = 15)
    reorderLevel: 15,
    unit: 'Units',
    description: 'High IOPS enterprise solid state storage with power-loss protection.',
    supplier: s1._id,
  });

  const p4 = await Product.create({
    title: 'Industrial Heavy Duty Thermal Grease 50g',
    SKU: 'THM-GRP-050',
    category: 'Consumables',
    price: 12.0,
    costPrice: 5.2,
    stock: 95,
    reorderLevel: 20,
    unit: 'Tubes',
    description: 'High thermal conductivity synthetic heat sink compound.',
    supplier: s3._id,
  });

  const p5 = await Product.create({
    title: 'Wireless Industrial 2D Barcode Reader',
    SKU: 'BCR-WRL-200',
    category: 'Equipment',
    price: 195.0,
    costPrice: 110.0,
    stock: 22,
    reorderLevel: 10,
    unit: 'Units',
    description: 'Rugged IP65 drop-proof scanner with Bluetooth charging cradle.',
    supplier: s1._id,
  });

  const p6 = await Product.create({
    title: 'High-Tensile Anti-Static Stretch Film 500m',
    SKU: 'PKG-STR-500',
    category: 'Packaging',
    price: 32.0,
    costPrice: 16.0,
    stock: 4, // Low stock! (reorderLevel = 20)
    reorderLevel: 20,
    unit: 'Rolls',
    description: 'ESD-safe stretch packaging film for sensitive electronic equipment.',
    supplier: s3._id,
  });

  // 5. Seed Purchase Orders
  await PurchaseOrder.deleteMany({});
  const po1 = await PurchaseOrder.create({
    poNumber: 'PO-20261001-0001',
    supplier: s1._id,
    items: [
      { product: p1._id, quantity: 50, unitCost: 28.5, totalCost: 1425.0 },
      { product: p3._id, quantity: 20, unitCost: 165.0, totalCost: 3300.0 },
    ],
    totalAmount: 4725.0,
    status: 'Received',
    expectedDeliveryDate: new Date(),
    notes: 'Q4 Semiconductor replenishment batch',
    createdBy: purchaseUser._id,
  });

  const po2 = await PurchaseOrder.create({
    poNumber: 'PO-20261015-0002',
    supplier: s3._id,
    items: [
      { product: p4._id, quantity: 100, unitCost: 5.2, totalCost: 520.0 },
      { product: p6._id, quantity: 50, unitCost: 16.0, totalCost: 800.0 },
    ],
    totalAmount: 1320.0,
    status: 'Ordered',
    expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    notes: 'Packaging and consumables restock',
    createdBy: purchaseUser._id,
  });

  // 6. Seed Goods Receipt Note (GRN) linked to PO1
  await GRN.deleteMany({});
  await GRN.create({
    grnNumber: 'GRN-20261005-0001',
    purchaseOrder: po1._id,
    supplier: s1._id,
    receivedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    receivedBy: inventoryUser._id,
    warehouseLocation: 'Main Warehouse - Bay 4',
    invoiceBillRef: 'APEX-INV-9941',
    itemsReceived: [
      { product: p1._id, quantityOrdered: 50, quantityReceived: 50, unitCost: 28.5, remarks: 'Passed visual & functional test' },
      { product: p3._id, quantityOrdered: 20, quantityReceived: 20, unitCost: 165.0, remarks: 'Anti-static sealed intact' },
    ],
    status: 'Verified',
    notes: 'Delivered in good condition via DHL Express.',
  });

  // 7. Seed Sales Orders
  await SalesOrder.deleteMany({});
  const so1 = await SalesOrder.create({
    orderNumber: 'SO-20261008-0001',
    customer: c1._id,
    items: [
      { product: p2._id, title: p2.title, quantity: 30, unitPrice: 18.5, total: 555.0 },
      { product: p5._id, title: p5.title, quantity: 4, unitPrice: 195.0, total: 780.0 },
    ],
    totalPrice: 1335.0,
    tax: 133.5,
    grandTotal: 1468.5,
    status: 'Delivered',
    paymentStatus: 'Paid',
    shippingAddress: '742 Evergreen Terrace, Austin, TX 78701',
    notes: 'Direct priority shipping to factory site.',
    createdBy: salesUser._id,
  });

  const so2 = await SalesOrder.create({
    orderNumber: 'SO-20261012-0002',
    customer: c2._id,
    items: [
      { product: p1._id, title: p1.title, quantity: 15, unitPrice: 45.0, total: 675.0 },
      { product: p3._id, title: p3.title, quantity: 5, unitPrice: 240.0, total: 1200.0 },
    ],
    totalPrice: 1875.0,
    tax: 187.5,
    grandTotal: 2062.5,
    status: 'Confirmed',
    paymentStatus: 'Unpaid',
    shippingAddress: '1000 Hangar Road, Seattle, WA 98101',
    notes: 'Defense aerospace grade certified batch required.',
    createdBy: salesUser._id,
  });

  // 8. Seed Invoices
  await Invoice.deleteMany({});
  await Invoice.create({
    invoiceNumber: 'INV-20261009-0001',
    salesOrder: so1._id,
    customer: c1._id,
    issueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    items: [
      { product: p2._id, title: p2.title, quantity: 30, unitPrice: 18.5, total: 555.0 },
      { product: p5._id, title: p5.title, quantity: 4, unitPrice: 195.0, total: 780.0 },
    ],
    subTotal: 1335.0,
    taxRate: 10,
    taxAmount: 133.5,
    discount: 0,
    totalAmount: 1468.5,
    paymentStatus: 'Paid',
    paymentMethod: 'Wire Transfer',
    paidAt: new Date(),
    notes: 'Payment received in full. Thank you!',
  });

  await Invoice.create({
    invoiceNumber: 'INV-20261013-0002',
    salesOrder: so2._id,
    customer: c2._id,
    issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    items: [
      { product: p1._id, title: p1.title, quantity: 15, unitPrice: 45.0, total: 675.0 },
      { product: p3._id, title: p3.title, quantity: 5, unitPrice: 240.0, total: 1200.0 },
    ],
    subTotal: 1875.0,
    taxRate: 10,
    taxAmount: 187.5,
    discount: 0,
    totalAmount: 2062.5,
    paymentStatus: 'Pending',
    paymentMethod: 'Bank Transfer',
    notes: 'Net 15 days terms. Remit payment to Vanguard account.',
  });

  console.log('[Seed] Database seeded successfully with demo ERP records!');
};

const autoSeedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Seed] No existing users found. Auto-seeding initial ERP dataset...');
    await seedData();
  }
};

module.exports = { seedData, autoSeedIfEmpty };

// Run standalone if executed directly via `node utils/seed.js`
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, closeDB } = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await seedData();
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
