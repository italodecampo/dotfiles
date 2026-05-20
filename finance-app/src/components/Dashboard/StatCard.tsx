import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon: ReactNode
  iconBg: string
  valueColor?: string
  trend?: { value: string; positive: boolean }
}

export function StatCard({ label, value, subtext, icon, iconBg, valueColor, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.positive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-2xl font-semibold ${valueColor ?? 'text-slate-800'}`}>{value}</p>
        {subtext && <p className="text-slate-400 text-xs mt-1">{subtext}</p>}
      </div>
    </div>
  )
}
