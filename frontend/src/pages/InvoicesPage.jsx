import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  CreditCard,
  Building,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [taxRate, setTaxRate] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('Payment terms: Net 15 days via Wire Transfer.');

  // View / Print Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const canManage = hasRole('admin', 'sales');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        paymentStatus: statusFilter,
        search: searchTerm,
      }).toString();

      const res = await api.getInvoices(query);
      if (res.success) {
        setInvoices(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesOrders = async () => {
    try {
      const res = await api.getSalesOrders('limit=100');
      if (res.success) setSalesOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSalesOrders();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInvoices();
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedSO) {
      showToast('Please select a sales order', 'warning');
      return;
    }

    try {
      const res = await api.createInvoice({
        salesOrderId: selectedSO,
        dueDate,
        taxRate,
        discount,
        notes,
      });

      if (res.success) {
        showToast(`Invoice ${res.data.invoiceNumber} generated successfully!`, 'success');
        setIsCreateOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create invoice', 'error');
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await api.updateInvoice(invoiceId, { paymentStatus: 'Paid' });
      showToast('Invoice marked as Paid! Sales order updated.', 'success');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === invoiceId) {
        setSelectedInvoice((prev) => ({ ...prev, paymentStatus: 'Paid' }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to update invoice status', 'error');
    }
  };

  // Export PDF using jsPDF + autoTable (matching exact PDF specification!)
  const downloadPDF = (inv) => {
    const doc = new jsPDF();

    // Corporate Header
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTERPRISE ERP CORE', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL COMMERCIAL INVOICE', 14, 28);

    // Invoice Meta
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE: ${inv.invoiceNumber}`, 14, 48);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Issued: ${new Date(inv.issueDate).toLocaleDateString()}`, 14, 55);
    doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`, 14, 61);
    doc.text(`Payment Status: ${inv.paymentStatus.toUpperCase()}`, 14, 67);

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 120, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(inv.customer?.name || 'Customer', 120, 55);
    doc.text(inv.customer?.email || '', 120, 61);
    if (inv.customer?.address) {
      doc.text(`${inv.customer.address.street || ''}, ${inv.customer.address.city || ''}`, 120, 67);
    }

    // Line items table
    const tableRows = (inv.items || []).map((item, index) => [
      index + 1,
      item.title,
      item.quantity,
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 76,
      head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals Box
    doc.setFontSize(10);
    doc.text(`Subtotal: $${inv.subTotal.toFixed(2)}`, 140, finalY);
    doc.text(`Tax (${inv.taxRate}%): $${inv.taxAmount.toFixed(2)}`, 140, finalY + 6);
    if (inv.discount > 0) {
      doc.text(`Discount: -$${inv.discount.toFixed(2)}`, 140, finalY + 12);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL AMOUNT: $${inv.totalAmount.toFixed(2)}`, 140, finalY + (inv.discount > 0 ? 20 : 14));

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(inv.notes || 'Thank you for your business. Remit payment to Enterprise ERP.', 14, 280);

    // Save PDF
    doc.save(`${inv.invoiceNumber}.pdf`);
    showToast(`Invoice ${inv.invoiceNumber} downloaded as PDF!`, 'success');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Receipt size={26} color="#4f46e5" />
            Invoices & Accounts Receivable
          </h1>
          <p className="page-subtitle">
            Manage commercial invoices, record payments, and export professional PDF billing documents
          </p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedSO('');
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> Generate New Invoice
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <form onSubmit={handleSearchSubmit} className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search invoice number (INV-XXXX)..."
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
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Source Order</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customer?.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{inv.customer?.email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#475569' }}>
                        {inv.salesOrder?.orderNumber || 'Direct Order'}
                      </span>
                    </td>
                    <td style={{ color: '#475569' }}>
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td style={{ color: '#475569' }}>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${inv.totalAmount?.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inv.paymentStatus === 'Paid'
                            ? 'badge-success'
                            : inv.paymentStatus === 'Overdue'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn-icon"
                          title="View Printable Invoice"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Download PDF"
                          style={{ color: '#4f46e5' }}
                          onClick={() => downloadPDF(inv)}
                        >
                          <Download size={15} />
                        </button>
                        {canManage && inv.paymentStatus !== 'Paid' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Mark as Paid"
                            style={{ color: '#10b981', borderColor: '#a7f3d0', fontSize: '11.5px', padding: '4px 8px' }}
                            onClick={() => handleMarkAsPaid(inv._id)}
                          >
                            <CheckCircle size={13} /> Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing {invoices.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
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

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Invoice from Sales Order"
        icon={Receipt}
        size="lg"
      >
        <form onSubmit={handleCreateInvoice}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Sales Order Reference *</label>
              <select
                required
                className="form-select"
                value={selectedSO}
                onChange={(e) => setSelectedSO(e.target.value)}
              >
                <option value="">Select Sales Order...</option>
                {salesOrders.map((so) => (
                  <option key={so._id} value={so._id}>
                    {so.orderNumber} - {so.customer?.name} (${so.grandTotal?.toFixed(2)}) [{so.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Terms & Remittance Notes</label>
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
            <button type="submit" className="btn btn-primary">
              Generate Commercial Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* View Printable Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Commercial Invoice: ${selectedInvoice.invoiceNumber}`}
          icon={Receipt}
          size="xl"
        >
          <div className="modal-body" style={{ background: '#ffffff', padding: '36px' }}>
            {/* Header Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '24px', marginBottom: '28px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>ENTERPRISE ERP CORE</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Industrial Operations & Global Logistics Suite</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Tax ID: US-EIN-99228811 | accounts@enterprise-erp.com</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#4f46e5' }}>{selectedInvoice.invoiceNumber}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span
                    className={`badge ${
                      selectedInvoice.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'
                    }`}
                  >
                    Payment: {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div style={{ marginBottom: '28px', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Billed To Client</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedInvoice.customer?.name}</div>
              <div style={{ fontSize: '13px', color: '#475569' }}>{selectedInvoice.customer?.email}</div>
              {selectedInvoice.customer?.phone && (
                <div style={{ fontSize: '13px', color: '#475569' }}>{selectedInvoice.customer?.phone}</div>
              )}
            </div>

            {/* Line Items */}
            <table className="data-table" style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Line Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '320px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>${selectedInvoice.subTotal?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748b' }}>Sales Tax ({selectedInvoice.taxRate}%):</span>
                  <span style={{ fontWeight: 600 }}>${selectedInvoice.taxAmount?.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#ef4444' }}>
                    <span>Discount:</span>
                    <span>-${selectedInvoice.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '10px', fontSize: '18px', fontWeight: 800 }}>
                  <span>Total Due:</span>
                  <span style={{ color: '#4f46e5' }}>${selectedInvoice.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <strong>Payment Terms & Notes:</strong> {selectedInvoice.notes}
            </div>
          </div>

          <div className="modal-footer no-print">
            <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
              Close
            </button>
            {selectedInvoice.paymentStatus !== 'Paid' && (
              <button
                className="btn btn-success"
                onClick={() => handleMarkAsPaid(selectedInvoice._id)}
              >
                <CheckCircle size={15} /> Mark as Paid
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Print
            </button>
            <button
              className="btn btn-primary"
              onClick={() => downloadPDF(selectedInvoice)}
            >
              <Download size={15} /> Download PDF (jsPDF)
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
