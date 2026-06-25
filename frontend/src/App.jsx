import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './utils/AuthContext'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
import Budgets from './pages/Budgets'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Loading SmartSpend…</span>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  useEffect(()=> {
    const theme = localStorage.getItem('theme')

    if (theme === 'dark'){
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

  },[])


  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="income" element={<Income />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
