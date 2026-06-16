import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'Senha@123',
    confirmPassword: 'Senha@123',
    phone: '11987654321',
    birthDate: '1990-05-20',
  }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'J' }).success).toBe(false)
  })

  it('rejects password without uppercase letter', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'senha1234', confirmPassword: 'senha1234' }).success,
    ).toBe(false)
  })

  it('rejects password without number', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'SenhaSemNum', confirmPassword: 'SenhaSemNum' }).success,
    ).toBe(false)
  })

  it('rejects password shorter than 8 chars', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'Ab1', confirmPassword: 'Ab1' }).success,
    ).toBe(false)
  })

  it('rejects mismatched confirmPassword', () => {
    expect(
      registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' }).success,
    ).toBe(false)
  })

  it('rejects invalid phone (letters)', () => {
    expect(registerSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false)
  })

  it('rejects phone with too few digits', () => {
    expect(registerSchema.safeParse({ ...valid, phone: '123456789' }).success).toBe(false)
  })

  it('accepts 10-digit phone', () => {
    expect(registerSchema.safeParse({ ...valid, phone: '1198765432' }).success).toBe(true)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'invalid' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching valid passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'Senha@123',
        confirmPassword: 'Senha@123',
      }).success,
    ).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'Senha@123',
        confirmPassword: 'Diferente1',
      }).success,
    ).toBe(false)
  })

  it('rejects weak password', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'fraca',
        confirmPassword: 'fraca',
      }).success,
    ).toBe(false)
  })
})
