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
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { authApi } from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/errors'
import { useAuth } from '@/providers/auth-provider'

export function RegisterForm() {
  const router = useRouter()
  const { signIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const mutation = useMutation({
    mutationFn: (data: RegisterInput) =>
      authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        birthDate: data.birthDate,
      }),
    onSuccess: (data) => {
      signIn(data)
      toast.success('Conta criada! Verifique seu email para ativar sua conta.')
      router.push('/dashboard')
    },
    onError: (error: ApiError) => {
      const status = error.response?.status
      if (status === 409) toast.error('Este email já está cadastrado')
      else toast.error('Erro ao criar conta. Tente novamente.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Junte-se ao ArenaHub</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="João Silva"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-arena-danger">{errors.name.message}</p>
            )}
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="11987654321"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-arena-danger">{errors.phone.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="birthDate">Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
              />
              {errors.birthDate && (
                <p className="text-xs text-arena-danger">{errors.birthDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-arena-danger">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-arena-muted">
                Mínimo 8 caracteres · maiúscula · minúscula · número · caractere especial (!@#$%…)
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-arena-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={mutation.isPending}
          >
            Criar conta
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-arena-muted">
          Já tem conta?{' '}
          <Link href="/login" className="text-arena-text font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
