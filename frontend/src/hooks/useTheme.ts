import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('qb-theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.remove('light')
    } else {
      root.classList.add('light')
    }
    localStorage.setItem('qb-theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
