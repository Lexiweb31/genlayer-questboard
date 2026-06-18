import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAllQuests } from '../hooks/useQuests'
import { useTxHistory } from '../hooks/useTxHistory'
import { useWallet } from '../hooks/useClient'
import { QuestCard } from '../components/QuestCard'
import { CategoryBadge } from '../components/CategoryBadge'
import { CreateQuestModal } from '../components/CreateQuestModal'
import { HeroText } from '../components/HeroText'
import { PageTransition, StaggerList, cardVariants, cardTransition } from '../components/PageTransition'
import { CATEGORIES, type Category } from '../types'

interface Props {
  onOpenPicker: () => void
  txHistory: ReturnType<typeof useTxHistory>
}


export function HomePage({ onOpenPicker, txHistory }: Props) {
  const navigate = useNavigate()
  const { address, connecting, writeClient } = useWallet()
  const { quests, loading, refresh } = useAllQuests()

  const [showCreate, setShowCreate]         = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  const activeQuests = quests.filter(q => q.active)
  const filtered = categoryFilter === 'all' ? activeQuests : activeQuests.filter(q => q.category === categoryFilter)

  return (
    <PageTransition>
      {/* Hero */}
      <section className="pt-24 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'backOut' }}
          className="inline-flex items-center gap-2 bg-quest-purple/10 border border-quest-purple/20 text-quest-purple text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-wide uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-quest-purple animate-pulse" />
          Powered by GenLayer
        </motion.div>

        <HeroText />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.4 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          {address
            ? <button className="btn-primary px-6 py-3 text-base" onClick={() => setShowCreate(true)}>+ Post a Quest</button>
            : <button className="btn-primary px-6 py-3 text-base" onClick={onOpenPicker} disabled={connecting}>Connect Wallet</button>
          }
          <button className="btn-ghost px-6 py-3 text-base" onClick={() => navigate('/leaderboard')}>View Leaderboard</button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex items-center justify-center gap-10 mt-12"
        >
          <StatPill label="Active"    value={activeQuests.length} />
          <div className="w-px h-8 bg-quest-border" />
          <StatPill label="Completed" value={quests.filter(q => q.completed).length} />
          <div className="w-px h-8 bg-quest-border" />
          <StatPill label="Total"     value={quests.length} />
        </motion.div>
      </section>

      {/* Filter + controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="flex items-center justify-between mb-5 flex-wrap gap-3"
      >
        <div className="flex gap-2 flex-wrap">
          <FilterPill active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All</FilterPill>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`transition-all duration-200 ${categoryFilter === cat ? 'opacity-100 scale-100' : 'opacity-50 hover:opacity-80'}`}
            >
              <CategoryBadge category={cat} />
            </button>
          ))}
        </div>
        <button className="btn-ghost text-sm px-3 py-2" onClick={refresh}>↺ Refresh</button>
      </motion.div>

      {/* Quest grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          filtered={categoryFilter !== 'all'}
          onClear={() => setCategoryFilter('all')}
          onPost={address ? () => setShowCreate(true) : onOpenPicker}
          isConnected={!!address}
        />
      ) : (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(quest => (
            <motion.div key={quest.id} variants={cardVariants} transition={cardTransition}>
              <QuestCard quest={quest} onClick={() => navigate(`/quest/${quest.id}`)} />
            </motion.div>
          ))}
        </StaggerList>
      )}

      <HowItWorks />

      {showCreate && writeClient && (
        <CreateQuestModal
          writeClient={writeClient}
          onClose={() => setShowCreate(false)}
          onCreated={hash => {
            txHistory.add({ hash, fn: 'create_quest', label: 'Post new quest', timestamp: Date.now() })
            refresh()
          }}
        />
      )}
    </PageTransition>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-q-text tabular-nums">{value}</div>
      <div className="text-xs text-quest-muted mt-0.5 font-medium">{label}</div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
        active
          ? 'bg-quest-purple/15 border-quest-purple/40 text-quest-purple'
          : 'border-quest-border text-quest-muted hover:border-quest-purple/30 hover:text-q-text'
      }`}
    >
      {children}
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="h-3 bg-quest-border rounded-full w-1/3" />
      <div className="h-4 bg-quest-border rounded-full w-4/5" />
      <div className="h-3 bg-quest-border rounded-full w-full" />
    </div>
  )
}

function EmptyState({ filtered, onClear, onPost, isConnected }: {
  filtered: boolean; onClear: () => void; onPost: () => void; isConnected: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="card border-dashed text-center py-20"
    >
      <div className="text-5xl mb-4">{filtered ? '🔍' : '✦'}</div>
      <h3 className="text-q-text font-semibold text-lg mb-2">
        {filtered ? 'No quests in this category' : 'No quests yet'}
      </h3>
      <p className="text-quest-muted text-sm mb-6 max-w-xs mx-auto">
        {filtered ? 'Try a different category or clear the filter.' : 'Be the first to post a quest.'}
      </p>
      {filtered
        ? <button className="btn-ghost" onClick={onClear}>Clear filter</button>
        : <button className="btn-primary" onClick={onPost}>{isConnected ? '+ Post the First Quest' : 'Connect Wallet to Post'}</button>
      }
    </motion.div>
  )
}

function HowItWorks() {
  const steps = [
    { icon: '📋', title: 'Post a Quest',  desc: 'Set a reward, write clear requirements. The AI reads them literally.' },
    { icon: '✍️', title: 'Submit Proof',  desc: 'Anyone can submit: text, links, code — whatever proves completion.' },
    { icon: '⚡', title: 'AI Consensus',  desc: 'Multiple validators independently run an LLM and vote.' },
    { icon: '⚖️', title: 'Appeal',        desc: 'Dispute any decision. Post a bond, get a second AI round.' },
  ]
  return (
    <section className="mt-24 mb-16">
      <p className="text-center text-xs font-semibold text-quest-muted uppercase tracking-widest mb-8">How it works</p>
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <motion.div key={i} variants={cardVariants} className="card text-center hover:border-quest-purple/30 transition-colors duration-200">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="text-q-text font-semibold text-sm mb-1.5">{s.title}</div>
            <div className="text-quest-muted text-xs leading-relaxed">{s.desc}</div>
          </motion.div>
        ))}
      </StaggerList>
    </section>
  )
}
