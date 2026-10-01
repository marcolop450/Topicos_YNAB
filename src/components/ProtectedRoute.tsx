import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Si no está autenticado, redirigir a login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta requiere un rol específico (ej. admin) y no lo tiene, ir al presupuesto
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/app/budget" replace />;
  }

  return <>{children}</>;
}
