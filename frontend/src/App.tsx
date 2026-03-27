import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CivilsPage from './pages/Civils'
import CivilDetail from './pages/CivilDetail'
import AmendePage from './pages/Amendes'
import GavPage from './pages/Gav'
import PvPage from './pages/Pv'
import PvDetail from './pages/PvDetail'
import AdminPage from './pages/Admin'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, isAdmin } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/civils" element={<PrivateRoute><Layout><CivilsPage /></Layout></PrivateRoute>} />
      <Route path="/civils/:id" element={<PrivateRoute><Layout><CivilDetail /></Layout></PrivateRoute>} />
      <Route path="/amendes" element={<PrivateRoute><Layout><AmendePage /></Layout></PrivateRoute>} />
      <Route path="/gav" element={<PrivateRoute><Layout><GavPage /></Layout></PrivateRoute>} />
      <Route path="/pv" element={<PrivateRoute><Layout><PvPage /></Layout></PrivateRoute>} />
      <Route path="/pv/:id" element={<PrivateRoute><Layout><PvDetail /></Layout></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
