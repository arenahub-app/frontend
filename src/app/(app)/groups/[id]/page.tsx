'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Link2, Copy, Check, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button } from '@/components/ui'
import { useGroup, useGroupMembers, useGroupInvites, useGenerateInvite } from '@/lib/hooks/use-groups'
import {
  SPORT_LABELS,
  ROLE_BADGE_VARIANT,
  ROLE_LABELS,
  ROLE_ORDER,
  buildInviteLink,
  isInviteValid,
} from '@/lib/api/groups'
import type { Member } from '@/lib/api/groups'
import type { ApiError } from '@/lib/api/errors'

function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    const orderDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
    return orderDiff !== 0 ? orderDiff : a.userId.localeCompare(b.userId)
  })
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: group, isLoading: loadingGroup, isError: errorGroup } = useGroup(id)
  const { data: members, isLoading: loadingMembers } = useGroupMembers(id)
  const { data: invites, isLoading: loadingInvites } = useGroupInvites(id)
  const generateInvite = useGenerateInvite(id)

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'
  const activeInvite = invites?.find(isInviteValid)

  async function handleCopyInvite(token: string) {
    const link = buildInviteLink(token)
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado!')
  }

  function handleGenerateAndCopy() {
    generateInvite.mutate(undefined, {
      onSuccess: (invite) => {
        handleCopyInvite(invite.token)
      },
      onError: (error) => {
        const e = error as ApiError
        toast.error(e.response?.data?.detail ?? 'Erro ao gerar convite.')
      },
    })
  }

  if (loadingGroup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (errorGroup || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-arena-bg">
        <p className="text-body text-arena-muted">Grupo não encontrado ou acesso negado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/groups')}>
          Voltar aos grupos
        </Button>
      </div>
    )
  }

  const sorted = members ? sortMembers(members) : []

  return (
    <div className="min-h-screen bg-arena-bg">
      <div className="mx-auto max-w-lg">
        <div className="px-4 py-6">
          <div className="mb-4 flex items-center gap-3">
            <Link href="/groups" className="text-arena-muted hover:text-arena-text">
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-hero text-arena-text uppercase truncate">
                {group.name}
              </h1>
              <p className="text-caption text-arena-muted">
                {SPORT_LABELS[group.sport]} · {group.memberCount}{' '}
                {group.memberCount === 1 ? 'membro' : 'membros'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {canManage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInviteOpen((v) => !v)}
                    aria-label="Convidar"
                  >
                    <Link2 className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Configurações"
                    render={<Link href={`/groups/${id}/settings`} />}
                  >
                    <Settings className="size-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <Badge variant={ROLE_BADGE_VARIANT[group.myRole]}>
              {ROLE_LABELS[group.myRole]}
            </Badge>
            {group.status === 'INACTIVE' && (
              <Badge variant="danger">Grupo inativo</Badge>
            )}
          </div>

          {inviteOpen && (
            <div className="mb-4 rounded-lg border border-arena-border bg-arena-surface p-3 flex flex-col gap-2">
              <p className="text-caption text-arena-muted font-medium">Link de convite</p>
              {loadingInvites ? (
                <p className="text-caption text-arena-muted">Carregando...</p>
              ) : activeInvite ? (
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-xs text-arena-text truncate font-mono">
                    {buildInviteLink(activeInvite.token)}
                  </p>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCopyInvite(activeInvite.token)}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateAndCopy}
                  loading={generateInvite.isPending}
                  className="w-full"
                >
                  <Plus className="size-4" />
                  Gerar convite
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-arena-border">
          <p className="px-4 py-3 text-caption text-arena-muted font-medium uppercase tracking-wide">
            Membros
          </p>
          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-arena-accent" />
            </div>
          ) : (
            <div>
              {sorted.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 min-h-[56px] bg-arena-surface border-b border-arena-border last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      {member.skill !== undefined && (
                        <span className="text-caption text-arena-accent font-medium">
                          ★ {Number(member.skill).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-arena-muted font-mono truncate mt-0.5">
                      {member.userId.slice(0, 8)}…
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
