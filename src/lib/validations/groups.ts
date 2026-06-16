import { z } from 'zod'

const SPORTS = ['FOOTBALL', 'VOLLEYBALL', 'BASKETBALL', 'FUTEVOLEI', 'BEACH_TENNIS', 'OTHER'] as const

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(80, 'Nome deve ter no máximo 80 caracteres'),
  sport: z.enum(SPORTS, { error: 'Selecione uma modalidade' }),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
})

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(80, 'Nome deve ter no máximo 80 caracteres')
    .optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  pixKey: z.string().optional(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
