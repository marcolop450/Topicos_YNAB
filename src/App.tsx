import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BudgetProvider } from './context/BudgetContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Vistas Públicas
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Vistas de Cliente
import { OnboardingPage } from './pages/OnboardingPage';
import { BudgetPage } from './pages/BudgetPage';
import { AccountsPage } from './pages/AccountsPage';
import { BankSimulatorPage } from './pages/BankSimulatorPage';

// Vistas de Administración
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BudgetProvider>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Asistente de Incorporación de Cliente (Protegido) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Área de Aplicación para Clientes (Protegida) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/budget" replace />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="bank-simulator" element={<BankSimulatorPage />} />
            </Route>

            {/* Consola de Administración (Protegida solo para rol 'admin') */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
              <Route path="support" element={<AdminSupportPage />} />
            </Route>

            {/* Ruta por Defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BudgetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
