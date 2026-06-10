import { useState } from 'react'
import { useWallet } from './hooks/useClient'
import { useTx } from './hooks/useTx'
import { useAllQuests, useClaimable } from './hooks/useQuests'
import { useTxHistory } from './hooks/useTxHistory'
import { WalletButton } from './components/WalletButton'
import { QuestCard } from './components/QuestCard'
import { QuestDetail } from './components/QuestDetail'
import { CreateQuestModal } from './components/CreateQuestModal'
import { MyDashboard } from './components/MyDashboard'
import { TxHistoryPanel } from './components/TxHistory'
import { Leaderboard } from './components/Leaderboard'
import { CategoryBadge } from './components/CategoryBadge'
import { WalletPickerModal } from './components/WalletPickerModal'
import { CATEGORIES, type Category } from './types'

type Tab = 'active' | 'all' | 'mine' | 'leaderboard'

export default function App() {
  const { address, connecting, writeClient, connect, disconnect } = useWallet()
  const { quests, loading, refresh } = useAllQuests()
  const txHistory = useTxHistory()
  const { refresh: refreshClaimable } = useClaimable(address)

  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null)
  const [showCreate, setShowCreate]           = useState(false)
  const [showHistory, setShowHistory]         = useState(false)
  const [showPicker, setShowPicker]           = useState(false)
  const [tab, setTab]                         = useState<Tab>('active')
  const [categoryFilter, setCategoryFilter]   = useState<Category | 'all'>('all')

  const openPicker = () => setShowPicker(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withdrawTx = useTx(writeClient as any)

  const handleWithdraw = async () => {
    const hash = await withdrawTx.sendAsync('withdraw', [])
    txHistory.add({ hash, fn: 'withdraw', label: 'Withdraw claimable GEN', timestamp: Date.now() })
    refreshClaimable()
  }

  const activeQuests = quests.filter(q => q.active)
  const myQuests     = address ? quests.filter(q => q.creator.toLowerCase() === address.toLowerCase()) : []

  const baseList = tab === 'active' ? activeQuests : tab === 'mine' ? myQuests : quests
  const displayed = categoryFilter === 'all'
    ? baseList
    : baseList.filter(q => q.category === categoryFilter)

  const pendingCount = txHistory.records.filter(r => !r.finalPhase).length

  // ── Quest detail view ───────────────────────────────────────────────────────
  if (selectedQuestId !== null) {
    return (
      <div className="min-h-screen bg-quest-bg">
        <Header
          address={address} connecting={connecting}
          onConnect={openPicker} onDisconnect={disconnect}
          onWithdraw={handleWithdraw} withdrawing={withdrawTx.status === 'pending'}
          onShowHistory={() => setShowHistory(true)} pendingCount={pendingCount}
        />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <QuestDetail
            questId={selectedQuestId} address={address}
            writeClient={writeClient} txHistory={txHistory}
            onBack={() => { setSelectedQuestId(null); refresh() }}
          />
        </main>
        {showHistory && (
          <TxHistoryPanel records={txHistory.records} onClear={txHistory.clear} onClose={() => setShowHistory(false)} />
        )}
      </div>
    )
  }

  // ── Board view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-quest-bg">
      <Header
        address={address} connecting={connecting}
        onConnect={openPicker} onDisconnect={disconnect}
        onWithdraw={handleWithdraw} withdrawing={withdrawTx.status === 'pending'}
        onShowHistory={() => setShowHistory(true)} pendingCount={pendingCount}
      />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-xs text-quest-purple uppercase tracking-widest mb-2 font-semibold">Powered by GenLayer</div>
          <h1 className="text-4xl font-bold text-white mb-3">Quest<span className="text-quest-gold">Board</span></h1>
          <p className="text-quest-muted max-w-lg mx-auto text-sm leading-relaxed">
            Post quests, complete them, and let decentralized AI validators judge the outcome.
          </p>
          <div className="flex items-center justify-center gap-8 mt-4">
            <Stat label="Active"    value={activeQuests.length}                   color="text-quest-purple" />
            <Stat label="Completed" value={quests.filter(q => q.completed).length} color="text-quest-green" />
            <Stat label="Total"     value={quests.length}                           color="text-white" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 bg-quest-surface border border-quest-border rounded-lg p-1">
            <TabBtn active={tab === 'active'}      onClick={() => setTab('active')}>Active ({activeQuests.length})</TabBtn>
            <TabBtn active={tab === 'all'}         onClick={() => setTab('all')}>All</TabBtn>
            {address && (
              <TabBtn active={tab === 'mine'}      onClick={() => setTab('mine')}>Mine ({myQuests.length})</TabBtn>
            )}
            <TabBtn active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')}>🏆 Board</TabBtn>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-ghost text-sm" onClick={refresh}>Refresh</button>
            {address
              ? <button className="btn-gold text-sm" onClick={() => setShowCreate(true)}>+ Post Quest</button>
              : <button className="btn-primary text-sm" onClick={openPicker} disabled={connecting}>Connect to Post</button>
            }
          </div>
        </div>

        {/* Category filter — only on quest list tabs */}
        {tab !== 'leaderboard' && tab !== 'mine' && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-quest-purple/20 border-quest-purple text-quest-purple font-semibold'
                  : 'border-quest-border text-quest-muted hover:border-quest-purple hover:text-white'
              }`}
            >
              All categories
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`transition-all ${categoryFilter === cat ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
              >
                <CategoryBadge category={cat} />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {tab === 'leaderboard' ? (
          <Leaderboard />
        ) : tab === 'mine' && address ? (
          <MyDashboard allQuests={quests} address={address} onSelectQuest={setSelectedQuestId} />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            filtered={categoryFilter !== 'all'}
            onClear={() => setCategoryFilter('all')}
            onPost={address ? () => setShowCreate(true) : openPicker}
            isConnected={!!address}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(quest => (
              <QuestCard key={quest.id} quest={quest} onClick={() => setSelectedQuestId(quest.id)} />
            ))}
          </div>
        )}

        <HowItWorks />
      </main>

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

      {showHistory && (
        <TxHistoryPanel records={txHistory.records} onClear={txHistory.clear} onClose={() => setShowHistory(false)} />
      )}

      {showPicker && (
        <WalletPickerModal
          onSelect={provider => connect(provider)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ address, connecting, onConnect, onDisconnect, onWithdraw, withdrawing, onShowHistory, pendingCount }: {
  address: string | null
  connecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  onWithdraw: () => Promise<void>
  withdrawing: boolean
  onShowHistory: () => void
  pendingCount: number
}) {
  return (
    <header className="border-b border-quest-border bg-quest-surface/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="font-bold text-white text-lg flex-shrink-0">
          Quest<span className="text-quest-gold">Board</span>
          <span className="ml-2 text-xs text-quest-purple bg-quest-purple/10 border border-quest-purple/30 px-2 py-0.5 rounded-full">GenLayer</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              className="flex items-center gap-1.5 text-xs text-quest-purple border border-quest-purple/30 bg-quest-purple/10 px-3 py-1.5 rounded-lg hover:bg-quest-purple/20 transition-all"
              onClick={onShowHistory}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-quest-purple animate-pulse" />
              {pendingCount} pending
            </button>
          )}
          <button className="btn-ghost text-sm px-3" onClick={onShowHistory} title="Transaction History">📋</button>
          <WalletButton
            address={address} connecting={connecting}
            onConnect={onConnect} onDisconnect={onDisconnect}
            onWithdraw={onWithdraw} withdrawing={withdrawing}
          />
        </div>
      </div>
    </header>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={`px-4 py-1.5 rounded-md text-sm transition-all duration-100 ${active ? 'bg-quest-purple text-white font-semibold' : 'text-quest-muted hover:text-white'}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-quest-muted">{label}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-quest-border rounded w-3/4 mb-3" />
      <div className="h-3 bg-quest-border rounded w-full mb-2" />
      <div className="h-3 bg-quest-border rounded w-2/3" />
    </div>
  )
}

function EmptyState({ filtered, onClear, onPost, isConnected }: {
  filtered: boolean; onClear: () => void; onPost: () => void; isConnected: boolean
}) {
  return (
    <div className="card text-center py-16 border-dashed">
      <div className="text-4xl mb-4">{filtered ? '🔍' : '⚔️'}</div>
      <h3 className="text-white font-semibold mb-2">
        {filtered ? 'No quests in this category' : 'No Quests Yet'}
      </h3>
      <p className="text-quest-muted text-sm mb-5">
        {filtered ? 'Try a different category or clear the filter.' : 'Be the first to post a quest and reward adventurers.'}
      </p>
      {filtered
        ? <button className="btn-ghost" onClick={onClear}>Clear filter</button>
        : <button className="btn-gold" onClick={onPost}>{isConnected ? '+ Post the First Quest' : 'Connect Wallet to Post'}</button>
      }
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { icon: '📜', title: 'Post a Quest',    desc: 'Pick a category, set GEN reward, write clear requirements. The AI reads them literally.' },
    { icon: '⚔️', title: 'Submit Proof',    desc: 'Anyone can submit evidence: text, links, code, screenshots.' },
    { icon: '🤖', title: 'AI Consensus',    desc: 'Multiple GenLayer validators independently run an LLM. Majority vote decides.' },
    { icon: '⚖️', title: 'Appeal if Wrong', desc: "Dispute any decision with a bond. A second validator round re-evaluates with your argument." },
  ]
  return (
    <div className="mt-16">
      <h2 className="text-center text-xs font-semibold text-quest-muted uppercase tracking-widest mb-6">How It Works</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="card text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-white font-semibold text-sm mb-1">{s.title}</div>
            <div className="text-quest-muted text-xs leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
