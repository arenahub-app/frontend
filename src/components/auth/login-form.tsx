'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Divider } from '@/components/ui/divider'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { authApi } from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/errors'
import { useAuth } from '@/providers/auth-provider'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginForm() {
  const { signIn } = useAuth()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      signIn(data)
      window.location.href = redirect
    },
    onError: (error: ApiError) => {
      const status = error.response?.status
      if (status === 401) toast.error('Email ou senha incorretos')
      else if (status === 403) {
        const type = error.response?.data?.type ?? ''
        if (type.includes('email-not-verified'))
          toast.error('Confirme seu email antes de fazer login')
        else toast.error('Conta inativa')
      } else toast.error('Erro ao fazer login. Tente novamente.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta</CardDescription>
      </CardHeader>

      <CardContent className="gap-4">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 min-h-[44px] rounded-lg border border-arena-border bg-arena-raised px-4 text-sm font-medium text-arena-muted cursor-not-allowed opacity-50"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <Divider label="ou" />

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="flex flex-col gap-4"
          noValidate
        >
          {mutation.isError && !errors.email && !errors.password && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutation.error?.message ?? 'Erro ao fazer login'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-arena-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-arena-muted hover:text-arena-text"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-arena-danger">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={mutation.isPending}
          >
            Entrar
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-arena-muted">
          Não tem conta?{' '}
          <Link href="/register" className="text-arena-text font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
