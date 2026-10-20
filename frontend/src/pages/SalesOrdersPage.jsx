import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Receipt,
  Eye,
  Trash2,
  CheckCircle,
  Truck,
  Package,
  RefreshCw,
  X,
} from 'lucide-react';

export const SalesOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product: '', quantity: 1, unitPrice: 0, stock: 0, title: '' },
  ]);

  // View Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const canManage = hasRole('admin', 'sales');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search: searchTerm,
      }).toString();

      const res = await api.getSalesOrders(query);
      if (res.success) {
        setOrders(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch sales orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers('limit=100'),
        api.getProducts('limit=100'),
      ]);
      if (custRes.success) setCustomers(custRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p._id === productId);
    const updated = [...orderItems];
    if (product) {
      updated[index] = {
        product: product._id,
        title: product.title,
        quantity: 1,
        unitPrice: product.price,
        stock: product.stock,
      };
    } else {
      updated[index] = { product: '', quantity: 1, unitPrice: 0, stock: 0, title: '' };
    }
    setOrderItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setOrderItems(updated);
  };

  const handleUnitPriceChange = (index, price) => {
    const updated = [...orderItems];
    updated[index].unitPrice = parseFloat(price) || 0;
    setOrderItems(updated);
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { product: '', quantity: 1, unitPrice: 0, stock: 0, title: '' }]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice || 0), 0);
  };

  const handleCustomerChange = (customerId) => {
    setSelectedCustomer(customerId);
    const cust = customers.find((c) => c._id === customerId);
    if (cust && cust.address) {
      setShippingAddress(`${cust.address.street || ''}, ${cust.address.city || ''}, ${cust.address.state || ''}`);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast('Please select a customer', 'warning');
      return;
    }

    const validItems = orderItems.filter((item) => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one product item', 'warning');
      return;
    }

    // Check stock
    for (const item of validItems) {
      if (item.quantity > item.stock) {
        showToast(`Requested quantity for ${item.title} (${item.quantity}) exceeds available stock (${item.stock})!`, 'error');
        return;
      }
    }

    try {
      const res = await api.createSalesOrder({
        customer: selectedCustomer,
        items: validItems,
        shippingAddress,
        notes,
        taxRate: 10,
        status: 'Confirmed',
      });

      if (res.success) {
        showToast(`Sales Order ${res.data.orderNumber} created and stock reserved!`, 'success');
        setIsCreateOpen(false);
        fetchOrders();
        loadDependencies(); // Refresh stock
      }
    } catch (err) {
      showToast(err.message || 'Failed to create sales order', 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateSalesOrder(orderId, { status: newStatus });
      showToast(`Order status updated to ${newStatus}`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      const res = await api.createInvoice({
        salesOrderId: order._id,
        taxRate: 10,
        paymentMethod: 'Bank Transfer',
        notes: `Invoice generated for order ${order.orderNumber}`,
      });
      showToast(`Invoice ${res.data.invoiceNumber} created successfully!`, 'success');
      navigate('/invoices');
    } catch (err) {
      showToast(err.message || 'Failed to generate invoice', 'error');
    }
  };

  const subTotal = calculateSubtotal();
  const taxAmount = subTotal * 0.1;
  const grandTotal = subTotal + taxAmount;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingCart size={26} color="#4f46e5" />
            Sales Orders Management
          </h1>
          <p className="page-subtitle">
            Create client orders, reserve product inventory, and generate formal invoices
          </p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedCustomer('');
              setShippingAddress('');
              setNotes('');
              setOrderItems([{ product: '', quantity: 1, unitPrice: 0, stock: 0, title: '' }]);
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> Create Sales Order
          </button>
        )}
      </div>

      {/* Table Toolbar */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <form onSubmit={handleSearchSubmit} className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by order number (SO-XXXX)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Items</th>
                <th>Grand Total</th>
                <th>Fulfillment Status</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((so) => (
                  <tr key={so._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                        {so.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{so.customer?.name || 'Walk-in'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{so.customer?.email}</div>
                    </td>
                    <td style={{ color: '#475569' }}>
                      {new Date(so.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>{so.items?.length || 0} line items</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${so.grandTotal?.toFixed(2)}
                    </td>
                    <td>
                      {canManage ? (
                        <select
                          className="form-select"
                          style={{ padding: '3px 8px', fontSize: '12px', width: 'auto' }}
                          value={so.status}
                          onChange={(e) => handleStatusChange(so._id, e.target.value)}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className="badge badge-primary">{so.status}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${so.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {so.paymentStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn-icon"
                          title="View Order Details"
                          onClick={() => setSelectedOrder(so)}
                        >
                          <Eye size={15} />
                        </button>
                        {canManage && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Generate Invoice"
                            onClick={() => handleGenerateInvoice(so)}
                            style={{ fontSize: '11.5px', padding: '4px 8px' }}
                          >
                            <Receipt size={13} /> Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No sales orders found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing {orders.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </button>
            <span style={{ padding: '0 8px', fontWeight: 600 }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Sales Order"
        icon={ShoppingCart}
        size="xl"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="modal-body">
            <div className="form-grid-2" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Client / Customer *</label>
                <select
                  required
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Shipping Destination</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Street, City, State, Zip"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                  Ordered Line Items
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
                  <Plus size={14} /> Add Product
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product / SKU</th>
                      <th style={{ padding: '10px 14px', width: '120px' }}>Available Stock</th>
                      <th style={{ padding: '10px 14px', width: '100px' }}>Quantity</th>
                      <th style={{ padding: '10px 14px', width: '120px' }}>Unit Price ($)</th>
                      <th style={{ padding: '10px 14px', width: '120px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px 14px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            required
                            className="form-select"
                            value={item.product}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                          >
                            <option value="">Select product to add...</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.title} ({p.SKU}) - ${p.price.toFixed(2)} | Stock: {p.stock}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${item.stock <= 10 ? 'badge-danger' : 'badge-neutral'}`}>
                            {item.stock} in stock
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            min="1"
                            max={item.stock || 99999}
                            className="form-input"
                            style={{ padding: '6px' }}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input"
                            style={{ padding: '6px' }}
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <div style={{ width: '280px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>${subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Sales Tax (10%):</span>
                  <span style={{ fontWeight: 600 }}>${taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontSize: '15px' }}>
                  <span style={{ fontWeight: 800 }}>Grand Total:</span>
                  <span style={{ fontWeight: 800, color: '#4f46e5' }}>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Internal Order Notes</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Shipping instructions, client PO reference, delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm & Book Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Sales Order: ${selectedOrder.orderNumber}`}
          icon={ShoppingCart}
          size="lg"
        >
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Client Information</div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedOrder.customer?.name}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedOrder.customer?.email}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedOrder.shippingAddress}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Order Status & Date</div>
                <div style={{ marginTop: '4px' }}>
                  <span className="badge badge-primary">{selectedOrder.status}</span>
                  <span className={`badge ${selectedOrder.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '6px' }}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <table className="data-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 800, color: '#4f46e5' }}>
              Grand Total: ${selectedOrder.grandTotal?.toFixed(2)}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
              Close
            </button>
            <button className="btn btn-primary" onClick={() => handleGenerateInvoice(selectedOrder)}>
              <Receipt size={15} /> Generate Invoice
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
