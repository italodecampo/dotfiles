import { useState } from 'react'
import type { Transaction, ViewType } from './types'
import { Sidebar } from './components/Layout/Sidebar'
import { UploadView } from './components/Upload/UploadView'
import { DashboardView } from './components/Dashboard/DashboardView'
import { TransactionsView } from './components/Transactions/TransactionsView'
import { SubscriptionsView } from './components/Subscriptions/SubscriptionsView'
import { CategoriesView } from './components/Categories/CategoriesView'

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [view, setView] = useState<ViewType>('upload')

  function handleUpload(txs: Transaction[]) {
    setTransactions(txs)
    setView('dashboard')
  }

  const hasData = transactions.length > 0

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar view={view} onNavigate={setView} hasData={hasData} />

      <main className="flex-1 ml-60 min-h-screen">
        {view === 'upload' && <UploadView onUpload={handleUpload} />}
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
      </main>
    </div>
  )
}
