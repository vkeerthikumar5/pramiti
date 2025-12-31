import { useState } from 'react'
import Main from './pages/Main'
import { Login } from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import UserRegister from './pages/UserRegister'
import OrgRegister from './pages/OrgRegister'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import GroupDetails from './components/admin/GroupDetails'
import DocumentDetails from './components/admin/DocumentDetails'
function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Main><Login /></Main>} />
        <Route path="/register/organization" element={<OrgRegister/>} />
        <Route path="/register/user" element={<UserRegister />} />
        {/* Protected Doctor Dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        
        {/* Protected Patient Dashboard */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
