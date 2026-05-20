import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-react'
import type { Transaction, ViewType } from '../../types'
import { computeSummary, computeCategoryStats, computeMonthlyStats, formatCurrency } from '../../utils/stats'
import { StatCard } from './StatCard'
import { MonthlyChart } from './MonthlyChart'
import { CategoryDonut } from './CategoryDonut'
import { RecentTransactions } from './RecentTransactions'
import { TopSubscriptions } from './TopSubscriptions'

interface DashboardViewProps {
  transactions: Transaction[]
  onNavigate: (view: ViewType) => void
}

export function DashboardView({ transactions, onNavigate }: DashboardViewProps) {
  const summary = computeSummary(transactions)
  const categoryStats = computeCategoryStats(transactions)
  const monthlyStats = computeMonthlyStats(transactions)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        {summary.dateRange && (
          <p className="text-sm text-slate-400 mt-0.5">
            {summary.dateRange.from.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
            {' — '}
            {summary.dateRange.to.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
            {' · '}
            {summary.transactionCount} transactions
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(summary.totalIncome)}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          iconBg="#d1fae5"
          valueColor="text-emerald-600"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          icon={<TrendingDown size={18} className="text-rose-500" />}
          iconBg="#ffe4e6"
          valueColor="text-rose-500"
        />
        <StatCard
          label="Net Savings"
          value={formatCurrency(Math.abs(summary.netSavings))}
          subtext={summary.netSavings < 0 ? 'Over budget' : 'Saved'}
          icon={<Wallet size={18} className={summary.netSavings >= 0 ? 'text-indigo-600' : 'text-amber-500'} />}
          iconBg={summary.netSavings >= 0 ? '#e0e7ff' : '#fef3c7'}
          valueColor={summary.netSavings >= 0 ? 'text-indigo-600' : 'text-amber-500'}
        />
        <StatCard
          label="Savings Rate"
          value={`${summary.savingsRate.toFixed(1)}%`}
          icon={<Percent size={18} className="text-sky-500" />}
          iconBg="#e0f2fe"
          valueColor={summary.savingsRate >= 20 ? 'text-sky-600' : 'text-amber-500'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <MonthlyChart data={monthlyStats} />
        </div>
        <div>
          <CategoryDonut data={categoryStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentTransactions transactions={transactions} onNavigate={onNavigate} />
        </div>
        <div>
          <TopSubscriptions transactions={transactions} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}
