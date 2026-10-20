import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ExternalLink, UserCheck, Shield, Sparkles } from 'lucide-react';

export const Topbar = () => {
  const { user, quickLoginAs } = useAuth();
  const { showToast } = useToast();

  const handleQuickSwitch = async (role) => {
    try {
      await quickLoginAs(role);
      showToast(`Switched active role to: ${role.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(`Failed to switch to ${role}: ${err.message}`, 'error');
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      className="app-topbar"
    >
      {/* Left: Quick Switcher banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          <Sparkles size={16} color="#6366f1" />
          <span>Quick Role Switch:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { role: 'admin', label: 'Admin', color: '#ef4444' },
            { role: 'sales', label: 'Sales', color: '#10b981' },
            { role: 'purchase', label: 'Purchase', color: '#f59e0b' },
            { role: 'inventory', label: 'Inventory', color: '#3b82f6' },
          ].map((item) => {
            const isActive = user?.role === item.role;
            return (
              <button
                key={item.role}
                onClick={() => handleQuickSwitch(item.role)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isActive ? `1.5px solid ${item.color}` : '1px solid #e2e8f0',
                  backgroundColor: isActive ? `${item.color}15` : '#ffffff',
                  color: isActive ? item.color : '#475569',
                  transition: 'all 150ms ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: API Docs Link & User Profile Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#4f46e5',
            backgroundColor: '#eef2ff',
            padding: '6px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            border: '1px solid #c7d2fe',
            transition: 'background 150ms ease',
          }}
        >
          <ExternalLink size={14} />
          Swagger API Docs
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            API Connected
          </span>
        </div>
      </div>
    </header>
  );
};
