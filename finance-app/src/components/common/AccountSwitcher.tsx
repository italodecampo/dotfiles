import { Wallet } from 'lucide-react'
import type { Account } from '../../types'

interface AccountSwitcherProps {
  accounts: Account[]
  value: string | 'all'
  onChange: (id: string | 'all') => void
}

export function AccountSwitcher({ accounts, value, onChange }: AccountSwitcherProps) {
  return (
    <div className="relative">
      <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 appearance-none text-slate-700 cursor-pointer min-w-44"
      >
        <option value="all">All Accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </div>
  )
}
