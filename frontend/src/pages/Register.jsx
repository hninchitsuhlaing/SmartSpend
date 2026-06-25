import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import authImage from '../assets/auth-image.png'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', full_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = (pw) => {
    if (!pw) return { label: '', color: '' }
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', pct: 25 }
    if (pw.length < 8) return { label: 'Weak', color: 'bg-orange-400', pct: 50 }
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: 'Strong', color: 'bg-green-400', pct: 100 }
    return { label: 'Fair', color: 'bg-yellow-400', pct: 75 }
  }
  const pwStrength = strength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.full_name)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 30% 20%, #fff 0%, transparent 60%)'}} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-display font-bold text-white text-xl">SmartSpend</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Take control of your finances
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <img
            src={authImage}
            alt='SmartSpend'
            className='w-full max-w-md object-contain'
          />
        </div>

        <div className="relative z-10">
          <p className="text-primary-200 text-lg">
              SmartSpend helps you track expenses, manage budgets, and achieve your financial goals.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md animate-fadeInUp py-4">
          <div className="text-center mb-6">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-display font-bold text-primary-700 text-xl">SmartSpend</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">Log in</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input type="text" className="input-field" placeholder="Your full name" value={form.full_name} onChange={set('full_name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
              <input type="text" className="input-field" placeholder="Enter your username" value={form.username} onChange={set('username')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address <span className="text-red-500">*</span></label>
              <input type="email" className="input-field" placeholder="Enter your email address" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10"
                  placeholder="Create a password" value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPw
                      ? <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password strength: <span className="font-medium">{pwStrength.label}</span></p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password <span className="text-red-500">*</span></label>
              <input type="password" className="input-field" placeholder="Confirm your password"
                value={form.confirm} onChange={set('confirm')} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  )
}
