'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/providers/theme-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        className="fixed right-4 top-4 z-50 flex size-9 items-center justify-center rounded-full border border-arena-border bg-arena-surface text-arena-muted shadow-sm transition-colors hover:border-arena-accent/40 hover:text-arena-text"
      >
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      {children}
    </>
  )
}
