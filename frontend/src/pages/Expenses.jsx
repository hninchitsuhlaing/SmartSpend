import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import { formatCurrency, formatDate, todayISO } from '../utils/format'
import Modal from '../components/Modal'

const PAYMENT_METHODS = ['Cash', 'Visa', 'Mastercard', 'Bank Transfer', 'PayPal', 'Apple Pay', 'Google Pay', 'Other']
const CURRENCIES = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD']

const EMPTY_FORM = { description: '', merchant: '', amount: '', currency: '', category_id: '', payment_method: 'Cash', date: todayISO(), notes: '', is_recurring: false }

export default function Expenses() {
  const { user } = useAuth()
  const cur = user?.preferred_currency || 'THB'
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, currency: cur })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', category_id: '', date_from: '', date_to: '', sort_by: 'date', sort_order: 'desc', page: 1, per_page: 10 })
  const [deleteId, setDeleteId] = useState(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    try {
      const res = await api.get(`/expenses/?${params}`)
      setExpenses(res.data || [])
      setMeta(res.meta || {})
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  useEffect(() => {
    api.get('/expenses/categories').then(r => setCategories(r.data || []))
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, currency: cur })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (exp) => {
    setEditItem(exp)
    setForm({
      description: exp.description, merchant: exp.merchant || '', amount: String(exp.amount),
      currency: exp.currency, category_id: exp.category_id || '', payment_method: exp.payment_method,
      date: exp.date, notes: exp.notes || '', is_recurring: exp.is_recurring,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = { ...form, amount: parseFloat(form.amount), category_id: form.category_id || null }
      if (editItem) {
        await api.put(`/expenses/${editItem.id}`, body)
      } else {
        await api.post('/expenses/', body)
      }
      setModalOpen(false)
      fetchExpenses()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/expenses/${deleteId}`)
      setDeleteId(null)
      fetchExpenses()
    } catch (err) {
      alert(err.message)
    }
  }

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setFilter = (k) => (e) => setFilters(p => ({ ...p, [k]: e.target.value, page: 1 }))

  return (
    <div className="space-y-5 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-500 text-sm">Track and manage all your expenses in one place.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="input-field col-span-2 md:col-span-1" placeholder="Search description or merchant…"
            value={filters.search} onChange={setFilter('search')} />
          <select className="input-field" value={filters.category_id} onChange={setFilter('category_id')}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" className="input-field" placeholder="From" value={filters.date_from} onChange={setFilter('date_from')} />
          <input type="date" className="input-field" placeholder="To" value={filters.date_to} onChange={setFilter('date_to')} />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 dark:bg-slate-800 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide hidden md:table-cell">Payment</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
                  Loading…
                </td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <span className="text-4xl block mb-2"></span>No expenses found
                </td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="border-b border-gray-50 hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500 dark:text-white whitespace-nowrap">{formatDate(exp.date)}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge text-xs" style={{ backgroundColor: (exp.category_color || '#6366f1') + '20', color: exp.category_color || '#6366f1' }}>
                      {exp.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800 dark:text-white">{exp.description}</p>
                    {exp.merchant && <p className="text-xs text-gray-400">{exp.merchant}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-white hidden md:table-cell">{exp.payment_method}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-red-500 whitespace-nowrap">
                    -{formatCurrency(exp.amount, exp.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors">
                        <EditIcon />
                      </button>
                      <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Showing {((filters.page - 1) * filters.per_page) + 1}–{Math.min(filters.page * filters.per_page, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Previous</button>
              <button disabled={filters.page >= meta.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Expense' : 'Add Expense'} className="mt-60">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <input className="input-field" value={form.description} onChange={setF('description')} placeholder="e.g. Grocery run" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Merchant</label>
              <input className="input-field" value={form.merchant} onChange={setF('merchant')} placeholder="e.g. Big C" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input type="date" className="input-field" value={form.date} onChange={setF('date')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.amount} onChange={setF('amount')} placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select className="input-field" value={form.currency} onChange={setF('currency')}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select className="input-field" value={form.category_id} onChange={setF('category_id')}>
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
              <select className="input-field" value={form.payment_method} onChange={setF('payment_method')}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={setF('notes')} placeholder="Optional notes…" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={form.is_recurring}
                onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))} className="accent-primary-500" />
              <label htmlFor="recurring" className="text-sm text-gray-700">Recurring expense</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editItem ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this expense? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  )
}

function EditIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
}
