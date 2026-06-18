import { motion } from 'framer-motion'
import { PageTransition } from '../components/PageTransition'

export function HelpPage() {
  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-q-text">Help & Overview</h1>
          <p className="text-sm text-q-muted mt-1">Everything you need to know before you post or complete a quest.</p>
        </div>

        <div className="space-y-4">
          <Card delay={0.05} icon={<IconGenLayer />} title="What is GenLayer?" accent="purple">
            <p>
              GenLayer is a new kind of blockchain where smart contracts can <strong className="text-q-text">think</strong>.
              Instead of just running simple math rules, contracts on GenLayer can ask an AI to read text, make judgements,
              and reach a decision — then record that decision on-chain permanently.
            </p>
            <p className="mt-2">
              Think of it like a judge that never sleeps, never takes bribes, and reaches a verdict that every node on
              the network agrees on through AI consensus.
            </p>
          </Card>

          <Card delay={0.1} icon={<IconQuestBoard />} title="What is QuestBoard?" accent="indigo">
            <p>
              QuestBoard is a bounty platform built on GenLayer. Anyone can post a quest — a challenge with a reward
              locked inside. Anyone else can try to complete it. When someone submits their answer, the AI judge reads
              both the quest requirements and the submission, then decides: pass or fail.
            </p>
            <p className="mt-2">
              No human moderator. No arguing. No waiting for someone to check. The AI decides, the blockchain records it,
              and the reward is paid out automatically.
            </p>
          </Card>

          <Card delay={0.15} icon={<IconFlow />} title="How does it work?" accent="green">
            <Steps steps={[
              { label: 'Post a Quest', desc: 'Write a challenge, set the requirements clearly, and lock a GEN reward. The smarter your requirements, the fairer the AI judgment.' },
              { label: 'Someone submits', desc: 'Any wallet can submit a proof — a piece of text, a link, or a solution that meets your requirements.' },
              { label: 'AI judges it', desc: 'GenLayer\'s AI validators read the requirements and the submission side by side. They reach consensus and decide: approved or rejected.' },
              { label: 'Reward is paid', desc: 'If approved, the reward instantly transfers to the winner\'s wallet. If rejected, the submitter can try again or appeal.' },
            ]} />
          </Card>

          <Card delay={0.2} icon={<IconWhy />} title="Why does this matter?" accent="gold">
            <p>
              Traditional bounty platforms need a trusted middleman — someone who reviews submissions, decides winners,
              and can be bribed, biased, or just slow. QuestBoard removes that entirely.
            </p>
            <p className="mt-2">
              The AI judge is consistent, available 24/7, and its decisions are recorded forever on a public blockchain.
              Creators know their reward is safe. Submitters know the rules are enforced fairly.
              <strong className="text-q-text"> No middlemen. No bias. Just consensus.</strong>
            </p>
          </Card>

          <Card delay={0.25} icon={<IconTips />} title="Tips for posting a good quest" accent="purple">
            <ul className="space-y-2 text-q-muted text-sm leading-relaxed">
              {[
                'Be specific in your requirements — vague requirements lead to vague judgements.',
                'Use bullet points in the requirements field so the AI can check each one clearly.',
                'The AI reads your requirements exactly as written, so fix typos and be direct.',
                'Set a reward worth the effort — higher rewards attract better submissions.',
                'You can cancel a quest and get your reward back if no one submits.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-q-purple/15 border border-q-purple/20 flex items-center justify-center text-[10px] font-bold text-q-purple flex-shrink-0 mt-0.5">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={0.3} icon={<IconGloss />} title="Quick glossary" accent="subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { word: 'GEN',         def: 'The native currency of GenLayer. Used to lock rewards.' },
                { word: 'Quest',       def: 'A challenge posted with a locked reward.' },
                { word: 'Submission',  def: 'An answer to a quest that the AI will evaluate.' },
                { word: 'AI Validators', def: 'GenLayer nodes that run AI to reach consensus on decisions.' },
                { word: 'Appeal',      def: 'If you think the AI was wrong, you can request a second look.' },
                { word: 'On-chain',    def: 'Stored permanently and publicly on the blockchain.' },
              ].map(({ word, def }) => (
                <div key={word} className="bg-q-bg rounded-xl px-3 py-2.5 border border-q-border/60">
                  <div className="text-q-purple font-semibold text-xs mb-0.5">{word}</div>
                  <div className="text-q-muted text-xs leading-relaxed">{def}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}

/* ── Card wrapper ────────────────────────────────────────────────────────── */
const accentMap = {
  purple: { dot: 'bg-q-purple', iconBg: 'bg-q-purple/10', iconColor: 'text-q-purple' },
  indigo: { dot: 'bg-indigo-400', iconBg: 'bg-indigo-400/10', iconColor: 'text-indigo-400' },
  green:  { dot: 'bg-q-green',  iconBg: 'bg-q-green/10',  iconColor: 'text-q-green'  },
  gold:   { dot: 'bg-q-gold',   iconBg: 'bg-q-gold/10',   iconColor: 'text-q-gold'   },
  subtle: { dot: 'bg-q-muted',  iconBg: 'bg-q-border/40', iconColor: 'text-q-muted'  },
}

function Card({ icon, title, accent, delay, children }: {
  icon: React.ReactNode; title: string; accent: keyof typeof accentMap
  delay: number; children: React.ReactNode
}) {
  const a = accentMap[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="bg-q-surface border border-q-border/60 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-q-border/40">
        <div className={`w-8 h-8 rounded-xl ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={a.iconColor}>{icon}</span>
        </div>
        <h2 className="font-semibold text-q-text text-sm">{title}</h2>
      </div>
      <div className="px-5 py-4 text-q-muted text-sm leading-relaxed">{children}</div>
    </motion.div>
  )
}

/* ── Steps ────────────────────────────────────────────────────────────────── */
function Steps({ steps }: { steps: { label: string; desc: string }[] }) {
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="w-6 h-6 rounded-full bg-q-green/15 border border-q-green/25 flex items-center justify-center text-[10px] font-bold text-q-green">{i + 1}</span>
            {i < steps.length - 1 && <div className="w-px h-4 bg-q-border/60 mt-1" />}
          </div>
          <div className="pb-1">
            <div className="text-q-text font-medium text-xs mb-0.5">{s.label}</div>
            <div className="text-q-muted text-xs leading-relaxed">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Icons ────────────────────────────────────────────────────────────────── */
function IconGenLayer() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="8.5" x2="22" y2="8.5"/><line x1="2" y1="15.5" x2="22" y2="15.5"/></svg> }
function IconQuestBoard() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg> }
function IconFlow() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path strokeLinecap="round" d="M12 7v10M8 9l4-4 4 4M8 15l4 4 4-4"/></svg> }
function IconWhy() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function IconTips() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 21a7 7 0 110-14 7 7 0 010 14z"/></svg> }
function IconGloss() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> }
