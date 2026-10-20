import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import {
  DollarSign,
  TrendingDown,
  Package,
  AlertTriangle,
  ShoppingCart,
  FileCheck2,
  Receipt,
  Users,
  Building2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);
  };

  const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '15px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw className="spin" size={18} />
          Loading real-time enterprise metrics...
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Enterprise Operations Dashboard
          </h1>
          <p className="page-subtitle">
            Executive overview of inventory, procurement, revenue, and active fulfillment
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={loadStats}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/sales-orders')}>
            <ShoppingCart size={15} /> New Sales Order
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <MetricCard
          title="Total Sales Revenue"
          value={formatCurrency(metrics.totalSalesRevenue)}
          subtitle={`${metrics.totalSalesOrders || 0} total sales orders`}
          icon={DollarSign}
          color="#10b981"
          trend={14.2}
        />

        <MetricCard
          title="Procurement Spend"
          value={formatCurrency(metrics.totalPurchaseSpend)}
          subtitle={`${metrics.totalPurchaseOrders || 0} purchase orders`}
          icon={TrendingDown}
          color="#6366f1"
        />

        <MetricCard
          title="Inventory Valuation"
          value={formatCurrency(metrics.totalInventoryValue)}
          subtitle={`${metrics.totalInventoryUnits || 0} units across ${metrics.totalProducts || 0} SKUs`}
          icon={Package}
          color="#0ea5e9"
        />

        <MetricCard
          title="Low Stock Alerts"
          value={metrics.lowStockCount || 0}
          subtitle="Items requiring immediate reorder"
          icon={AlertTriangle}
          color="#ef4444"
          isAlert={metrics.lowStockCount > 0}
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Sales vs Purchase Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Revenue & Procurement Trends</h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Monthly comparison (USD)</p>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#10b981" fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="purchases" name="Procurement" stroke="#6366f1" fillOpacity={1} fill="url(#purchaseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Inventory by Category</h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Distribution of stock units</p>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoryBreakdown || []}
                  dataKey="stock"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  {(data?.categoryBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} units`, 'Stock']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Low Stock Alert & Recent Sales Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* Critical Low Stock Table */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#ef4444" />
              <h3 className="card-title">Critical Low Stock Items</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products?lowStock=true')}>
              View All Low Stock
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.lowStockItems?.length > 0 ? (
                  data.lowStockItems.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.title}</td>
                      <td><code>{item.SKU}</code></td>
                      <td>
                        <span className="badge badge-danger">
                          {item.stock} {item.unit}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{item.reorderLevel} {item.unit}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/purchase-orders')}
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#10b981' }}>
                      ✓ All products are currently above their reorder thresholds!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales Orders */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} color="#4f46e5" />
              <h3 className="card-title">Recent Sales Orders</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sales-orders')}>
              View All Orders
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentSales?.length > 0 ? (
                  data.recentSales.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 700, color: '#4f46e5' }}>{order.orderNumber}</td>
                      <td>{order.customer?.name || 'Walk-in'}</td>
                      <td style={{ fontWeight: 600 }}>${order.grandTotal?.toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === 'Delivered'
                              ? 'badge-success'
                              : order.status === 'Cancelled'
                              ? 'badge-danger'
                              : 'badge-primary'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No recent sales orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
