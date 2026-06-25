import { useState, useEffect } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'

const TABS = ['Profile', 'Security', 'Preferences']
const CURRENCIES = [
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
]
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
const TIMEZONES = ['Asia/Bangkok', 'Asia/Tokyo', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC']
const COUNTRIES = ['Thailand', 'Japan', 'Singapore', 'United Kingdom', 'United States', 'Australia', 'Other']

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')

  return (
    <div className="space-y-5 animate-fadeInUp">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile, security, and preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-primary-100 ">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab ? 'bg-white dark:bg-slate-800 text-primary-700 shadow-sm' : 'text-gray-500 dark:text-white hover:text-gray-700 '
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Profile' && <ProfileTab user={user} refreshUser={refreshUser} />}
      {activeTab === 'Security' && <SecurityTab />}
      {activeTab === 'Preferences' && <PreferencesTab user={user} refreshUser={refreshUser} />}
    </div>
  )
}

/* ── Profile Tab ─────────────────────────────────────────── */
function ProfileTab({ user, refreshUser }) {
  const [form, setForm] = useState({
    full_name: '', username: '', phone: '', country: '', date_of_birth: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'success'|'error', text }

  useEffect(() => {
    if (user) setForm({
      full_name: user.full_name || '',
      username: user.username || '',
      phone: user.phone || '',
      country: user.country || 'Thailand',
      date_of_birth: user.date_of_birth || '',
    })
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      await api.put('/settings/profile', form)
      await refreshUser()
      setMsg({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Avatar card */}
      <div className="card flex flex-col items-center gap-3 py-8">
        <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">{user?.full_name || user?.username}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className="badge bg-primary-100 text-primary-700 mt-1.5 capitalize">{user?.plan || 'free'} Plan</span>
        </div>
        <div className="w-full border-t border-gray-50 pt-3 space-y-2 text-sm">
          <div className="flex justify-between px-2"><span className="text-gray-400">Member since</span><span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}</span></div>
          <div className="flex justify-between px-2"><span className="text-gray-400">Status</span><span className="text-green-600 font-medium">Active</span></div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card lg:col-span-2">
        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-4">Personal Information</h3>
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Full Name</label>
              <input className="input-field" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Username</label>
              <input className="input-field" value={form.username} onChange={set('username')} placeholder="Username" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Email Address</label>
              <input className="input-field bg-gray-50 cursor-not-allowed" value={user?.email || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Phone Number</label>
              <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+66 XX XXX XXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Date of Birth</label>
              <input type="date" className="input-field" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Country</label>
              <select className="input-field" value={form.country} onChange={set('country')}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Security Tab ────────────────────────────────────────── */
function SecurityTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const strength = (pw) => {
    if (!pw) return null
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', pct: 25 }
    if (pw.length < 8) return { label: 'Weak', color: 'bg-orange-400', pct: 50 }
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: 'Strong', color: 'bg-green-400', pct: 100 }
    return { label: 'Fair', color: 'bg-yellow-400', pct: 75 }
  }
  const pwStrength = strength(form.new_password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (form.new_password !== form.confirm_password)
      return setMsg({ type: 'error', text: 'New passwords do not match.' })
    setSaving(true)
    try {
      await api.post('/settings/change-password', form)
      setMsg({ type: 'success', text: 'Password changed successfully.' })
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const toggleShow = (k) => setShowPw(p => ({ ...p, [k]: !p[k] }))

  

  return (
    <div className="max-w-lg">
      <div className="card">
        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-1">Change Password</h3>
        <p className="text-sm text-gray-400 mb-4">Choose a strong password to secure your account.</p>
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">
              Current Password
            </label>

            <div className="relative">
              <input
                type={showPw.current ? 'text' : 'password'}
                className="input-field pr-10"
                value={form.current_password}
                onChange={set('current_password')}
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                onClick={() => toggleShow('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <EyeIcon open={showPw.current} />
              </button>
            </div>
          </div>
          
 
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">New Password</label>
            <div className="relative">
              <input type={showPw.new ? 'text' : 'password'} className="input-field pr-10"
                value={form.new_password} onChange={set('new_password')} placeholder="••••••••" required />
              <button type="button" onClick={() => toggleShow('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showPw.new} />
              </button>
            </div>
            {pwStrength && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Strength: <span className="font-medium">{pwStrength.label}</span></p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input type={showPw.confirm ? 'text' : 'password'} className="input-field pr-10"
                value={form.confirm_password} onChange={set('confirm_password')} placeholder="••••••••" required />
              <button type="button" onClick={() => toggleShow('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showPw.confirm} />
              </button>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Preferences Tab ─────────────────────────────────────── */
function PreferencesTab({ user, refreshUser }) {
  const [form, setForm] = useState({
    preferred_currency: 'THB', theme: 'light', date_format: 'DD/MM/YYYY', timezone: 'Asia/Bangkok',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (user) setForm({
      preferred_currency: user.preferred_currency || 'THB',
      theme: user.theme || 'light',
      date_format: user.date_format || 'DD/MM/YYYY',
      timezone: user.timezone || 'Asia/Bangkok',
    })
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      await api.put('/settings/preferences', form)
      await refreshUser()
      setMsg({ type: 'success', text: 'Preferences saved.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Currency & locale */}
      <div className="card">
        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-1">Currency & Locale</h3>
        <p className="text-sm text-gray-400 mb-4">Set your default currency for all transactions and reports.</p>
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Default Currency</label>
            <select className="input-field" value={form.preferred_currency} onChange={set('preferred_currency')}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Date Format</label>
            <select className="input-field" value={form.date_format} onChange={set('date_format')}>
              {DATE_FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Time Zone</label>
            <select className="input-field" value={form.timezone} onChange={set('timezone')}>
              {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Save Preferences
          </button>
        </form>
      </div>

      {/* Theme */}
      <div className="card">
        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-1">Theme Settings</h3>
        <p className="text-sm text-gray-400  mb-4">Customize the appearance of your dashboard.</p>
        <div className="space-y-3">
          {[
            { value: 'light', label: 'Light', desc: 'Clean and bright', icon: '☀️' },
            { value: 'dark', label: 'Dark', desc: 'Easy on the eyes', icon: '🌙' },
          ].map(t => (
            <label key={t.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              form.theme === t.value ? 'border-primary-400 bg-primary-50 dark:bg-slate-700' : 'border-gray-100 hover:border-gray-200 '
            }`}>
              <input type="radio" name="theme" value={t.value} checked={form.theme === t.value}
                onChange={(e) => {
                  const theme = e.target.value
                  setForm(p => ({ ...p, theme }))
                  localStorage.setItem('theme', theme)
                  if (theme === 'dark'){
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                }} 
                className="accent-primary-500" />
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="font-medium text-gray-800 dark:text-white text-sm">{t.label}</p>
                <p className="text-xs text-gray-400 ">{t.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function EyeIcon({ open }) {
  return open
    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
