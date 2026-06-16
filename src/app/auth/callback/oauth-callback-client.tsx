'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'

export function OAuthCallbackClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signIn } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      router.replace('/login?error=oauth_failed')
      return
    }

    signIn({ accessToken: token, expiresIn: 3600 })

    const profileIncomplete = searchParams.get('profileIncomplete') === 'true'
    router.replace(profileIncomplete ? '/profile/complete' : '/dashboard')
  }, [searchParams, signIn, router])

  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm">Concluindo login com Google...</p>
    </div>
  )
}
