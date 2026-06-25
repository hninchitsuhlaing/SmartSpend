import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md', className='' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white dark:bg-slate-700 rounded-2xl shadow-2xl w-full ${sizes[size]} animate-fadeInUp max-h-[90vh] flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100  text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
