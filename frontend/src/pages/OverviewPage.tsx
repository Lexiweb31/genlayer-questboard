import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAllQuests } from '../hooks/useQuests'
import { QuestCard } from '../components/QuestCard'
import { HeroText } from '../components/HeroText'
import { PageTransition, StaggerList, cardVariants, cardTransition } from '../components/PageTransition'
import { formatGEN, displayName } from '../hooks/useTx'
import { readClient } from '../hooks/useClient'
import { CONTRACT_ADDRESS } from '../config'
import { useState, useEffect, useCallback } from 'react'
import type { LeaderboardEntry } from '../types'

export function OverviewPage() {
  const navigate = useNavigate()
  const { quests, loading } = useAllQuests()


  const activeQuests    = quests.filter(q => q.active)
  const completedQuests = quests.filter(q => q.completed)
  const visibleQuests   = quests.filter(q => q.active || q.completed)
  const totalReward     = visibleQuests.reduce((s, q) => s + BigInt(q.reward || 0), BigInt(0))

  const stats = [
    {
      label: 'Active Quests',
      value: activeQuests.length,
      sub: 'open for submissions',
      color: '#6366F1',
      bg: 'rgba(99,102,241,0.08)',
      icon: <IconZap />,
      onClick: () => navigate('/active'),
    },
    {
      label: 'Completed',
      value: completedQuests.length,
      sub: 'AI-validated wins',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
      icon: <IconCheck />,
      onClick: () => navigate('/all'),
    },
    {
      label: 'Total Posted',
      value: visibleQuests.length,
      sub: 'all time',
      color: '#94A3B8',
      bg: 'rgba(148,163,184,0.08)',
      icon: <IconList />,
      onClick: () => navigate('/all'),
    },
    {
      label: 'Total Rewards',
      value: formatGEN(totalReward),
      sub: 'GEN in active & completed',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
      icon: <IconCoin />,
      isText: true,
      onClick: () => navigate('/leaderboard'),
    },
  ]

  return (
    <PageTransition>
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl mb-8 min-h-[230px] flex items-end bg-q-surface">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-q-purple/15 via-transparent to-transparent" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-q-purple/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 w-60 h-60 bg-indigo-400/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 p-8 sm:p-10 w-full">
          <HeroText />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.4 }}
            className="flex items-center gap-3 mt-1"
          >
            <button className="btn-primary px-5 py-2.5 text-sm" onClick={() => navigate('/active')}>
              Browse Quests →
            </button>
            <button className="btn-ghost px-5 py-2.5 text-sm" onClick={() => navigate('/leaderboard')}>
              Leaderboard
            </button>
          </motion.div>
        </div>
      </div>

      {/* GenLayer Live — stats */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-q-green animate-pulse" />
        <span className="text-xs font-semibold text-q-text uppercase tracking-wider">Live Stats</span>
        <span className="text-xs text-q-muted ml-1">— click to explore</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
      >
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </motion.div>

      {/* Active Quests section */}
      <Section
        title="Active Quests"
        sub={`${activeQuests.length} open for submissions`}
        onViewAll={() => navigate('/active')}
        loading={loading}
        empty={activeQuests.length === 0}
        emptyMsg="No active quests right now — be the first to post one."
      >
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeQuests.slice(0, 6).map(q => (
            <motion.div key={q.id} variants={cardVariants} transition={cardTransition}>
              <QuestCard quest={q} onClick={() => navigate(`/quest/${q.id}`)} />
            </motion.div>
          ))}
        </StaggerList>
      </Section>

      {/* Recent Winners */}
      {completedQuests.length > 0 && (
        <Section
          title="Recent Winners"
          sub="AI-validated completions"
          onViewAll={() => navigate('/all')}
          loading={false}
          empty={false}
        >
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedQuests.slice(0, 3).map(q => (
              <motion.div key={q.id} variants={cardVariants} transition={cardTransition}>
                <QuestCard quest={q} onClick={() => navigate(`/quest/${q.id}`)} />
              </motion.div>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Trending Adventurers */}
      <TrendingAdventurers onViewAll={() => navigate('/leaderboard')} />
    </PageTransition>
  )
}

/* ── Stat Card ─────────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, color, bg, icon, isText, onClick }: {
  label: string; value: number | string; sub: string
  color: string; bg: string; icon: React.ReactNode
  isText?: boolean; onClick: () => void
}) {
  const [ripple, setRipple] = useState(false)

  const handleClick = () => {
    setRipple(true)
    setTimeout(() => setRipple(false), 500)
    onClick()
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="relative overflow-hidden bg-q-surface border border-q-border/70 rounded-2xl p-5 cursor-pointer group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {/* Ripple flash on click */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0.18 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ backgroundColor: color }}
          />
        )}
      </AnimatePresence>

      {/* Hover border accent */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${color}35` }}
      />

      {/* Eyebrow — icon establishes context (Hierarchy principle) */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Dominant value (Hierarchy: largest element = most important) */}
      <div className={`font-bold tabular-nums text-q-text leading-none mb-1 ${isText ? 'text-2xl' : 'text-4xl'}`}>
        {value}
      </div>

      {/* Primary label */}
      <div className="text-xs font-semibold text-q-subtle">{label}</div>

      {/* Secondary description — clearly smallest (Hierarchy) */}
      <div className="text-[10px] text-q-muted mt-0.5">{sub}</div>
    </motion.div>
  )
}

/* ── Trending Adventurers ──────────────────────────────────────────────────── */

function TrendingAdventurers({ onViewAll }: { onViewAll: () => void }) {
  const [list, setList] = useState<LeaderboardEntry[]>([])

  const load = useCallback(() => {
    readClient
      .readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: 'get_leaderboard', args: [] })
      .then(raw => setList(((raw as unknown) as LeaderboardEntry[]) ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  if (list.length === 0) return null

  return (
    <Section title="Trending Adventurers" sub="Top GEN earners on the board" onViewAll={onViewAll} loading={false} empty={false}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {list.slice(0, 8).map((entry, i) => (
          <motion.div
            key={entry.address}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex-shrink-0 w-44 bg-q-surface border border-q-border rounded-2xl p-4 text-center hover:border-q-purple/40 hover:-translate-y-0.5 transition-all duration-200 cursor-default shadow-card"
          >
            <div className="relative w-11 h-11 mx-auto mb-3">
              <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white shadow-glow-sm">
                {entry.address.slice(2, 4).toUpperCase()}
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-q-card border border-q-border flex items-center justify-center text-[9px] font-bold text-q-muted">
                {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
              </div>
            </div>
            <div className="text-xs text-q-text font-mono truncate">{displayName(entry.address)}</div>
            <div className="text-q-gold font-bold text-sm mt-1">{formatGEN(String(entry.total_gen_won))}</div>
            <div className="text-[10px] text-q-muted mt-0.5">{entry.quests_won} quest{entry.quests_won !== 1 ? 's' : ''} won</div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

/* ── Section wrapper ───────────────────────────────────────────────────────── */

function Section({ title, sub, onViewAll, loading, empty, emptyMsg, children }: {
  title: string; sub?: string; onViewAll?: () => void
  loading: boolean; empty: boolean; emptyMsg?: string
  children?: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-10"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-q-text font-semibold text-base">{title}</h2>
          {sub && <p className="text-xs text-q-muted mt-0.5">{sub}</p>}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-q-purple hover:text-q-text transition-colors font-medium flex items-center gap-1">
            View all <span className="text-[10px]">→</span>
          </button>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-36" />)}
        </div>
      ) : empty ? (
        <div className="card border-dashed text-center py-10 text-q-muted text-sm">{emptyMsg ?? 'Nothing here yet.'}</div>
      ) : children}
    </motion.section>
  )
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconZap()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg> }
function IconCheck() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
function IconList()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> }
function IconCoin()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v10M9.5 9.5C9.5 8.1 10.6 7 12 7s2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5 1.1-2.5 2.5S10.6 17 12 17s2.5-1.1 2.5-2.5"/></svg> }
