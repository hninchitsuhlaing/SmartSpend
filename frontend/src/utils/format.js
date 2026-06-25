export function formatCurrency(amount, currency = 'THB') {
  const symbols = {
    THB: '฿', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
    SGD: 'S$', AUD: 'A$', CAD: 'C$', CNY: '¥', KRW: '₩',
  }
  const symbol = symbols[currency] || currency
  const num = Number(amount || 0)
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr, format = 'DD/MM/YYYY') {
  if (!dateStr) return '—'
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''))
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`
  return `${day}/${month}/${year}`
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function firstOfMonthISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function getCurrencySymbol(code) {
  const symbols = {
    THB: '฿', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
    SGD: 'S$', AUD: 'A$', CAD: 'C$', CNY: '¥', KRW: '₩',
  }
  return symbols[code] || code
}
