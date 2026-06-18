import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  )
}

// Use on each child inside <StaggerList>
export const cardVariants = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

// Attach this transition to each motion.div that uses cardVariants
export const cardTransition = { duration: 0.3, ease: 'easeOut' } as const
