'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-arena-bg">
      <h1 className="font-display text-title text-arena-text uppercase">
        Olá, {user?.email}
      </h1>
      <Button variant="primary" size="sm" render={<Link href="/groups" />}>
        Meus grupos
      </Button>
      <Button variant="danger" size="sm" onClick={() => signOut()}>
        Sair
      </Button>
    </div>
  )
}
