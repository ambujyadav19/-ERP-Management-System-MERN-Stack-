import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  Download,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStock') === 'true');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    SKU: '',
    category: 'Electronics',
    price: '',
    costPrice: '',
    stock: '',
    reorderLevel: '15',
    unit: 'Units',
    description: '',
    supplier: '',
  });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const canManage = hasRole('admin', 'inventory', 'purchase');
  const canDelete = hasRole('admin', 'inventory');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        category: selectedCategory,
        lowStock: lowStockOnly ? 'true' : '',
      }).toString();

      const res = await api.getProducts(query);
      if (res.success) {
        setProducts(res.data);
        setCategories(res.categories || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.getSuppliers();
      if (res.success) setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, selectedCategory, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      SKU: '',
      category: categories[0] || 'Electronics',
      price: '',
      costPrice: '',
      stock: '',
      reorderLevel: '15',
      unit: 'Units',
      description: '',
      supplier: suppliers[0]?._id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      SKU: product.SKU,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice || '',
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      unit: product.unit || 'Units',
      description: product.description || '',
      supplier: product.supplier?._id || product.supplier || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
        showToast(`Product '${formData.title}' updated successfully!`, 'success');
      } else {
        await api.createProduct(formData);
        showToast(`Product '${formData.title}' added to catalog!`, 'success');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete product '${title}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteProduct(id);
      showToast('Product deleted successfully', 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const exportToExcel = () => {
    const dataToExport = products.map((p) => ({
      'Product Title': p.title,
      'SKU': p.SKU,
      'Category': p.category,
      'Price ($)': p.price,
      'Cost ($)': p.costPrice || 0,
      'Current Stock': p.stock,
      'Reorder Threshold': p.reorderLevel,
      'Unit': p.unit,
      'Status': p.stock <= p.reorderLevel ? 'LOW STOCK ALERT' : 'Normal',
      'Supplier': p.supplier?.name || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Inventory');
    XLSX.writeFile(workbook, `ERP_Products_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Exported product inventory report to Excel successfully!', 'success');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={26} color="#4f46e5" />
            Product & Inventory Catalog
          </h1>
          <p className="page-subtitle">
            Manage SKUs, stock thresholds, pricing, and replenishment alerts
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportToExcel}>
            <Download size={15} /> Export Excel
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} /> Add New Product
            </button>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <form onSubmit={handleSearchSubmit} className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by title, SKU, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: lowStockOnly ? '#ef4444' : '#64748b' }}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
              <AlertTriangle size={15} color={lowStockOnly ? '#ef4444' : '#94a3b8'} />
              Low Stock Only
            </label>
          </div>
        </div>

        {/* Products Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Title</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Stock / Status</th>
                <th>Reorder Level</th>
                {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isLow = p.stock <= p.reorderLevel;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.title}</div>
                        {p.description && (
                          <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          {p.SKU}
                        </code>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{p.category}</span>
                      </td>
                      <td style={{ color: '#64748b' }}>${p.costPrice ? p.costPrice.toFixed(2) : '0.00'}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>${p.price.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                          {isLow && <AlertTriangle size={12} />}
                          {p.stock} {p.unit}
                          {isLow ? ' (Low Stock)' : ' In Stock'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{p.reorderLevel} {p.unit}</td>
                      {canManage && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn-icon"
                              title="Edit Product"
                              onClick={() => openEditModal(p)}
                            >
                              <Edit2 size={15} />
                            </button>
                            {canDelete && (
                              <button
                                className="btn-icon"
                                title="Delete Product"
                                style={{ color: '#ef4444' }}
                                onClick={() => handleDelete(p._id, p.title)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No products found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing {products.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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
        title={editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
        icon={Package}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Product Title *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Industrial ARM Cortex Microcontroller M4"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">SKU (Stock Keeping Unit) *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. ELEC-MCU-01"
                  value={formData.SKU}
                  onChange={(e) => setFormData({ ...formData, SKU: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Electronics, Hardware"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measure</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pieces, Units, Boxes"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="28.50"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="form-input"
                  placeholder="45.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Initial Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  placeholder="50"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Level Threshold *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  placeholder="15"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Supplier</label>
              <select
                className="form-select"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              >
                <option value="">None / Direct Sourced</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Notes</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Product specs, technical details or storage requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Save Product Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
