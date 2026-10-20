import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { GRNPage } from './pages/GRNPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { UsersPage } from './pages/UsersPage';

const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes wrapped in AppLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProductsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/directory"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DirectoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales-orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <AppLayout>
                    <SalesOrdersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'purchase']}>
                  <AppLayout>
                    <PurchaseOrdersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/grn"
              element={
                <ProtectedRoute allowedRoles={['admin', 'inventory', 'purchase']}>
                  <AppLayout>
                    <GRNPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <AppLayout>
                    <InvoicesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <UsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Catch-all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
