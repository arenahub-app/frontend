'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Separator } from '@/components/ui/separator'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { authApi } from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/errors'
import { useAuth } from '@/providers/auth-provider'

export function LoginForm() {
  const router = useRouter()
  const { signIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      signIn(data)
      router.push('/dashboard')
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
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta ArenaHub
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth2/authorize/google`}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar com Google
        </a>

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
          noValidate
        >
          {mutation.isError && !errors.email && !errors.password && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutation.error?.message ?? 'Erro ao fazer login'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground"
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
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link
            href="/register"
            className="text-foreground font-medium hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
