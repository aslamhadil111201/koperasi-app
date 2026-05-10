import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const ProtectedRoute = ({ children, requiredRole }) => {
  const currentUser = useStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
    // Redirect to dashboard if role is insufficient (admin can access everything)
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
