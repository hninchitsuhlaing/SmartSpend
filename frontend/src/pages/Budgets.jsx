import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import { formatCurrency, firstOfMonthISO } from '../utils/format'
import Modal from '../components/Modal'

const CURRENCIES = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD']
const PERIODS = ['monthly', 'weekly', 'yearly', 'custom']
const EMPTY_FORM = { name: '', amount: '', currency: '', category_id: '', period: 'monthly', start_date: firstOfMonthISO(), end_date: '' }

export default function Budgets() {
  const { user } = useAuth()
  const cur = user?.preferred_currency || 'THB'
  const [budgets, setBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, currency: cur })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/budgets/'),
        api.get('/budgets/summary'),
      ])
      setBudgets(bRes.data || [])
      setSummary(sRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])
  useEffect(() => {
    api.get('/expenses/categories').then(r => setCategories(r.data || []))
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, currency: cur })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (b) => {
    setEditItem(b)
    setForm({
      name: b.name, amount: String(b.amount), currency: b.currency,
      category_id: b.category_id || '', period: b.period,
      start_date: b.start_date || firstOfMonthISO(), end_date: b.end_date || '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = { ...form, amount: parseFloat(form.amount), category_id: form.category_id || null, end_date: form.end_date || null }
      if (editItem) {
        await api.put(`/budgets/${editItem.id}`, body)
      } else {
        await api.post('/budgets/', body)
      }
      setModalOpen(false)
      fetchBudgets()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/budgets/${deleteId}`)
      setDeleteId(null)
      fetchBudgets()
    } catch (err) {
      alert(err.message)
    }
  }

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const statusStyle = (status) => ({
    on_track: { bar: 'bg-primary-500', badge: 'bg-primary-100 text-primary-700', label: 'On Track' },
    at_risk: { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', label: 'At Risk' },
    over: { bar: 'bg-red-400', badge: 'bg-red-100 text-red-700', label: 'Over Budget' },
  }[status] || { bar: 'bg-primary-500', badge: 'bg-gray-100 text-gray-600', label: 'Unknown' })

  return (
    <div className="space-y-5 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-500 text-sm">Plan, track, and manage your budgets with ease.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Create Budget
        </button>
      </div>

      {/* Summary row */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Budgets', value: summary.total_categories },
            { label: 'On Track', value: summary.on_track },
            { label: 'At Risk', value: summary.at_risk },
            { label: 'Over Budget', value: summary.over_budget },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-lg font-display text-gray-700 dark:text-white">{s.label}</p>
              <p className="font-display font-bold text-xl">{s.value}</p>
              
            </div>
          ))}
        </div>
      )}

      {/* Budget cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-5xl mb-3"></span>
          <p className="font-medium">No budgets yet</p>
          <p className="text-sm mt-1">Create your first budget to start tracking spending.</p>
          <button onClick={openAdd} className="btn-primary mt-4">Create Budget</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const st = statusStyle(b.status)
            return (
              <div key={b.id} className="card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{b.name}</h3>
                      <p className="text-xs text-gray-400 ">{b.category_name || 'All categories'} · {b.period}</p>
                    </div>
                  
                    <span className={`badge text-xs ${st.badge}`}>{st.label}</span>
                  
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-white">Spent</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(b.spent, b.currency)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${st.bar}`}
                      style={{ width: `${Math.min(b.progress, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{b.progress.toFixed(0)}% used</span>
                    <span>Budget: {formatCurrency(b.amount, b.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-gray-500">Remaining</span>
                    <span className={`font-semibold ${b.remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(b.remaining), b.currency)}{b.remaining < 0 ? ' over' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button onClick={() => openEdit(b)} className="btn-secondary flex-1 py-1.5 text-xs">Edit</button>
                  <button onClick={() => setDeleteId(b.id)} className="btn-secondary flex-1 py-1.5 text-xs text-red-500 hover:bg-red-50 hover:border-red-200">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Budget' : 'Create Budget'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-white">Budget Name *</label>
              <input className="input-field" value={form.name} onChange={setF('name')} placeholder="e.g. Monthly Food Budget" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Amount *</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.amount} onChange={setF('amount')} placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Currency</label>
              <select className="input-field" value={form.currency} onChange={setF('currency')}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Category</label>
              <select className="input-field" value={form.category_id} onChange={setF('category_id')}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Period</label>
              <select className="input-field" value={form.period} onChange={setF('period')}>
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">Start Date *</label>
              <input type="date" className="input-field" value={form.start_date} onChange={setF('start_date')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">End Date</label>
              <input type="date" className="input-field" value={form.end_date} onChange={setF('end_date')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editItem ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Budget" size="sm">
        <p className="text-gray-600 dark:text-white mb-6">Are you sure you want to delete this budget? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
