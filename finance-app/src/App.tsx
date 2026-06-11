import { useEffect, useMemo, useState } from 'react'
import type { Account, DateFilter, Transaction, ViewType } from './types'
import { Sidebar } from './components/Layout/Sidebar'
import { UploadView, type UploadTarget } from './components/Upload/UploadView'
import { DashboardView } from './components/Dashboard/DashboardView'
import { TransactionsView } from './components/Transactions/TransactionsView'
import { SubscriptionsView } from './components/Subscriptions/SubscriptionsView'
import { CategoriesView } from './components/Categories/CategoriesView'
import { AccountsView } from './components/Accounts/AccountsView'
import { TaxesView } from './components/Taxes/TaxesView'
import { AccountSwitcher } from './components/common/AccountSwitcher'
import { DateRangeFilter } from './components/common/DateRangeFilter'
import { simpleId, finalizeTransactions } from './utils/parseHelpers'
import { filterTransactionsByDate } from './utils/dateFilter'
import {
  loadAccounts, saveAccounts, loadSelectedAccountId, saveSelectedAccountId,
  loadDateFilter, saveDateFilter,
} from './utils/storage'

const TOOLBAR_VIEWS: ViewType[] = ['dashboard', 'transactions', 'subscriptions', 'categories']

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts())
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>(() => loadSelectedAccountId())
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => loadDateFilter())
  const [view, setView] = useState<ViewType>(() => (loadAccounts().length > 0 ? 'dashboard' : 'upload'))

  useEffect(() => { saveAccounts(accounts) }, [accounts])
  useEffect(() => { saveDateFilter(dateFilter) }, [dateFilter])

  // Fall back to "All Accounts" if the selected account was deleted.
  const effectiveAccountId = selectedAccountId === 'all' || accounts.some((a) => a.id === selectedAccountId)
    ? selectedAccountId
    : 'all'

  useEffect(() => { saveSelectedAccountId(effectiveAccountId) }, [effectiveAccountId])

  const hasData = accounts.length > 0

  const baseTransactions = useMemo<Transaction[]>(() => {
    if (effectiveAccountId === 'all') return accounts.flatMap((a) => a.transactions)
    return accounts.find((a) => a.id === effectiveAccountId)?.transactions ?? []
  }, [accounts, effectiveAccountId])

  const transactions = useMemo(
    () => filterTransactionsByDate(baseTransactions, dateFilter),
    [baseTransactions, dateFilter]
  )

  function handleUpload(txs: Transaction[], target: UploadTarget) {
    if (target.type === 'new') {
      const newAccount: Account = {
        id: simpleId(),
        name: target.name,
        transactions: txs,
        createdAt: new Date().toISOString(),
      }
      setAccounts((prev) => [...prev, newAccount])
      setSelectedAccountId(newAccount.id)
    } else {
      setAccounts((prev) => prev.map((a) =>
        a.id === target.id
          ? { ...a, transactions: finalizeTransactions([...a.transactions, ...txs]) }
          : a
      ))
      setSelectedAccountId(target.id)
    }
    setView('dashboard')
  }

  function handleRenameAccount(id: string, name: string) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
  }

  function handleDeleteAccount(id: string) {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id)
      if (next.length === 0) setView('upload')
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar view={view} onNavigate={setView} hasData={hasData} />

      <main className="flex-1 ml-60 min-h-screen">
        {hasData && TOOLBAR_VIEWS.includes(view) && (
          <div className="flex items-center justify-end gap-3 px-6 pt-6">
            <AccountSwitcher accounts={accounts} value={effectiveAccountId} onChange={setSelectedAccountId} />
            <DateRangeFilter transactions={baseTransactions} value={dateFilter} onChange={setDateFilter} />
          </div>
        )}

        {view === 'upload' && <UploadView accounts={accounts} onUpload={handleUpload} />}
        {view === 'dashboard' && hasData && (
          <DashboardView transactions={transactions} onNavigate={setView} />
        )}
        {view === 'transactions' && hasData && (
          <TransactionsView transactions={transactions} />
        )}
        {view === 'subscriptions' && hasData && (
          <SubscriptionsView transactions={transactions} />
        )}
        {view === 'categories' && hasData && (
          <CategoriesView transactions={transactions} />
        )}
        {view === 'accounts' && (
          <AccountsView
            accounts={accounts}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onRename={handleRenameAccount}
            onDelete={handleDeleteAccount}
            onNavigate={setView}
          />
        )}
        {view === 'taxes' && (
          <TaxesView transactions={baseTransactions} />
        )}
      </main>
    </div>
  )
}
