import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAllQuests } from '../hooks/useQuests'
import { QuestCard } from '../components/QuestCard'
import { CategoryBadge } from '../components/CategoryBadge'
import { PageTransition, StaggerList, cardVariants, cardTransition } from '../components/PageTransition'
import { CATEGORIES, type Category } from '../types'

export function ActiveQuestsPage() {
  const navigate = useNavigate()
  const { quests, loading, refresh } = useAllQuests()
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  const active = quests.filter(q => q.active)
  const displayed = categoryFilter === 'all' ? active : active.filter(q => q.category === categoryFilter)

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-q-text">Active Quests</h1>
          <p className="text-sm text-q-muted mt-0.5">{active.length} open for submissions</p>
        </div>
        <button className="btn-ghost text-sm px-3 py-2" onClick={refresh}>↺ Refresh</button>
      </div>

      {/* Category filter */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25 }}
        className="flex items-center gap-2 mb-6 flex-wrap"
      >
        <FilterPill active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All</FilterPill>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`transition-all duration-200 rounded-full ${
              categoryFilter === cat
                ? 'opacity-100 ring-2 ring-q-purple/30'
                : 'opacity-55 hover:opacity-90'
            }`}
          >
            <CategoryBadge category={cat} />
          </button>
        ))}
      </motion.div>

      {loading ? (
        <SkeletonGrid />
      ) : displayed.length === 0 ? (
        <div className="card border-dashed text-center py-16 text-q-muted text-sm">
          {categoryFilter !== 'all' ? (
            <>No active quests in this category.{' '}
              <button className="text-q-purple underline ml-1" onClick={() => setCategoryFilter('all')}>Clear filter</button>
            </>
          ) : 'No active quests right now.'}
        </div>
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
    <button onClick={onClick} className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
      active
        ? 'bg-q-purple/15 border-q-purple/50 text-q-purple shadow-[0_0_12px_rgba(118,116,247,0.15)]'
        : 'border-q-border text-q-muted hover:border-q-purple/40 hover:text-q-text hover:bg-q-purple/5'
    }`}>{children}</button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="card animate-pulse space-y-3 h-40">
          <div className="flex gap-2">
            <div className="h-5 w-14 bg-q-border/60 rounded-full" />
            <div className="h-5 w-20 bg-q-border/60 rounded-full" />
          </div>
          <div className="h-4 bg-q-border/60 rounded-lg w-4/5" />
          <div className="h-3 bg-q-border/40 rounded-lg w-full" />
          <div className="h-3 bg-q-border/40 rounded-lg w-3/5" />
        </div>
      ))}
    </div>
  )
}
