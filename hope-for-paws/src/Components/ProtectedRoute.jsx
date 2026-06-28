import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    // Not logged in, redirect to sign in
    return <Navigate to="/signin" replace />;
  }

  // Determine user role
  let currentRole = 'buyer'; // Default regular user
  if (user.isAdmin) {
    currentRole = 'admin';
  } else if (user.isSeller) {
    currentRole = 'seller';
  } else if (user.isVet) {
    currentRole = 'vet';
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    // Role not authorized
    if (currentRole === 'seller') {
      return <Navigate to="/seller/dashboard" replace />; // redirect to seller dashboard
    }
    if (currentRole === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
