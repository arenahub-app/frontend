'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button, Input, Label } from '@/components/ui'
import { useGroup } from '@/lib/hooks/use-groups'
import { useCreateMatch } from '@/lib/hooks/use-matches'
import { createMatchSchema, type CreateMatchInput } from '@/lib/validations/matches'
import type { ApiError } from '@/lib/api/errors'

function localDatetimeToIso(value: string): string {
  return new Date(value).toISOString()
}

export default function NewMatchPage() {
  const { id: groupId } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: group } = useGroup(groupId)
  const createMatch = useCreateMatch(groupId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMatchInput>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: { maxPlayers: 10 },
  })

  function onSubmit(data: CreateMatchInput) {
    createMatch.mutate(
      {
        scheduledAt: localDatetimeToIso(data.scheduledAt),
        locationName: data.locationName,
        locationAddress: data.locationAddress || undefined,
        maxPlayers: data.maxPlayers,
      },
      {
        onSuccess: (match) => {
          toast.success('Partida criada!')
          router.push(`/groups/${groupId}/matches/${match.id}`)
        },
        onError: (error) => {
          const detail = (error as ApiError).response?.data?.detail
          toast.error(detail ?? 'Erro ao criar partida.')
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/matches`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Partidas
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Nova Partida</h1>
          {group && (
            <p className="mt-1 text-caption text-arena-muted">{group.name}</p>
          )}
        </div>

        <div className="rounded-card border border-arena-border bg-arena-surface p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scheduledAt">Data e horário</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...register('scheduledAt')}
              />
              {errors.scheduledAt && (
                <p className="text-xs text-arena-danger">{errors.scheduledAt.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locationName">Local</Label>
              <Input
                id="locationName"
                placeholder="Ex: Quadra do Parque"
                {...register('locationName')}
              />
              {errors.locationName && (
                <p className="text-xs text-arena-danger">{errors.locationName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locationAddress">Endereço <span className="text-arena-muted">(opcional)</span></Label>
              <Input
                id="locationAddress"
                placeholder="Ex: Rua das Palmeiras, 123"
                {...register('locationAddress')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxPlayers">Número máximo de jogadores</Label>
              <Input
                id="maxPlayers"
                type="number"
                min={2}
                {...register('maxPlayers', { valueAsNumber: true })}
              />
              {errors.maxPlayers && (
                <p className="text-xs text-arena-danger">{errors.maxPlayers.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={createMatch.isPending}
              className="w-full"
            >
              Criar partida
            </Button>

          </form>
        </div>
      </div>
    </div>
  )
}
