// src/components/RequireAuth.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading…</div>;
  if (!user) {
    // send them to `/login` but keep the place they were trying to go in state
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
