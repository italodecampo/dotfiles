import type { Category } from '../../types'
import { CATEGORY_COLORS } from '../../utils/categorizer'

interface BadgeProps {
  category: Category
  size?: 'sm' | 'md'
}

export function Badge({ category, size = 'md' }: BadgeProps) {
  const color = CATEGORY_COLORS[category] ?? '#94A3B8'
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${padding}`}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {category}
    </span>
  )
}
