import { useState, useEffect, useCallback } from 'react'
import { readClient } from '../hooks/useClient'
import { CONTRACT_ADDRESS } from '../config'
import { formatGEN, shortAddr } from '../hooks/useTx'
import type { LeaderboardEntry, CreatorEntry } from '../types'

type Tab = 'adventurers' | 'creators'

export function Leaderboard() {
  const [tab, setTab] = useState<Tab>('adventurers')
  const [adventurers, setAdventurers] = useState<LeaderboardEntry[]>([])
  const [creators, setCreators]       = useState<CreatorEntry[]>([])
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [adv, cre] = await Promise.all([
        readClient.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: 'get_leaderboard', args: [] }),
        readClient.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: 'get_creator_stats', args: [] }),
      ])
      setAdventurers(((adv as unknown) as LeaderboardEntry[]) ?? [])
      setCreators(((cre as unknown) as CreatorEntry[]) ?? [])
    } catch (e) {
      console.error('Leaderboard load failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Leaderboard</h2>
        <p className="text-quest-muted text-sm">Top performers across all quests</p>
      </div>

      <div className="flex gap-1 bg-quest-surface border border-quest-border rounded-lg p-1 mb-6 w-fit mx-auto">
        <TabBtn active={tab === 'adventurers'} onClick={() => setTab('adventurers')}>
          ⚔️ Adventurers
        </TabBtn>
        <TabBtn active={tab === 'creators'} onClick={() => setTab('creators')}>
          📜 Quest Creators
        </TabBtn>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-16" />
          ))}
        </div>
      ) : tab === 'adventurers' ? (
        adventurers.length === 0 ? (
          <EmptyLeaderboard msg="No quests have been won yet. Be the first!" />
        ) : (
          <div className="space-y-3">
            {adventurers.map((entry, i) => (
              <AdventurerRow key={entry.address} entry={entry} rank={i + 1} />
            ))}
          </div>
        )
      ) : (
        creators.length === 0 ? (
          <EmptyLeaderboard msg="No quests have been posted yet." />
        ) : (
          <div className="space-y-3">
            {creators.map((entry, i) => (
              <CreatorRow key={entry.address} entry={entry} rank={i + 1} />
            ))}
          </div>
        )
      )}

      <div className="text-center mt-6">
        <button className="btn-ghost text-sm" onClick={load}>Refresh</button>
      </div>
    </div>
  )
}

function AdventurerRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`text-2xl font-bold w-10 text-center flex-shrink-0 ${
        rank === 1 ? 'text-quest-gold' :
        rank === 2 ? 'text-gray-300' :
        rank === 3 ? 'text-amber-600' :
                     'text-quest-muted'
      }`}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-mono text-sm truncate">{shortAddr(entry.address)}</div>
        <div className="text-xs text-quest-muted">{entry.quests_won} quest{entry.quests_won !== 1 ? 's' : ''} won</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-quest-gold font-bold">{formatGEN(String(entry.total_gen_won))}</div>
        <div className="text-xs text-quest-muted">GEN earned</div>
      </div>
    </div>
  )
}

function CreatorRow({ entry, rank }: { entry: CreatorEntry; rank: number }) {
  const completionRate = entry.quests_posted > 0
    ? Math.round((entry.quests_completed / entry.quests_posted) * 100)
    : 0

  return (
    <div className="card flex items-center gap-4">
      <div className={`text-2xl font-bold w-10 text-center flex-shrink-0 ${
        rank === 1 ? 'text-quest-gold' :
        rank === 2 ? 'text-gray-300' :
        rank === 3 ? 'text-amber-600' :
                     'text-quest-muted'
      }`}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-mono text-sm truncate">{shortAddr(entry.address)}</div>
        <div className="text-xs text-quest-muted">
          {entry.quests_posted} posted · {completionRate}% completed
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-quest-purple font-bold">{formatGEN(String(entry.total_gen_posted))}</div>
        <div className="text-xs text-quest-muted">GEN posted</div>
      </div>
    </div>
  )
}

function EmptyLeaderboard({ msg }: { msg: string }) {
  return (
    <div className="card text-center py-12 border-dashed text-quest-muted text-sm">{msg}</div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={`px-4 py-1.5 rounded-md text-sm transition-all ${
        active ? 'bg-quest-purple text-white font-semibold' : 'text-quest-muted hover:text-white'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
