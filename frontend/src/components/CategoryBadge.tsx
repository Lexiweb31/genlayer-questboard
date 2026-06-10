import { CATEGORY_META, type Category } from '../types'

export function CategoryBadge({ category, size = 'sm' }: { category: Category; size?: 'sm' | 'xs' }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other
  const cls = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${cls} ${meta.color}`}>
      <span>{meta.icon}</span>
      <span className="capitalize">{category}</span>
    </span>
  )
}
