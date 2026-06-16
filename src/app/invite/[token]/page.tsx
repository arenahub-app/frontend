'use client'

import { useParams, useRouter } from 'next/navigation'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Badge, Button } from '@/components/ui'
import { useInvitePreview, useJoinByInvite } from '@/lib/hooks/use-groups'
import { SPORT_LABELS, isPreviewValid } from '@/lib/api/groups'
import { useAuth } from '@/providers/auth-provider'
import type { ApiError } from '@/lib/api/errors'

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const { data: preview, isLoading, isError } = useInvitePreview(token)
  const joinByInvite = useJoinByInvite()

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (isError || !preview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-arena-bg px-4 text-center">
        <p className="font-display text-title text-arena-text uppercase">Link inválido</p>
        <p className="text-body text-arena-muted">
          Verifique se o link foi copiado corretamente.
        </p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
          Ir para o início
        </Button>
      </div>
    )
  }

  const valid = isPreviewValid(preview)
  const days = daysUntil(preview.expiresAt)

  function handleJoin() {
    if (!user) {
      router.push(`/login?redirect=/invite/${token}`)
      return
    }

    joinByInvite.mutate(token, {
      onSuccess: (result) => {
        toast.success(`Bem-vindo ao grupo!`)
        router.push(`/groups/${result.groupId}`)
      },
      onError: (error) => {
        const e = error as ApiError
        const type = e.response?.data?.type ?? ''
        if (type.includes('user-already-member') && preview) {
          toast.info('Você já é membro deste grupo.')
          router.push(`/groups/${preview.groupId}`)
        } else if (type.includes('invite-expired')) {
          toast.error('Este convite expirou ou esgotou os usos.')
        } else {
          toast.error(e.response?.data?.detail ?? 'Erro ao entrar no grupo.')
        }
      },
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-arena-bg px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <Avatar
          name={preview.groupName}
          src={preview.photoUrl ?? undefined}
          size="lg"
        />

        <div className="text-center">
          <h1 className="font-display text-hero text-arena-text uppercase">
            {preview.groupName}
          </h1>
          <p className="text-caption text-arena-muted mt-1">
            {SPORT_LABELS[preview.sport]} · {preview.memberCount}{' '}
            {preview.memberCount === 1 ? 'membro' : 'membros'}
          </p>
        </div>

        <div className="flex justify-center">
          {valid ? (
            <Badge variant="success">
              Convite válido · expira em {days} {days === 1 ? 'dia' : 'dias'}
            </Badge>
          ) : (
            <Badge variant="danger">Convite expirado</Badge>
          )}
        </div>

        {valid ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={joinByInvite.isPending}
            onClick={handleJoin}
          >
            <Users className="size-5" />
            {user ? 'Entrar no grupo' : 'Entre para aceitar o convite'}
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-body text-arena-muted">
              Este link expirou. Peça um novo link ao organizador do grupo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
