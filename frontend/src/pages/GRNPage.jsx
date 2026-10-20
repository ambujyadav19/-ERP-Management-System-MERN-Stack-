import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  PackageCheck,
  Eye,
  Warehouse,
  Truck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const GRNPage = () => {
  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const poIdFromQuery = searchParams.get('poId');

  const [selectedPO, setSelectedPO] = useState(null);
  const [warehouseLocation, setWarehouseLocation] = useState('Main Warehouse - Bay A');
  const [invoiceBillRef, setInvoiceBillRef] = useState('');
  const [notes, setNotes] = useState('Goods verified and accepted into stock.');
  const [receivedItems, setReceivedItems] = useState([]);

  // Detail Modal
  const [selectedGRN, setSelectedGRN] = useState(null);

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const canManage = hasRole('admin', 'inventory', 'purchase');

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      }).toString();

      const res = await api.getGRNs(query);
      if (res.success) {
        setGrns(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch GRNs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPOs = async () => {
    try {
      const res = await api.getPurchaseOrders('limit=100');
      if (res.success) {
        setPurchaseOrders(res.data);

        // If PO was passed in URL query
        if (poIdFromQuery) {
          const match = res.data.find((p) => p._id === poIdFromQuery);
          if (match) {
            handleSelectPO(match);
            setIsCreateOpen(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPendingPOs();
  }, [poIdFromQuery]);

  useEffect(() => {
    fetchGRNs();
  }, [pagination.page]);

  const handleSelectPO = (po) => {
    setSelectedPO(po);
    if (po && po.items) {
      setReceivedItems(
        po.items.map((item) => ({
          product: item.product?._id || item.product,
          title: item.product?.title || 'Catalog Item',
          SKU: item.product?.SKU || '',
          quantityOrdered: item.quantity,
          quantityReceived: item.quantity, // Default to full received
          unitCost: item.unitCost,
          remarks: 'Inspected & intact',
        }))
      );
    }
  };

  const handleQtyReceivedChange = (index, qty) => {
    const updated = [...receivedItems];
    updated[index].quantityReceived = Math.max(0, parseInt(qty, 10) || 0);
    setReceivedItems(updated);
  };

  const handleRemarksChange = (index, val) => {
    const updated = [...receivedItems];
    updated[index].remarks = val;
    setReceivedItems(updated);
  };

  const handleCreateGRN = async (e) => {
    e.preventDefault();
    if (!selectedPO) {
      showToast('Please select a purchase order', 'warning');
      return;
    }

    try {
      const res = await api.createGRN({
        purchaseOrderId: selectedPO._id,
        itemsReceived: receivedItems,
        warehouseLocation,
        invoiceBillRef,
        notes,
        status: 'Verified',
      });

      if (res.success) {
        showToast(res.message || 'Goods received and stock updated successfully!', 'success');
        setIsCreateOpen(false);
        setSelectedPO(null);
        setSearchParams({});
        fetchGRNs();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit GRN', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileCheck2 size={26} color="#4f46e5" />
            Goods Receipt Notes (GRN) & Inbound Inspection
          </h1>
          <p className="page-subtitle">
            Record physical inventory arrival, verify quality, and automatically update warehouse stock
          </p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedPO(null);
              setReceivedItems([]);
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> New Goods Receipt Note (GRN)
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchGRNs();
              }}
              className="search-input-box"
            >
              <Search size={16} />
              <input
                type="text"
                placeholder="Search GRN # or vendor bill reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
        </div>

        {/* GRN Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>GRN Number</th>
                <th>Purchase Order</th>
                <th>Vendor / Supplier</th>
                <th>Warehouse Bay</th>
                <th>Received Date</th>
                <th>Items Accepted</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Loading Goods Receipt Notes...
                  </td>
                </tr>
              ) : grns.length > 0 ? (
                grns.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        {g.grnNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#4f46e5' }}>
                        {g.purchaseOrder?.poNumber || 'N/A'}
                      </span>
                    </td>
                    <td>{g.supplier?.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Warehouse size={14} color="#6366f1" />
                        <span>{g.warehouseLocation}</span>
                      </div>
                    </td>
                    <td style={{ color: '#475569' }}>
                      {new Date(g.receivedDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} />
                        {g.itemsReceived?.length} products restocked
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{g.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        title="View GRN Details"
                        onClick={() => setSelectedGRN(g)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No Goods Receipt Notes registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing {grns.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} GRNs
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

      {/* Create GRN Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Goods Receipt Note (GRN) & Stock Intake"
        icon={PackageCheck}
        size="xl"
      >
        <form onSubmit={handleCreateGRN}>
          <div className="modal-body">
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <div style={{ fontSize: '13px', color: '#065f46' }}>
                <strong>Automated Stock Sync:</strong> Submitting this GRN will automatically increment the on-hand product inventory in the database and mark the purchase order as received.
              </div>
            </div>

            <div className="form-grid-3" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Associated Purchase Order *</label>
                <select
                  required
                  className="form-select"
                  value={selectedPO?._id || ''}
                  onChange={(e) => {
                    const match = purchaseOrders.find((p) => p._id === e.target.value);
                    if (match) handleSelectPO(match);
                  }}
                >
                  <option value="">Select PO to receive...</option>
                  {purchaseOrders
                    .filter((p) => p.status !== 'Cancelled')
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.poNumber} - {p.supplier?.name} (${p.totalAmount?.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Bay / Rack *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Main Warehouse - Bay 4"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Carrier Bill / Tracking Ref</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. FEDEX-98214"
                  value={invoiceBillRef}
                  onChange={(e) => setInvoiceBillRef(e.target.value)}
                />
              </div>
            </div>

            {/* Inspection Table */}
            {selectedPO && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Received Quantity Verification
                </span>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '10px 14px', width: '120px' }}>Ordered</th>
                        <th style={{ padding: '10px 14px', width: '140px' }}>Qty Received</th>
                        <th style={{ padding: '10px 14px' }}>Condition / Inspection Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                            {item.SKU && <code>{item.SKU}</code>}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                            {item.quantityOrdered} units
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <input
                              type="number"
                              min="0"
                              max={item.quantityOrdered * 2}
                              className="form-input"
                              style={{ padding: '6px' }}
                              value={item.quantityReceived}
                              onChange={(e) => handleQtyReceivedChange(idx, e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '6px' }}
                              value={item.remarks}
                              onChange={(e) => handleRemarksChange(idx, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Receiving Inspector Remarks</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!selectedPO}>
              Verify & Restock Warehouse
            </button>
          </div>
        </form>
      </Modal>

      {/* View GRN Modal */}
      {selectedGRN && (
        <Modal
          isOpen={!!selectedGRN}
          onClose={() => setSelectedGRN(null)}
          title={`Goods Receipt Note: ${selectedGRN.grnNumber}`}
          icon={FileCheck2}
          size="lg"
        >
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Source PO</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#4f46e5' }}>{selectedGRN.purchaseOrder?.poNumber}</div>
                <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>Supplier: {selectedGRN.supplier?.name}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Storage Details</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedGRN.warehouseLocation}</div>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Received: {new Date(selectedGRN.receivedDate).toLocaleString()}
                </div>
              </div>
            </div>

            <table className="data-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {selectedGRN.itemsReceived?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.product?.title || 'Catalog Item'}</td>
                    <td>{item.quantityOrdered}</td>
                    <td>
                      <span className="badge badge-success">
                        +{item.quantityReceived} units restocked
                      </span>
                    </td>
                    <td>{item.remarks || 'Verified'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedGRN.notes && (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>
                <strong>Notes:</strong> {selectedGRN.notes}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelectedGRN(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
