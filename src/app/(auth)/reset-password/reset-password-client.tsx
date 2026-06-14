'use client'

import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              O link de redefinição de senha é inválido ou expirou.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return <ResetPasswordForm token={token} />
}
