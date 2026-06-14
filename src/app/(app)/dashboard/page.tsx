'use client'

import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Olá, {user?.email}</h1>
      <p className="text-muted-foreground">Dashboard em construção</p>
      <Button variant="outline" onClick={() => signOut()}>
        Sair
      </Button>
    </div>
  )
}
