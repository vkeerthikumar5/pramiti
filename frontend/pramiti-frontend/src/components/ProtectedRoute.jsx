import React from "react";
import { Navigate } from "react-router-dom";


export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("userRole");
  

  // 🚫 If no JWT token found
  if (!token) {
    return <Navigate to="/login" replace />;
  }

 
  

  // 🚫 If role doesn't match
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Access granted
  return children;
}
