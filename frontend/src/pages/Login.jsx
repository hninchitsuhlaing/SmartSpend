import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import authImage from '../assets/auth-image.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 30% 20%, #fff 0%, transparent 60%), radial-gradient(circle at 80% 80%, #818cf8 0%, transparent 50%)'}} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-display font-bold text-white text-xl">SmartSpend</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Welcome back! 
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Log in to continue managing your finances with ease.
          </p>
        </div>

        <div>
          <div className='flex justify-center my-8 relative z-10'>
            <img
              src= {authImage}
              alt='SmartSpend'
              className='w-80 h-auto object-contain'
            />
          </div>
          <div className="relative z-10 space-y-3">
            {['Track expenses in real-time', 'Smart budget management', 'Income & savings overview'].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <span className="text-green-300 text-lg">✓</span>
                <span className="text-white/90 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fadeInUp">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-display font-bold text-primary-700 text-xl">SmartSpend</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900">Log in to SmartSpend</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}

function Eye() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function EyeOff() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
}
