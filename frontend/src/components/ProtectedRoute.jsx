import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '14px', color: '#64748b' }}>Verifying session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = user?.role === 'admin' || allowedRoles.includes(user?.role);
    if (!hasPermission) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '450px', margin: '0 auto 20px' }}>
            Your current role (<strong>{user?.role}</strong>) does not have permission to access this module. Contact your ERP Administrator or switch to an authorized role.
          </p>
        </div>
      );
    }
  }

  return children;
};
