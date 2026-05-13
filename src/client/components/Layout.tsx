import { useState, useEffect, type ReactNode } from 'react'
import type { AuthUser } from '@/types'

interface LayoutProps {
  user?: AuthUser
  children: ReactNode
}

export function Layout({ user, children }: LayoutProps) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  return (
    <div className="layout">
      <header className="header">
        <a href="/" className="header-logo">五七五</a>
        <nav className="header-nav">
          <button className="theme-toggle" onClick={toggleTheme}>
            {dark ? '☀' : '☾'}
          </button>
          {user ? (
            <>
              <a href="/profile">{user.displayName}</a>
            </>
          ) : (
            <span>ゲスト</span>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
