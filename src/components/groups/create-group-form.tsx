'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Label } from '@/components/ui'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createGroupSchema, type CreateGroupInput } from '@/lib/validations/groups'
import { useCreateGroup } from '@/lib/hooks/use-groups'
import { SPORT_LABELS, type Sport } from '@/lib/api/groups'
import type { ApiError } from '@/lib/api/errors'

const SPORTS = Object.entries(SPORT_LABELS) as [Sport, string][]

export function CreateGroupForm() {
  const router = useRouter()
  const createGroup = useCreateGroup()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupInput>({ resolver: zodResolver(createGroupSchema) })

  function onSubmit(data: CreateGroupInput) {
    createGroup.mutate(data, {
      onSuccess: (group) => {
        toast.success('Grupo criado com sucesso!')
        router.push(`/groups/${group.id}`)
      },
      onError: (error) => {
        const e = error as ApiError
        toast.error(e.response?.data?.detail ?? 'Erro ao criar grupo. Tente novamente.')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do grupo</Label>
        <Input
          id="name"
          placeholder="Pelada do Parque"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-arena-danger">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sport">Modalidade</Label>
        <Select id="sport" {...register('sport')}>
          <option value="">Selecione uma modalidade</option>
          {SPORTS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        {errors.sport && (
          <p className="text-xs text-arena-danger">{errors.sport.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Futebol toda quinta às 20h"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-arena-danger">{errors.description.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        loading={createGroup.isPending}
      >
        Criar grupo
      </Button>
    </form>
  )
}
