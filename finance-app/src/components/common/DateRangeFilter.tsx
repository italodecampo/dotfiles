import { Calendar } from 'lucide-react'
import type { DateFilter, Transaction } from '../../types'
import { getAvailablePeriods } from '../../utils/dateFilter'

interface DateRangeFilterProps {
  transactions: Transaction[]
  value: DateFilter
  onChange: (filter: DateFilter) => void
}

function filterToValue(filter: DateFilter): string {
  if (filter.type === 'all') return 'all'
  if (filter.type === 'year') return `year-${filter.year}`
  return `month-${filter.year}-${filter.month}`
}

function valueToFilter(value: string): DateFilter {
  if (value === 'all') return { type: 'all' }
  const parts = value.split('-')
  if (parts[0] === 'year') return { type: 'year', year: Number(parts[1]) }
  return { type: 'month', year: Number(parts[1]), month: Number(parts[2]) }
}

export function DateRangeFilter({ transactions, value, onChange }: DateRangeFilterProps) {
  const periods = getAvailablePeriods(transactions)

  return (
    <div className="relative">
      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <select
        value={filterToValue(value)}
        onChange={(e) => onChange(valueToFilter(e.target.value))}
        className="pl-8 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 appearance-none text-slate-700 cursor-pointer min-w-40"
      >
        <option value="all">All Time</option>
        {periods.map(({ year, months }) => (
          <optgroup key={year} label={String(year)}>
            <option value={`year-${year}`}>{year} (Full Year)</option>
            {months.map(({ month, label }) => (
              <option key={month} value={`month-${year}-${month}`}>{label} {year}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
