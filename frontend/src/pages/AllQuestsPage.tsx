import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAllQuests } from '../hooks/useQuests'
import { QuestCard } from '../components/QuestCard'
import { CategoryBadge } from '../components/CategoryBadge'
import { PageTransition, StaggerList, cardVariants, cardTransition } from '../components/PageTransition'
import { CATEGORIES, type Category } from '../types'

export function AllQuestsPage() {
  const navigate  = useNavigate()
  const { quests, loading, refresh } = useAllQuests()
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  const visible = quests.filter(q => q.active || q.completed)
  const displayed = categoryFilter === 'all' ? visible : visible.filter(q => q.category === categoryFilter)

  return (
    <PageTransition>
      <PageHeader title="All Quests" sub={`${visible.length} total`} onRefresh={refresh} />

      {/* Category filter */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center gap-2 mb-6 flex-wrap"
      >
        <FilterPill active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All</FilterPill>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`transition-all duration-200 ${categoryFilter === cat ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
          >
            <CategoryBadge category={cat} />
          </button>
        ))}
      </motion.div>

      {loading ? (
        <SkeletonGrid />
      ) : displayed.length === 0 ? (
        <EmptyMsg />
      ) : (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(quest => (
            <motion.div key={quest.id} variants={cardVariants} transition={cardTransition}>
              <QuestCard quest={quest} onClick={() => navigate(`/quest/${quest.id}`)} />
            </motion.div>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
      active ? 'bg-quest-purple/15 border-quest-purple/40 text-quest-purple' : 'border-quest-border text-quest-muted hover:border-quest-purple/30 hover:text-q-text'
    }`}>{children}</button>
  )
}
function SkeletonGrid() {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="card animate-pulse h-36" />)}</div>
}
function EmptyMsg() {
  return <div className="card border-dashed text-center py-16 text-quest-muted">No quests found.</div>
}
export function PageHeader({ title, sub, onRefresh }: { title: string; sub?: string; onRefresh?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="flex items-end justify-between mb-8 pb-4 border-b border-quest-border"
    >
      <div>
        <h1 className="text-2xl font-bold text-q-text">{title}</h1>
        {sub && <p className="text-sm text-quest-muted mt-0.5">{sub}</p>}
      </div>
      {onRefresh && <button className="btn-ghost text-sm px-3 py-2" onClick={onRefresh}>↺ Refresh</button>}
    </motion.div>
  )
}
