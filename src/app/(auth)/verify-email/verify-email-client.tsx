'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { authApi } from '@/lib/api/auth'

type Status = 'loading' | 'success' | 'error' | 'missing-token'

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing-token')

  useEffect(() => {
    if (!token) return

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificação de email</CardTitle>
        {status === 'loading' && (
          <CardDescription>Verificando seu email...</CardDescription>
        )}
      </CardHeader>

      <CardContent className="gap-4">
        {status === 'loading' && (
          <div className="flex justify-center py-4">
            <Loader2 className="size-6 animate-spin text-arena-accent" />
          </div>
        )}

        {status === 'success' && (
          <>
            <Alert>
              <AlertDescription>
                Email verificado com sucesso! Agora você pode fazer login.
              </AlertDescription>
            </Alert>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'primary', size: 'md', className: 'w-full' })}
            >
              Ir para o login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert variant="destructive">
              <AlertDescription>
                Link de verificação inválido ou expirado. Faça login e solicite
                um novo link.
              </AlertDescription>
            </Alert>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'ghost', size: 'md', className: 'w-full' })}
            >
              Voltar para o login
            </Link>
          </>
        )}

        {status === 'missing-token' && (
          <Alert variant="destructive">
            <AlertDescription>
              Link inválido. Acesse o link enviado para o seu email.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
