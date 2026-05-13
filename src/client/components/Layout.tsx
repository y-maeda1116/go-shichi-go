import type { ReactNode } from 'react'
import type { AuthUser } from '@/types'

interface LayoutProps {
  user?: AuthUser
  children: ReactNode
}

export function Layout({ user, children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <a href="/" className="header-logo">五七五</a>
        <nav className="header-nav">
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
