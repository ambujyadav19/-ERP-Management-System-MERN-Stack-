import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Truck,
  FileCheck2,
  Receipt,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'sales', 'purchase', 'inventory'],
    },
    {
      to: '/products',
      label: 'Products & Stock',
      icon: Package,
      roles: ['admin', 'sales', 'purchase', 'inventory'],
    },
    {
      to: '/directory',
      label: 'Customers & Vendors',
      icon: Building2,
      roles: ['admin', 'sales', 'purchase', 'inventory'],
    },
    {
      to: '/sales-orders',
      label: 'Sales Orders',
      icon: ShoppingCart,
      roles: ['admin', 'sales'],
    },
    {
      to: '/purchase-orders',
      label: 'Purchase Orders',
      icon: Truck,
      roles: ['admin', 'purchase'],
    },
    {
      to: '/grn',
      label: 'Goods Receipt (GRN)',
      icon: FileCheck2,
      roles: ['admin', 'inventory', 'purchase'],
    },
    {
      to: '/invoices',
      label: 'Invoices & Billing',
      icon: Receipt,
      roles: ['admin', 'sales'],
    },
    {
      to: '/admin/users',
      label: 'User Management',
      icon: ShieldCheck,
      roles: ['admin'],
      adminBadge: 'Admin',
    },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        borderRight: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
      }}
      className="app-sidebar"
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
          }}
        >
          E
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Enterprise ERP
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            MERN Core Suite
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 10px' }}>
          Operations & Modules
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isAuthorized = hasRole(...item.roles);
            if (!isAuthorized && item.adminBadge) return null;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(79, 70, 229, 0.25)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  transition: 'all 150ms ease',
                })}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.adminBadge && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontWeight: 700,
                    }}
                  >
                    {item.adminBadge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Info & Role Banner */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0b1120',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: 'white',
              textTransform: 'uppercase',
            }}
          >
            {user?.name ? user.name.slice(0, 2) : 'US'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'ERP User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor:
                    user?.role === 'admin'
                      ? 'rgba(239, 68, 68, 0.25)'
                      : user?.role === 'sales'
                      ? 'rgba(16, 185, 129, 0.25)'
                      : user?.role === 'purchase'
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(59, 130, 246, 0.25)',
                  color:
                    user?.role === 'admin'
                      ? '#fca5a5'
                      : user?.role === 'sales'
                      ? '#6ee7b7'
                      : user?.role === 'purchase'
                      ? '#fcd34d'
                      : '#93c5fd',
                }}
              >
                {user?.role || 'Guest'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{user?.department}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '7px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            color: '#fca5a5',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
