import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número')
      .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial (ex: !@#$%)'),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^\d{10,11}$/, 'Telefone inválido (apenas dígitos, 10 ou 11)'),
    birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número')
      .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial (ex: !@#$%)'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
