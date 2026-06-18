import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { shortAddr, formatGEN } from '../hooks/useTx'
import { useClaimable } from '../hooks/useQuests'
import { useChain, addBradburyNetwork } from '../hooks/useChain'

interface Props {
  address: string | null
  connecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  onWithdraw: () => Promise<void>
  withdrawing: boolean
}

function useUsername(address: string | null) {
  const key = address ? `qb-username-${address.toLowerCase()}` : null
  const [username, setUsername] = useState<string>('')

  // Reload from localStorage whenever the address changes (e.g. after auto-reconnect)
  useEffect(() => {
    setUsername(key ? (localStorage.getItem(key) ?? '') : '')
  }, [key])

  const save = (name: string) => {
    if (!key) return
    localStorage.setItem(key, name)
    setUsername(name)
  }

  return { username, save }
}

export function WalletButton({ address, connecting, onConnect, onDisconnect, onWithdraw, withdrawing }: Props) {
  const { amount, refresh } = useClaimable(address)
  const { username, save: saveUsername } = useUsername(address)
  const { isCorrectChain } = useChain(address)
  const navigate = useNavigate()
  const [addingNetwork, setAddingNetwork] = useState(false)

  const [open, setOpen]               = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draft, setDraft]             = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleWithdraw = async () => {
    await onWithdraw()
    refresh()
  }

  const startEdit = () => {
    setDraft(username)
    setEditingName(true)
  }

  const commitEdit = () => {
    const trimmed = draft.trim().slice(0, 32)
    if (trimmed) saveUsername(trimmed)
    setEditingName(false)
  }

  if (!address) {
    return (
      <button className="btn-primary text-[13px]" onClick={onConnect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    )
  }

  const initials = address.slice(2, 4).toUpperCase()

  const handleAddNetwork = async () => {
    setAddingNetwork(true)
    try { await addBradburyNetwork() } catch { /* user rejected */ }
    finally { setAddingNetwork(false) }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Wrong network warning */}
      {!isCorrectChain && (
        <button
          onClick={handleAddNetwork}
          disabled={addingNetwork}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-q-red/10 border border-q-red/30 text-q-red hover:bg-q-red/15 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {addingNetwork ? 'Switching…' : 'Wrong Network'}
        </button>
      )}

      {/* Claimable reward */}
      {amount > BigInt(0) && (
        <button className="btn-gold text-sm" onClick={handleWithdraw} disabled={withdrawing}>
          {withdrawing ? 'Claiming…' : `Claim ${formatGEN(amount)} GEN`}
        </button>
      )}

      {/* Wallet chip — click opens dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 text-sm transition-all duration-150 ${
            open
              ? 'bg-q-purple/10 border-q-purple/40 text-q-text'
              : 'bg-q-surface border-q-border/70 text-q-subtle hover:border-q-purple/30 hover:text-q-text'
          }`}
        >
          {/* Avatar */}
          <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <span className="font-mono text-xs font-medium">
            {username || shortAddr(address)}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-q-green flex-shrink-0" />
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
            className={`text-q-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-q-surface border border-q-border/70 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.24)] z-50 overflow-hidden">

            {/* Profile header */}
            <div className="px-4 py-4 border-b border-q-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingName(false) }}
                      className="border border-q-purple/50 rounded-lg px-2 py-1 text-sm text-q-text w-full outline-none"
                      style={{
                        background: 'rgb(var(--q-bg))',
                        WebkitBoxShadow: '0 0 0 1000px rgb(var(--q-bg)) inset',
                        colorScheme: 'dark',
                      }}
                      placeholder="Enter username…"
                      maxLength={32}
                    />
                  ) : (
                    <div className="text-sm font-semibold text-q-text truncate">
                      {username || 'Anonymous'}
                    </div>
                  )}
                  <div className="text-[11px] text-q-muted font-mono mt-0.5 truncate">{shortAddr(address)}</div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              <MenuItem
                icon={<IconUser />}
                label="View Profile"
                sub="Your quests and history"
                onClick={() => { navigate('/mine'); setOpen(false) }}
              />
              <MenuItem
                icon={<IconPen />}
                label={username ? 'Edit Username' : 'Create Username'}
                sub={username ? `@${username}` : 'Set a display name'}
                onClick={() => { startEdit(); }}
              />
            </div>

            {/* Disconnect */}
            <div className="p-1.5 border-t border-q-border/40">
              <button
                onClick={() => { onDisconnect(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-q-red hover:bg-q-red/8 transition-all text-sm font-medium group"
              >
                <span className="w-7 h-7 rounded-lg bg-q-red/10 flex items-center justify-center flex-shrink-0 group-hover:bg-q-red/15 transition-colors">
                  <IconPower />
                </span>
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function MenuItem({ icon, label, sub, onClick }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-q-border/30 transition-all text-left group"
    >
      <span className="w-7 h-7 rounded-lg bg-q-border/40 flex items-center justify-center flex-shrink-0 text-q-muted group-hover:bg-q-purple/12 group-hover:text-q-purple transition-colors">
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium text-q-text leading-tight">{label}</div>
        <div className="text-[11px] text-q-muted leading-tight mt-0.5">{sub}</div>
      </div>
    </button>
  )
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
function IconUser() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
}
function IconPen() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
}
function IconPower() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12v-2"/></svg>
}
