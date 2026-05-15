import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategoryStats } from '../../types'

interface CategoryDonutProps {
  data: CategoryStats[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700">{d.category}</p>
      <p className="text-slate-500 mt-0.5">
        R {d.total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-slate-400">{d.percentage.toFixed(1)}% of expenses</p>
    </div>
  )
}

export function CategoryDonut({ data }: CategoryDonutProps) {
  const top = data.slice(0, 6)
  const otherTotal = data.slice(6).reduce((s, d) => s + d.total, 0)
  const chartData =
    otherTotal > 0
      ? [...top, { category: 'Other', total: otherTotal, count: 0, percentage: 0, color: '#94A3B8' }]
      : top

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Spending by Category</h3>
      <div className="flex items-center gap-4">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="total"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {chartData.map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 text-xs truncate flex-1">{item.category}</span>
              <span className="text-slate-400 text-xs shrink-0">
                {item.percentage > 0 ? `${item.percentage.toFixed(0)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
