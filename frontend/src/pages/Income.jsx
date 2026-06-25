import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import { formatCurrency, formatDate, todayISO } from '../utils/format'
import Modal from '../components/Modal'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CURRENCIES = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD']
const INCOME_TYPES = ['one-time', 'recurring']
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#06b6d4', '#8b5cf6']
const EMPTY_FORM = { description: '', amount: '', currency: '', source_id: '', type: 'one-time', is_recurring: false, date: todayISO(), notes: '' }

export default function Income() {
  const { user } = useAuth()
  const cur = user?.preferred_currency || 'THB'
  const [incomes, setIncomes] = useState([])
  const [sources, setSources] = useState([])
  const [summary, setSummary] = useState(null)
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, currency: cur })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [filters, setFilters] = useState({ search: '', source_id: '', date_from: '', date_to: '', page: 1, per_page: 10 })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    try {
      const [incRes, sumRes] = await Promise.all([
        api.get(`/income/?${params}`),
        api.get('/income/summary?period=this_month'),
      ])
      setIncomes(incRes.data || [])
      setMeta(incRes.meta || {})
      setSummary(sumRes.data)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    api.get('/income/sources').then(r => setSources(r.data || []))
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, currency: cur })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (inc) => {
    setEditItem(inc)
    setForm({
      description: inc.description, amount: String(inc.amount), currency: inc.currency,
      source_id: inc.source_id || '', type: inc.type, is_recurring: inc.is_recurring,
      date: inc.date, notes: inc.notes || '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = { ...form, amount: parseFloat(form.amount), source_id: form.source_id || null }
      if (editItem) {
        await api.put(`/income/${editItem.id}`, body)
      } else {
        await api.post('/income/', body)
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/income/${deleteId}`)
      setDeleteId(null)
      fetchAll()
    } catch (err) {
      alert(err.message)
    }
  }

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setFilter = (k) => (e) => setFilters(p => ({ ...p, [k]: e.target.value, page: 1 }))
  const pieData = summary?.by_source || []

  return (
    <div className="space-y-5 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Income</h1>
          <p className="text-gray-500 text-sm">Track and manage all your income sources in one place.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Add Income
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card flex flex-col justify-center">
          <p className="text-lg font-bold text-gray-700 dark:text-white">Total Income</p>
          <p className="font-display font-bold text-xl text-green-600">{formatCurrency(summary?.total || 0, cur)}</p>
          <p className="text-xs text-gray-400">This month</p>
        </div>
        <div className="stat-card flex flex-col justify-center">
          <p className="text-lg font-bold text-gray-700 dark:text-white">Transactions</p>
          <p className="font-display font-bold text-xl">{summary?.count || 0}</p>
          <p className="text-xs text-gray-400">This month</p>
        </div>
        <div className="stat-card flex flex-col justify-center">
          <p className="text-lg font-bold text-gray-700 dark:text-white">Active Sources</p>
          <p className="font-display font-bold text-xl">{sources.length}</p>
          <p className="text-xs text-gray-400">Total sources</p>
        </div>
        <div className="stat-card col-span-2 lg:col-span-1">
          <p className="text-lg font-bold text-gray-700 dark:text-white ">By Source</p>
          {pieData.length > 0 ? (
            <div className="flex flex-col h-full">
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie data={pieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, cur)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 </div>">
              <span className="text-3xl"></span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="input-field col-span-2 md:col-span-1" placeholder="Search description…"
            value={filters.search} onChange={setFilter('search')} />
          <select className="input-field" value={filters.source_id} onChange={setFilter('source_id')}>
            <option value="">All Sources</option>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" className="input-field" value={filters.date_from} onChange={setFilter('date_from')} />
          <input type="date" className="input-field" value={filters.date_to} onChange={setFilter('date_to')} />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 dark:bg-slate-800 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white  uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white  uppercase tracking-wide">Source</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white  uppercase tracking-wide">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white  uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-white  uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
                  Loading…
                </td></tr>
              ) : incomes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <span className="text-4xl block mb-2"></span>No income entries found
                </td></tr>
              ) : incomes.map(inc => (
                <tr key={inc.id} className="border-b border-gray-50 hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500 dark:text-white whitespace-nowrap">{formatDate(inc.date)}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-green-100 text-green-700">{inc.source_name || 'Other'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800 dark:text-white">{inc.description}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`badge ${inc.type === 'recurring' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                      {inc.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-green-600 whitespace-nowrap">
                    +{formatCurrency(inc.amount, inc.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(inc)} className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setDeleteId(inc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Showing {((filters.page-1)*filters.per_page)+1}–{Math.min(filters.page*filters.per_page,meta.total)} of {meta.total}</p>
            <div className="flex gap-2">
              <button disabled={filters.page<=1} onClick={()=>setFilters(p=>({...p,page:p.page-1}))} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Previous</button>
              <button disabled={filters.page>=meta.pages} onClick={()=>setFilters(p=>({...p,page:p.page+1}))} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <input className="input-field" value={form.description} onChange={setF('description')} placeholder="e.g. Monthly salary" required />
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
              <select className="input-field" value={form.source_id} onChange={setF('source_id')}>
                <option value="">Select source</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input type="date" className="input-field" value={form.date} onChange={setF('date')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select className="input-field" value={form.type} onChange={setF('type')}>
                {INCOME_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" id="inc-recurring" checked={form.is_recurring}
                onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))} className="accent-primary-500" />
              <label htmlFor="inc-recurring" className="text-sm text-gray-700">Recurring income</label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={setF('notes')} placeholder="Optional notes…" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editItem ? 'Update' : 'Add Income'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Income" size="sm">
        <p className="text-gray-600 dark:text-white mb-6">Are you sure you want to delete this income entry? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
