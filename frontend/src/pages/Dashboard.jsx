import { useState, useEffect } from 'react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/format'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/expenses/summary?period=this_month'),
      api.get('/income/summary?period=this_month'),
      api.get('/expenses/?per_page=5&sort_by=date&sort_order=desc'),
      api.get('/budgets/summary'),
    ]).then(([expSum, incSum, recentExp, budgetSum]) => {
      setData({
        expenseSummary: expSum.data,
        incomeSummary: incSum.data,
        recentExpenses: recentExp.data || [],
        budgetSummary: budgetSum.data,
      })
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  const totalIncome = data?.incomeSummary?.total || 0
  const totalExpense = data?.expenseSummary?.total || 0
  const balance = totalIncome - totalExpense
  const cur = user?.preferred_currency || 'THB'

  const pieData = (data?.expenseSummary?.by_category || [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
          Welcome back, {user?.full_name || user?.username} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your finances today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(balance, cur)}
          sub="All-time net balance"
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(totalIncome, cur)}
          sub="This month"
          valueColor="text-green-600"
        />
        <StatCard
          label="Total Expense"
          value={formatCurrency(totalExpense, cur)}
          sub="This month"
          valueColor="text-red-500"
        />
        <StatCard
          label="Transactions"
          value={data?.expenseSummary?.count || 0}
          sub="This month"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent spending line */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-4">Spending by Category</h3>
          {pieData.length > 0 ? (
            <div className="space-y-3">
              {pieData.map((cat, i) => {
                const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-white">{cat.name}</span>
                      <span className="text-gray-500 dark:text-white">{formatCurrency(cat.amount, cur)} <span className="text-xs">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-4xl mb-2"></span>
              <p className="text-sm">No expenses this month yet</p>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-4">Expense Breakdown</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, cur)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 dark:text-white truncate flex-1">{cat.name}</span>
                    <span className="text-gray-500 dark:text-white font-medium">{((cat.amount / totalExpense) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-4xl mb-2"></span>
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <div className="card">
          <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
          {data?.recentExpenses?.length > 0 ? (
            <div className="space-y-3">
              {data.recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{exp.description}</p>
                    <p className="text-xs text-gray-400 dark:text-white">{exp.category_name || 'Uncategorized'} · {formatDate(exp.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500 flex-shrink-0">
                    -{formatCurrency(exp.amount, exp.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2"></span>
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>

        {/* Budget progress */}
        <div className="card">
          <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white mb-4">Budget Progress</h3>
          {data?.budgetSummary?.budgets?.length > 0 ? (
            <div className="space-y-4">
              {data.budgetSummary.budgets.slice(0, 4).map(b => (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-white">{b.name}</span>
                    <span className={b.status === 'over' ? 'text-red-500 font-semibold' : b.status === 'at_risk' ? 'text-amber-500 font-semibold' : 'text-gray-500 dark:text-white'}>
                      {formatCurrency(b.spent, b.currency)} / {formatCurrency(b.amount, b.currency)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      b.status === 'over' ? 'bg-red-400' : b.status === 'at_risk' ? 'bg-amber-400' : 'bg-primary-500'
                    }`} style={{ width: `${Math.min(b.progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-white mt-0.5">{b.progress.toFixed(0)}% used</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2"></span>
              <p className="text-sm">No budgets set yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, valueColor = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="stat-card">
      <div>
        <p className="text-lg font-bold text-gray-700 dark:text-white">{label}</p>
      </div> 
        <p className={`font-display font-bold text-xl ${valueColor}`}>{value}</p>

        <p className="text-xs text-gray-400">{sub}</p>
      
    </div>
  )
}
