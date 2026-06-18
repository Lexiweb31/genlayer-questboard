import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SplashScreen } from './components/SplashScreen'
import { useWallet } from './hooks/useClient'
import { useTx } from './hooks/useTx'
import { useBalance } from './hooks/useBalance'
import { useClaimable } from './hooks/useQuests'
import { usePendingWatcher } from './hooks/usePendingWatcher'
import { useTxHistory } from './hooks/useTxHistory'
import { Sidebar, MobileBottomNav } from './components/Sidebar'
import { useTheme } from './hooks/useTheme'
import { TxHistoryPanel } from './components/TxHistory'
import { WalletPickerModal } from './components/WalletPickerModal'
import { WalletButton } from './components/WalletButton'
import { OverviewPage } from './pages/OverviewPage'
import { AllQuestsPage } from './pages/AllQuestsPage'
import { ActiveQuestsPage } from './pages/ActiveQuestsPage'
import { MinePage } from './pages/MinePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { QuestPage } from './pages/QuestPage'
import { PostQuestPage } from './pages/PostQuestPage'
import { HelpPage } from './pages/HelpPage'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen key="splash" onDone={() => setSplashDone(true)} />}
      </AnimatePresence>
      {splashDone && (
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      )}
    </>
  )
}

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { address, connecting, writeClient, connect, disconnect } = useWallet()
  const txHistory = useTxHistory()
  const { refresh: refreshClaimable } = useClaimable(address)
  const { balance } = useBalance(address)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withdrawTx = useTx(writeClient as any)

  const { dark, toggle: toggleTheme } = useTheme()

  const [showHistory, setShowHistory]   = useState(false)
  const [showPicker, setShowPicker]     = useState(false)
  const [mobileMenu, setMobileMenu]     = useState(false)

  const openPicker = () => setShowPicker(true)
  const goPost = () => writeClient ? navigate('/post') : openPicker()
  const pendingCount = txHistory.records.filter(r => !r.finalPhase).length

  const handleWithdraw = async () => {
    const hash = await withdrawTx.sendAsync('withdraw', [])
    txHistory.add({ hash, fn: 'withdraw', label: 'Withdraw claimable GEN', timestamp: Date.now() })
    refreshClaimable()
  }

  const handleTxFinalized = useCallback(async (record: { fn?: string }, phase: string) => {
    if (record.fn === 'cancel_quest' && (phase === 'ACCEPTED' || phase === 'FINALIZED')) {
      try {
        const hash = await withdrawTx.sendAsync('withdraw', [])
        txHistory.add({ hash, fn: 'withdraw', label: 'Auto-withdraw after cancel', timestamp: Date.now() })
        refreshClaimable()
      } catch { /* nothing to withdraw or wallet disconnected */ }
    }
    refreshClaimable()
    // Refresh quest lists on any finalized tx that changes contract state
    if (['create_quest', 'cancel_quest', 'evaluate_submission', 'submit_proof', 'creator_evaluate'].includes(record.fn ?? '')) {
      window.dispatchEvent(new Event('questboard:refresh'))
    }
  }, [withdrawTx, txHistory, refreshClaimable])

  usePendingWatcher(txHistory.records, txHistory.update, handleTxFinalized)

  return (
    <div className="min-h-screen bg-q-bg flex">
      <Sidebar
        address={address}
        balance={balance}
        dark={dark}
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        onToggleTheme={toggleTheme}
        onOpenPicker={openPicker}
        onDisconnect={disconnect}
      />

      {/* Main — full width on mobile, offset on desktop */}
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-[52px] border-b border-q-border/60 bg-q-sidebar/95 backdrop-blur-xl flex items-center px-4 md:px-6 gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-q-muted hover:text-q-text hover:bg-q-border/40 transition-all flex-shrink-0"
            onClick={() => setMobileMenu(true)}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search — hidden on mobile */}
          <div className="hidden md:block flex-1 max-w-xs">
            <div className="flex items-center gap-2 border border-q-border/40 rounded-xl px-3 h-8 bg-white/[0.04]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-q-muted/50 flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                placeholder="Search quests…"
                className="border-none outline-none text-sm text-q-text placeholder:text-q-muted/40 flex-1 min-w-0"
                style={{ background: 'transparent', WebkitBoxShadow: '0 0 0 1000px transparent inset', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Right zone */}
          <div className="flex items-center gap-2 ml-auto">
            {pendingCount > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-q-purple bg-q-purple/10 border border-q-purple/20 px-2.5 py-1 rounded-lg hover:bg-q-purple/15 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-q-purple animate-pulse" />
                <span className="hidden sm:inline">{pendingCount} pending</span>
                <span className="sm:hidden">{pendingCount}</span>
              </button>
            )}

            <button onClick={() => setShowHistory(true)} className="w-8 h-8 flex items-center justify-center rounded-lg text-q-muted hover:text-q-text hover:bg-q-border/40 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="w-px h-5 bg-q-border/60 hidden md:block" />

            <button onClick={goPost} className="btn-primary text-[13px] px-4 h-8 hidden md:flex">
              Post a Quest
            </button>

            <WalletButton
              address={address} connecting={connecting}
              onConnect={openPicker} onDisconnect={disconnect}
              onWithdraw={handleWithdraw} withdrawing={withdrawTx.status === 'pending'}
            />
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/"            element={<OverviewPage />} />
              <Route path="/active"      element={<ActiveQuestsPage />} />
              <Route path="/all"         element={<AllQuestsPage />} />
              <Route path="/mine"        element={<MinePage address={address} onOpenPicker={openPicker} />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/post"        element={<PostQuestPage writeClient={writeClient} onOpenPicker={openPicker} onCreated={(hash: string) => txHistory.add({ hash, fn: 'create_quest', label: 'Post new quest', timestamp: Date.now() })} />} />
              <Route path="/quest/:id"   element={<QuestPage address={address} writeClient={writeClient} txHistory={txHistory} />} />
              <Route path="/help"        element={<HelpPage />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav address={address} onOpenPicker={openPicker} />

      {/* Overlays */}
      {showHistory && (
        <TxHistoryPanel records={txHistory.records} onClear={txHistory.clear} onClose={() => setShowHistory(false)} />
      )}
      {showPicker && (
        <WalletPickerModal onSelect={p => connect(p)} onClose={() => setShowPicker(false)} />
      )}
    </div>
  )
}
