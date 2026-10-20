# Enterprise ERP Management System (MERN Stack)

A comprehensive, full-featured enterprise resource planning (ERP) platform designed for mid-sized companies to streamline and automate core business operations: **Products & Inventory**, **Customers & Suppliers**, **Sales Orders**, **Purchase Orders**, **Goods Receipt Notes (GRN)** with automated stock sync, **Commercial Invoices** with PDF export, and **Role-Based Access Control (Admin, Sales, Purchase, Inventory)**.

---

## 🌟 Key Features & Functionality

### 1. Security & Role-Based Access Control (RBAC)
- **Token-based Authentication (JWT)**: Secure password hashing with `bcryptjs`.
- **Role Guards**: 4 pre-configured roles with granular permissions:
  - **Admin**: Full master access to all modules and User Management.
  - **Sales**: Product Catalog, Customer Directory, Sales Orders, Invoicing.
  - **Purchase**: Product Catalog, Vendor Directory, Purchase Orders, GRN Inbound.
  - **Inventory**: Stock Management, Low Stock Alerts, Goods Receipt Notes (GRN).
- **1-Click Quick Role Switcher**: Interactive switcher in topbar and login page to easily test all role permissions.

### 2. Executive Operations Dashboard
- **Real-Time KPIs**: Total Sales Revenue, Procurement Spend, Inventory Valuation, and Low Stock count.
- **Interactive Recharts**:
  - Monthly Sales vs. Procurement spend trend (Area Chart).
  - Inventory distribution by Category (Doughnut Chart).
- **Critical Low Stock Alerts**: Highlights products below reorder thresholds with instant "Reorder" action.
- **Recent Activity**: Live feeds for newly placed Sales Orders and received GRNs.

### 3. Product & Stock Management
- **Full CRUD**: Add, Edit, Delete, Search, and Category filtering.
- **Inventory Tracking**: Unit pricing, cost price, on-hand stock, reorder thresholds.
- **Stock Indicators**: Dynamic color-coded warning pills (Danger if `stock <= reorderLevel`).
- **Export to Excel / CSV**: One-click inventory report download via SheetJS (`xlsx`).

### 4. Customer & Supplier Directory
- **Tabbed Interface**: Separate searchable directories for Clients and Vendors.
- **Entity Metadata**: Tax IDs, credit limits, payment terms (Net 30, Net 45), ratings, and structured address.

### 5. Sales Orders & Fulfillment Flow
- **Interactive Order Builder**: Multi-item line builder with live quantity and unit price calculations.
- **Stock Reservation**: Automatically checks stock availability and deducts inventory on order confirmation.
- **One-Click Invoice Action**: Direct trigger to generate an official commercial invoice from any confirmed sales order.

### 6. Purchase Orders & Procurement
- **Vendor PO Issuance**: Dynamic line items, unit costs, and delivery date scheduling.
- **Direct GRN Integration**: One-click action to receive goods against any purchase order.

### 7. Goods Receipt Notes (GRN) & Automated Inventory Sync
- **Purchase Order Linkage**: Select any issued PO to auto-populate ordered items.
- **Inspection & Intake**: Record quantity received, warehouse bay location, and carrier tracking reference.
- **Automatic Stock Increment**: **Submitting a GRN automatically increments the product's on-hand inventory stock** in the database and updates the PO status to 'Received'!

### 8. Commercial Invoicing & PDF Export
- **Sales Order Linkage**: Generates invoices with subtotal, tax rate, and discounts.
- **Printable Template**: Clean enterprise billing layout with company header, client details, and payment terms.
- **Vector PDF Download**: Generates crisp, downloadable PDF files using `jsPDF` and `jspdf-autotable`.

### 9. Administration & User Management
- **Admin-Only Guard**: Manage team members, departments, and active statuses.
- **Role Elevation**: Assign and change roles (`admin`, `sales`, `purchase`, `inventory`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Context API, Lucide Icons, Recharts, jsPDF, SheetJS (XLSX) |
| **Backend** | Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), BcryptJS, Morgan |
| **Database** | MongoDB (with automatic in-memory fallback for zero-configuration local runs) |
| **Documentation** | Interactive Swagger UI (`/api/docs`), Postman Collection export |
| **Testing** | Jest integration test suite |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher installed on your system.

### 2. Start the Backend Server
```bash
cd backend
npm install
npm start
```
> **Zero Configuration**: If no local MongoDB daemon is running, the server automatically starts an embedded in-memory MongoDB instance and auto-seeds all demo users, products, suppliers, customers, orders, GRNs, and invoices!

The backend will start at `http://localhost:5000`:
- **API Documentation (Swagger UI)**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/api/health`

### 3. Start the Frontend Client
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 👥 Demo Accounts (Pre-Seeded)

All demo accounts use password: `password123`

| Role | Email | Password | Scope & Permissions |
|---|---|---|---|
| **Admin** | `admin@erp.com` | `password123` | Full access across all modules + User Management |
| **Sales** | `sales@erp.com` | `password123` | Dashboard, Products, Customers, Sales Orders, Invoices |
| **Purchase** | `purchase@erp.com` | `password123` | Dashboard, Products, Suppliers, Purchase Orders, GRN |
| **Inventory** | `inventory@erp.com` | `password123` | Dashboard, Products & Stock Levels, Suppliers, GRN intake |

> **Tip**: You can use the **1-Click Demo Login** buttons on the login page or the **Quick Role Switcher** buttons in the topbar to test all 4 roles instantly!

---

## 🧪 Running Tests
To run the Jest backend integration test suite:
```bash
cd backend
npm test
```

---

## 📑 API Endpoints Summary

### Authentication & Users
- `POST /api/register` - Register a new user
- `POST /api/login` - Authenticate and get JWT token
- `GET /api/me` - Get current user profile
- `GET /api/users` - Admin: List users with search & pagination
- `POST /api/users` - Admin: Create new user
- `PUT /api/users/:id` - Admin: Update user & role
- `DELETE /api/users/:id` - Admin: Delete user

### Products & Inventory
- `GET /api/products` - List products (`?page=`, `?search=`, `?category=`, `?lowStock=true`)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product & stock
- `DELETE /api/products/:id` - Delete product

### Customers & Suppliers
- `GET /api/customers`, `POST`, `PUT`, `DELETE` - Customer directory CRUD
- `GET /api/suppliers`, `POST`, `PUT`, `DELETE` - Supplier directory CRUD

### Sales & Purchase Orders
- `GET /api/sales-orders`, `POST`, `PUT`, `DELETE` - Sales orders with stock reservation
- `GET /api/purchase-orders`, `POST`, `PUT`, `DELETE` - Purchase orders

### Goods Receipt Notes (GRN)
- `GET /api/grn` - List Goods Receipt Notes
- `POST /api/grn` - Create GRN linked to PO (auto increments product stock!)

### Commercial Invoices
- `GET /api/invoices` - List invoices (`?paymentStatus=`)
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice linked to sales order
- `PUT /api/invoices/:id` - Update status (e.g. Paid)

### Analytics
- `GET /api/dashboard/stats` - Comprehensive KPI metrics, monthly trends, and low-stock alerts
