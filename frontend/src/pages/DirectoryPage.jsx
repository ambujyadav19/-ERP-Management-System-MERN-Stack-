import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  Users,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const DirectoryPage = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'suppliers'
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    taxNumber: '',
    paymentTerms: 'Net 30',
    creditLimit: '10000',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
  });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const canManageCustomers = hasRole('admin', 'sales');
  const canManageSuppliers = hasRole('admin', 'purchase', 'inventory');

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      }).toString();

      const res = activeTab === 'customers' ? await api.getCustomers(query) : await api.getSuppliers(query);
      if (res.success) {
        setDataList(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      taxNumber: '',
      paymentTerms: 'Net 30',
      creditLimit: '10000',
      address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      contact: item.contact || '',
      email: item.email,
      phone: item.phone || '',
      taxNumber: item.taxNumber || '',
      paymentTerms: item.paymentTerms || 'Net 30',
      creditLimit: item.creditLimit || '10000',
      address: {
        street: item.address?.street || '',
        city: item.address?.city || '',
        state: item.address?.state || '',
        zipCode: item.address?.zipCode || '',
        country: item.address?.country || 'USA',
      },
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'customers') {
        if (editingItem) {
          await api.updateCustomer(editingItem._id, formData);
          showToast(`Customer '${formData.name}' updated!`, 'success');
        } else {
          await api.createCustomer(formData);
          showToast(`Customer '${formData.name}' created!`, 'success');
        }
      } else {
        if (editingItem) {
          await api.updateSupplier(editingItem._id, formData);
          showToast(`Supplier '${formData.name}' updated!`, 'success');
        } else {
          await api.createSupplier(formData);
          showToast(`Supplier '${formData.name}' created!`, 'success');
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to save entity', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${activeTab === 'customers' ? 'customer' : 'supplier'} '${name}'?`)) {
      return;
    }
    try {
      if (activeTab === 'customers') {
        await api.deleteCustomer(id);
      } else {
        await api.deleteSupplier(id);
      }
      showToast('Deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const canManageCurrentTab = activeTab === 'customers' ? canManageCustomers : canManageSuppliers;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building2 size={26} color="#4f46e5" />
            Customer & Supplier Directory
          </h1>
          <p className="page-subtitle">
            Central repository of enterprise clients, procurement vendors, and contact records
          </p>
        </div>

        {canManageCurrentTab && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add {activeTab === 'customers' ? 'Customer' : 'Supplier'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('customers');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          <Users size={16} /> Customers Directory
        </button>
        <button
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('suppliers');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          <Building2 size={16} /> Suppliers & Vendors
        </button>
      </div>

      {/* Table & Search */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <form onSubmit={handleSearchSubmit} className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder={`Search ${activeTab} by name, email, contact...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company / Entity Name</th>
                <th>Contact Person</th>
                <th>Email & Phone</th>
                <th>Location</th>
                {activeTab === 'customers' ? <th>Credit Limit / Tax</th> : <th>Terms & Rating</th>}
                {canManageCurrentTab && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Loading directory...
                  </td>
                </tr>
              ) : dataList.length > 0 ? (
                dataList.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                      {item.taxNumber && (
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Tax ID: <code>{item.taxNumber}</code>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.contact || 'Primary Contact'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Mail size={13} color="#6366f1" />
                        <span>{item.email}</span>
                      </div>
                      {item.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <Phone size={12} color="#94a3b8" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '12.5px', color: '#475569' }}>
                        <MapPin size={14} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {item.address?.city || ''}
                          {item.address?.state ? `, ${item.address.state}` : ''}
                          {item.address?.country ? `, ${item.address.country}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      {activeTab === 'customers' ? (
                        <span className="badge badge-info">
                          Limit: ${item.creditLimit?.toLocaleString() || '10,000'}
                        </span>
                      ) : (
                        <div>
                          <span className="badge badge-neutral">{item.paymentTerms || 'Net 30'}</span>
                          <span style={{ marginLeft: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '12px' }}>
                            ★ {item.rating || 5}
                          </span>
                        </div>
                      )}
                    </td>
                    {canManageCurrentTab && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDelete(item._id, item.name)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No {activeTab} registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing {dataList.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? `Edit ${activeTab === 'customers' ? 'Customer' : 'Supplier'}`
            : `Add New ${activeTab === 'customers' ? 'Customer' : 'Supplier'}`
        }
        icon={activeTab === 'customers' ? Users : Building2}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Company / Legal Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Acme Corporation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Smith"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="contact@acme.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              {activeTab === 'customers' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Tax / GST Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="US-TAX-889922"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credit Limit ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="25000"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <select
                      className="form-select"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    >
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 45">Net 45 Days</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="123 Industrial Parkway, Suite 400"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Austin"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">State / Region</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="TX"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Zip / Postal Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="78701"
                  value={formData.address.zipCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
