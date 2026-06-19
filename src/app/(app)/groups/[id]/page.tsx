'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Link2, Copy, Check, Plus, Loader2, Users, Calendar, MapPin, ChevronRight, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Select } from '@/components/ui'
import { useGroup, useGroupMembers, useGroupInvites, useGenerateInvite, useUpdateMember } from '@/lib/hooks/use-groups'
import { useMatches } from '@/lib/hooks/use-matches'
import { useActiveVoting } from '@/lib/hooks/use-votings'
import {
  SPORT_LABELS,
  ROLE_BADGE_VARIANT,
  ROLE_LABELS,
  ROLE_ORDER,
  POSITION_LABELS,
  POSITIONS_BY_SPORT,
  buildInviteLink,
  isInviteValid,
} from '@/lib/api/groups'
import type { Member, PlayerPosition } from '@/lib/api/groups'
import { getCurrentUserId } from '@/lib/api/token'
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
  const { data: upcomingMatches } = useMatches(id, 'upcoming')
  const { data: activeVoting } = useActiveVoting(id)
  const generateInvite = useGenerateInvite(id)

  const nextMatch = upcomingMatches?.[0] ?? null

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'
  const activeInvite = invites?.find(isInviteValid)
  const myUserId = getCurrentUserId()
  const updateMember = useUpdateMember(id)

  async function handleCopyInvite(token: string) {
    await navigator.clipboard.writeText(buildInviteLink(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado!')
  }

  function handleGenerateAndCopy() {
    generateInvite.mutate(undefined, {
      onSuccess: (invite) => handleCopyInvite(invite.token),
      onError: (error) => {
        toast.error((error as ApiError).response?.data?.detail ?? 'Erro ao gerar convite.')
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
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">

        {/* Cabeçalho */}
        <div className="mb-6">
          <Link
            href="/groups"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Meus grupos
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-hero text-arena-text uppercase">{group.name}</h1>
              <p className="mt-1 text-caption text-arena-muted">
                {SPORT_LABELS[group.sport]} · {group.memberCount}{' '}
                {group.memberCount === 1 ? 'membro' : 'membros'}
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Badge variant={ROLE_BADGE_VARIANT[group.myRole]}>
                  {ROLE_LABELS[group.myRole]}
                </Badge>
                {group.status === 'INACTIVE' && (
                  <Badge variant="danger">Grupo inativo</Badge>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteOpen((v) => !v)}
                >
                  <Link2 className="size-4" />
                  Convidar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  render={<Link href={`/groups/${id}/settings`} />}
                >
                  <Settings className="size-4" />
                  Configurações
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Painel de convite */}
        {inviteOpen && (
          <div className="mb-6 rounded-lg border border-arena-border bg-arena-surface p-4">
            <p className="mb-3 text-sm font-medium text-arena-text">Link de convite</p>
            {loadingInvites ? (
              <div className="flex items-center gap-2 text-caption text-arena-muted">
                <Loader2 className="size-4 animate-spin" /> Carregando...
              </div>
            ) : activeInvite ? (
              <div className="flex items-center gap-3 rounded-lg border border-arena-border bg-arena-raised p-3">
                <p className="flex-1 truncate font-mono text-sm text-arena-text">
                  {buildInviteLink(activeInvite.token)}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopyInvite(activeInvite.token)}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-caption text-arena-muted">Nenhum convite ativo.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateAndCopy}
                  loading={generateInvite.isPending}
                >
                  <Plus className="size-4" />
                  Gerar convite
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Próxima partida */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-title text-arena-text">Próxima partida</h2>
            <Link
              href={`/groups/${id}/matches`}
              className="text-sm text-arena-accent hover:underline flex items-center gap-0.5"
            >
              Ver todas
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {nextMatch ? (
            <Link
              href={`/groups/${id}/matches/${nextMatch.id}`}
              className="block rounded-card border border-arena-border bg-arena-surface p-4 hover:border-arena-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Badge variant={nextMatch.presenceListStatus === 'OPEN' ? 'success' : 'neutral'} className="mb-2">
                    {nextMatch.presenceListStatus === 'OPEN' ? 'Lista aberta' : 'Lista fechada'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-arena-text mt-1">
                    <Calendar className="size-3.5 shrink-0 text-arena-muted" />
                    <span>
                      {new Intl.DateTimeFormat('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(nextMatch.scheduledAt))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-arena-muted mt-0.5">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{nextMatch.locationName}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="size-4 text-arena-muted" />
                    <span className="font-medium text-arena-text">{nextMatch.confirmedCount}</span>
                    <span className="text-arena-muted">/ {nextMatch.maxPlayers}</span>
                  </div>
                  {nextMatch.waitingCount > 0 && (
                    <span className="text-xs text-arena-accent">+{nextMatch.waitingCount} fila</span>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-card border border-arena-border bg-arena-surface p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-arena-muted">Nenhuma partida agendada.</p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/groups/${id}/matches/new`} />}
                >
                  <Plus className="size-4" />
                  Criar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Votação ativa */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-title text-arena-text">Votação de Habilidades</h2>
            <Link
              href={`/groups/${id}/voting`}
              className="text-sm text-arena-accent hover:underline flex items-center gap-0.5"
            >
              Ver
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {activeVoting ? (
            <Link
              href={`/groups/${id}/voting`}
              className="block rounded-card border border-arena-border bg-arena-surface p-4 hover:border-arena-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge variant="success" className="mb-1">Aberta</Badge>
                  <div className="flex items-center gap-1.5 text-sm text-arena-text mt-1">
                    <Star className="size-3.5 shrink-0 text-yellow-400" />
                    <span>
                      {activeVoting.myVoteCount} de {activeVoting.totalVotable} votos emitidos
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-arena-muted shrink-0" />
              </div>
            </Link>
          ) : (
            <div className="rounded-card border border-arena-border bg-arena-surface p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-arena-muted">Nenhuma votação ativa.</p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/groups/${id}/voting`} />}
                >
                  <Plus className="size-4" />
                  Iniciar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Seção de membros */}
        <div className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
            <h2 className="font-display text-title text-arena-text">
              Membros
            </h2>
            <span className="text-caption text-arena-muted">
              {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
            </span>
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-arena-accent" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Users className="size-8 text-arena-muted" />
              <p className="text-caption text-arena-muted">Nenhum membro encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-arena-border">
              {sorted.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      <span className="text-sm text-arena-accent font-medium">
                        ★ {Number(member.skill).toFixed(1)}
                      </span>
                      {member.position && !canManage && member.userId !== myUserId && (
                        <span className="text-caption text-arena-muted">
                          {POSITION_LABELS[member.position] ?? member.position}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-arena-text truncate">
                      {member.userName ?? `ID: ${member.userId.slice(0, 12)}…`}
                    </p>
                  </div>
                  {(canManage || member.userId === myUserId) && group && (
                    <Select
                      value={member.position ?? ''}
                      onChange={(e) => {
                        const val = e.target.value as PlayerPosition | ''
                        updateMember.mutate(
                          { memberId: member.id, data: { position: val || null } },
                          {
                            onSuccess: () => toast.success('Posição atualizada.'),
                            onError: () => toast.error('Erro ao atualizar posição.'),
                          }
                        )
                      }}
                      className="w-36 h-9 text-sm shrink-0"
                    >
                      <option value="">Posição...</option>
                      {POSITIONS_BY_SPORT[group.sport].map((pos) => (
                        <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>
                      ))}
                    </Select>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
