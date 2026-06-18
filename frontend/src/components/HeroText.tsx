import { motion } from 'framer-motion'

const line1 = 'AI-Governed'
const line2 = ['Quests', '&', 'Bounties']

export function HeroText() {
  return (
    <>
      {/* Main headline */}
      <div className="text-[clamp(2.4rem,9vw,8rem)] font-extrabold tracking-tight leading-[0.92] mb-6">
        {/* Line 1 — character-by-character rise */}
        <motion.div
          className="block text-white overflow-hidden whitespace-nowrap"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}
        >
          {line1.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              variants={{ hidden: { opacity: 0, y: '60%' }, visible: { opacity: 1, y: '0%' } }}
              transition={{ duration: 0.5, ease: 'circOut' }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Line 2 — gradient words blur in */}
        <motion.div
          className="bg-gradient-primary bg-clip-text text-transparent block"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.13, delayChildren: 0.6 } } }}
        >
          {line2.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.18em] last:mr-0"
              variants={{
                hidden:  { opacity: 0, y: 40, filter: 'blur(12px)' },
                visible: { opacity: 1, y: 0,  filter: 'blur(0px)' },
              }}
              transition={{ duration: 0.65, ease: 'circOut' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Subtitle */}
      <HeroSubtitle />
    </>
  )
}

function HeroSubtitle() {
  return (
    <motion.div
      className="max-w-2xl mx-auto mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6, ease: 'easeOut' }}
    >
      <p className="text-lg sm:text-xl leading-relaxed font-medium text-center text-q-subtle">
        Post a quest, lock a reward —{' '}
        <span className="bg-gradient-primary bg-clip-text text-transparent font-bold">
          AI validators
        </span>{' '}
        judge every submission on-chain with no middlemen and no bias
      </p>
    </motion.div>
  )
}
