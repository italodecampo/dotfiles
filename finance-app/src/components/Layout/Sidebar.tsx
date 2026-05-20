import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCcw,
  Tags,
  Upload,
  TrendingUp,
} from 'lucide-react'
import type { ViewType } from '../../types'

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={18} /> },
  { id: 'subscriptions', label: 'Subscriptions', icon: <RefreshCcw size={18} /> },
  { id: 'categories', label: 'Categories', icon: <Tags size={18} /> },
]

interface SidebarProps {
  view: ViewType
  onNavigate: (view: ViewType) => void
  hasData: boolean
}

export function Sidebar({ view, onNavigate, hasData }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-100 flex flex-col z-10">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <div>
          <div className="font-semibold text-slate-800 text-sm">FinanceTrack</div>
          <div className="text-slate-400 text-xs">Personal Finance</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.id
          const isDisabled = !hasData && item.id !== 'upload'
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onNavigate(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : isDisabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <span className={isActive ? 'text-indigo-600' : ''}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={() => onNavigate('upload')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
            ${view === 'upload'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
          <span className={view === 'upload' ? 'text-indigo-600' : ''}>
            <Upload size={18} />
          </span>
          Upload Statement
        </button>
      </div>
    </aside>
  )
}
