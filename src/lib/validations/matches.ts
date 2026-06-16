import { z } from 'zod'

export const createMatchSchema = z.object({
  scheduledAt: z.string().min(1, 'Data é obrigatória'),
  locationName: z
    .string()
    .min(1, 'Local é obrigatório')
    .max(200, 'Local deve ter no máximo 200 caracteres'),
  locationAddress: z.string().optional(),
  maxPlayers: z
    .number({ message: 'Número de jogadores é obrigatório' })
    .int()
    .min(2, 'Mínimo de 2 jogadores'),
})

export type CreateMatchInput = z.infer<typeof createMatchSchema>
