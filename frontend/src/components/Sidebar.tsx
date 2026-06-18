import { NavLink, useNavigate } from 'react-router-dom'
import { displayName } from '../hooks/useTx'

interface Props {
  address: string | null
  balance: string | null
  dark: boolean
  open: boolean
  onClose: () => void
  onToggleTheme: () => void
  onOpenPicker: () => void
  onDisconnect: () => void
}

const navGroups = [
  {
    items: [
      { to: '/',            exact: true, label: 'Overview',    icon: <IconGrid /> },
      { to: '/leaderboard',             label: 'Leaderboard', icon: <IconTrophy /> },
    ],
  },
  {
    heading: 'Quests',
    items: [
      { to: '/active', label: 'Active',     icon: <IconZap /> },
      { to: '/all',    label: 'All',        icon: <IconList /> },
      { to: '/post',   label: 'Post Quest', icon: <IconPlus /> },
    ],
  },
  {
    heading: 'My Account',
    items: [
      { to: '/mine', label: 'My Quests', icon: <IconUser /> },
    ],
  },
  {
    heading: 'Info',
    items: [
      { to: '/help', label: 'Help', icon: <IconHelp /> },
    ],
  },
]

export function Sidebar({ address, balance, dark, open, onClose, onToggleTheme, onOpenPicker, onDisconnect }: Props) {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 ${
      isActive
        ? 'bg-q-purple/12 text-q-text font-semibold'
        : 'text-q-muted font-medium hover:text-q-text hover:bg-q-border/25'
    }`

  const handleNavClick = () => {
    if (open) onClose()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-[220px] bg-q-sidebar border-r border-q-border/60 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L22 7v10L12 22 2 17V7L12 2z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-q-text text-[13px] leading-tight">QuestBoard</div>
              <div className="text-[9px] text-q-muted/70 leading-tight mt-px">Powered by GenLayer</div>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-q-muted hover:text-q-text hover:bg-q-border/30 transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.heading && (
                <p className="section-label px-2 mb-1.5">{group.heading}</p>
              )}
              <div className="space-y-px">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'exact' in item ? item.exact : false}
                    className={linkCls}
                    onClick={handleNavClick}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-q-purple' : 'text-q-muted/70'}>{item.icon}</span>
                        <span>{item.label}</span>
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-q-purple flex-shrink-0" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-q-border/50 px-3 py-3 space-y-1">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium text-q-muted hover:text-q-text hover:bg-q-border/30 transition-all"
          >
            {dark ? <><SunIcon /><span>Switch to Light</span></> : <><MoonIcon /><span>Switch to Dark</span></>}
          </button>

          {address ? (
            <>
              {balance !== null && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-q-gold/8 border border-q-gold/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-q-gold flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-q-gold flex-1 truncate">{balance} GEN</span>
                </div>
              )}
              <button
                onClick={onDisconnect}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-q-muted hover:text-q-text hover:bg-q-border/30 transition-all group"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-primary flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white">
                  {address.slice(2, 4).toUpperCase()}
                </div>
                <span className="font-mono text-[11px] truncate flex-1">{displayName(address)}</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-40 transition-opacity">✕</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenPicker}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium text-q-muted hover:text-q-text hover:bg-q-border/30 transition-all"
            >
              <IconUser /><span>Connect Wallet</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

/* ── Mobile bottom nav ─────────────────────────────────────────────────────── */
export function MobileBottomNav({ onOpenPicker, address }: { onOpenPicker: () => void; address: string | null }) {
  const navigate = useNavigate()
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
      isActive ? 'text-q-purple' : 'text-q-muted'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-q-sidebar border-t border-q-border/60 flex items-center justify-around px-2 pb-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <NavLink to="/" end className={linkCls}>
        {({ isActive }) => <><IconGrid2 active={isActive} /><span>Home</span></>}
      </NavLink>
      <NavLink to="/active" className={linkCls}>
        {({ isActive }) => <><IconZap2 active={isActive} /><span>Active</span></>}
      </NavLink>
      <button
        onClick={() => address ? navigate('/post') : onOpenPicker()}
        className="flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium text-q-text"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow -mt-5 mb-0.5">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <span>Post</span>
      </button>
      <NavLink to="/mine" className={linkCls}>
        {({ isActive }) => <><IconUser2 active={isActive} /><span>Mine</span></>}
      </NavLink>
      <NavLink to="/leaderboard" className={linkCls}>
        {({ isActive }) => <><IconTrophy2 active={isActive} /><span>Board</span></>}
      </NavLink>
    </nav>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function IconGrid()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> }
function IconTrophy() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M8 21h8M12 17v4" /><path d="M7 4H4a1 1 0 00-1 1v3a5 5 0 005 5h0a5 5 0 005-5V5a1 1 0 00-1-1H7z" /><path strokeLinecap="round" d="M17 4h3a1 1 0 011 1v3a5 5 0 01-5 5h0" /></svg> }
function IconZap()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z" /></svg> }
function IconList()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> }
function IconUser()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg> }
function IconPlus()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg> }
function IconHelp()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg> }
function SunIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> }
function MoonIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg> }

function IconGrid2({ active }: { active: boolean })   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> }
function IconZap2({ active }: { active: boolean })    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z" /></svg> }
function IconUser2({ active }: { active: boolean })   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg> }
function IconTrophy2({ active }: { active: boolean }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}><path strokeLinecap="round" d="M8 21h8M12 17v4" /><path d="M7 4H4a1 1 0 00-1 1v3a5 5 0 005 5h0a5 5 0 005-5V5a1 1 0 00-1-1H7z" /><path strokeLinecap="round" d="M17 4h3a1 1 0 011 1v3a5 5 0 01-5 5h0" /></svg> }
