'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { authApi } from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/errors'

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordInput) =>
      authApi.resetPassword(token, data.newPassword),
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!')
      router.push('/login')
    },
    onError: (error: ApiError) => {
      const status = error.response?.status
      if (status === 400) toast.error('Link inválido ou expirado')
      else toast.error('Erro ao redefinir senha. Tente novamente.')
    },
  })

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
        <CardDescription>Escolha uma nova senha para sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
          noValidate
        >
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutation.error?.message ?? 'Erro ao redefinir senha'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
