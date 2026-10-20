import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  Truck,
  Plus,
  Search,
  Filter,
  FileCheck2,
  Eye,
  RefreshCw,
  X,
  Package,
} from 'lucide-react';

export const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product: '', quantity: 10, unitCost: 0, title: '' },
  ]);

  // View Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const canManage = hasRole('admin', 'purchase');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search: searchTerm,
      }).toString();

      const res = await api.getPurchaseOrders(query);
      if (res.success) {
        setOrders(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [suppRes, prodRes] = await Promise.all([
        api.getSuppliers('limit=100'),
        api.getProducts('limit=100'),
      ]);
      if (suppRes.success) setSuppliers(suppRes.data);
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
        quantity: 10,
        unitCost: product.costPrice || 0,
      };
    } else {
      updated[index] = { product: '', quantity: 1, unitCost: 0, title: '' };
    }
    setOrderItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setOrderItems(updated);
  };

  const handleCostChange = (index, cost) => {
    const updated = [...orderItems];
    updated[index].unitCost = parseFloat(cost) || 0;
    setOrderItems(updated);
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { product: '', quantity: 10, unitCost: 0, title: '' }]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((acc, item) => acc + (item.quantity * item.unitCost || 0), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      showToast('Please select a supplier', 'warning');
      return;
    }

    const validItems = orderItems.filter((item) => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one line item', 'warning');
      return;
    }

    try {
      const res = await api.createPurchaseOrder({
        supplier: selectedSupplier,
        items: validItems,
        expectedDeliveryDate: expectedDate,
        notes,
        status: 'Ordered',
      });

      if (res.success) {
        showToast(`Purchase Order ${res.data.poNumber} created successfully!`, 'success');
        setIsCreateOpen(false);
        fetchOrders();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create PO', 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updatePurchaseOrder(orderId, { status: newStatus });
      showToast(`PO status updated to ${newStatus}`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update PO status', 'error');
    }
  };

  const handleTriggerGRN = (po) => {
    // Navigate to GRN creation with poId in state / query
    navigate(`/grn?poId=${po._id}`);
  };

  const totalAmount = calculateTotal();

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={26} color="#4f46e5" />
            Purchase Orders (Procurement)
          </h1>
          <p className="page-subtitle">
            Issue vendor purchase orders and initiate Goods Receipt Notes (GRN) upon warehouse delivery
          </p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedSupplier('');
              setNotes('');
              setOrderItems([{ product: '', quantity: 10, unitCost: 0, title: '' }]);
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> New Purchase Order
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
                placeholder="Search PO Number (PO-XXXX)..."
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
              <option value="Ordered">Ordered</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received (GRN Complete)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* PO Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier / Vendor</th>
                <th>Expected Delivery</th>
                <th>Line Items</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((po) => (
                  <tr key={po._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                        {po.poNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{po.supplier?.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{po.supplier?.email}</div>
                    </td>
                    <td style={{ color: '#475569' }}>
                      {po.expectedDeliveryDate
                        ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{po.items?.length || 0} products</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${po.totalAmount?.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          po.status === 'Received'
                            ? 'badge-success'
                            : po.status === 'Partially Received'
                            ? 'badge-warning'
                            : po.status === 'Cancelled'
                            ? 'badge-danger'
                            : 'badge-info'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn-icon"
                          title="View PO Details"
                          onClick={() => setSelectedOrder(po)}
                        >
                          <Eye size={15} />
                        </button>
                        {po.status !== 'Received' && po.status !== 'Cancelled' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Generate Goods Receipt Note (GRN)"
                            onClick={() => handleTriggerGRN(po)}
                            style={{ fontSize: '11.5px', padding: '4px 8px', color: '#10b981', borderColor: '#a7f3d0' }}
                          >
                            <FileCheck2 size={13} /> Receive GRN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No purchase orders found.
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
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} POs
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

      {/* Create PO Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue New Purchase Order"
        icon={Truck}
        size="xl"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="modal-body">
            <div className="form-grid-2" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Vendor / Supplier *</label>
                <select
                  required
                  className="form-select"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line items table */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                  Procurement Items
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product to Restock</th>
                      <th style={{ padding: '10px 14px', width: '120px' }}>Quantity</th>
                      <th style={{ padding: '10px 14px', width: '130px' }}>Unit Cost ($)</th>
                      <th style={{ padding: '10px 14px', width: '120px', textAlign: 'right' }}>Total Cost</th>
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
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.title} ({p.SKU}) | Cost: ${p.costPrice || 0}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            min="1"
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
                            value={item.unitCost}
                            onChange={(e) => handleCostChange(idx, e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                          ${(item.quantity * item.unitCost).toFixed(2)}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <div style={{ width: '280px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                  <span style={{ fontWeight: 800 }}>Total Purchase Cost:</span>
                  <span style={{ fontWeight: 800, color: '#4f46e5' }}>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Vendor Notes & Instructions</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Quality inspection requirements, dock delivery hours..."
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
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Purchase Order: ${selectedOrder.poNumber}`}
          icon={Truck}
          size="lg"
        >
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Supplier</div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedOrder.supplier?.name}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedOrder.supplier?.email}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedOrder.supplier?.phone}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Order Details</div>
                <div style={{ marginTop: '4px' }}>
                  <span className="badge badge-info">{selectedOrder.status}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  Expected: {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <table className="data-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.product?.title || 'Catalog Item'}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitCost?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.totalCost?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 800, color: '#4f46e5' }}>
              Total: ${selectedOrder.totalAmount?.toFixed(2)}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
              Close
            </button>
            {selectedOrder.status !== 'Received' && (
              <button className="btn btn-primary" onClick={() => handleTriggerGRN(selectedOrder)}>
                <FileCheck2 size={15} /> Create GRN & Receive Goods
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
