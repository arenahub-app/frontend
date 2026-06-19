'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, Loader2, AlertTriangle, ChevronRight,
  BarChart2, ShieldBan, X, Check, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Textarea } from '@/components/ui'
import { useGroup, useGroupMembers } from '@/lib/hooks/use-groups'
import {
  useActiveVoting,
  useVotings,
  useMyVotes,
  useOpenVoting,
  useCastVote,
  useCloseVoting,
  useBanFromVoting,
} from '@/lib/hooks/use-votings'
import { getCurrentUserId } from '@/lib/api/token'
import type { Member } from '@/lib/api/groups'
import type { ActiveVoting } from '@/lib/api/votings'
import type { ApiError } from '@/lib/api/errors'

function formatDeadline(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffH = diffMs / (1000 * 60 * 60)

  if (diffH < 24) {
    const h = Math.floor(diffH)
    const m = Math.floor((diffMs / (1000 * 60)) % 60)
    return `Encerra em ${h}h${m > 0 ? ` ${m}min` : ''}`
  }

  return `Aberta até ${new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)}`
}

function formatClosedAt(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function StarSelector({
  value,
  onChange,
  disabled,
  loading,
}: {
  value: number
  onChange: (s: number) => void
  disabled?: boolean
  loading?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex items-center gap-0.5">
      {loading && <Loader2 className="size-4 animate-spin text-arena-muted mr-1" />}
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled || loading}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className={[
            'text-xl transition-colors disabled:cursor-not-allowed',
            s <= display
              ? 'text-yellow-400'
              : 'text-arena-border hover:text-yellow-300',
          ].join(' ')}
        >
          ★
        </button>
      ))}
      {value > 0 && !loading && (
        <span className="ml-1.5 text-xs text-arena-muted">{value} ★</span>
      )}
    </div>
  )
}

function MemberVoteCard({
  member,
  stars,
  onVote,
  isPending,
  disabled,
}: {
  member: Member
  stars: number
  onVote: (stars: number) => void
  isPending: boolean
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-arena-border bg-arena-surface p-3 sm:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-arena-raised text-sm font-semibold text-arena-muted uppercase">
        {(member.userName ?? '?').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-arena-text truncate">
          {member.userName ?? `ID: ${member.userId.slice(0, 8)}…`}
        </p>
        {stars > 0 && (
          <p className="text-xs text-arena-muted">Votado</p>
        )}
      </div>
      <StarSelector
        value={stars}
        onChange={onVote}
        disabled={disabled}
        loading={isPending}
      />
    </div>
  )
}

function OpenVotingDialog({
  groupId,
  onSuccess,
}: {
  groupId: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [minDeadline, setMinDeadline] = useState('')
  const openVoting = useOpenVoting(groupId)

  function handleOpen() {
    setMinDeadline(new Date(Date.now() + 31 * 60 * 1000).toISOString().slice(0, 16))
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deadline) return
    openVoting.mutate(new Date(deadline).toISOString(), {
      onSuccess: () => {
        setOpen(false)
        setDeadline('')
        toast.success('Votação iniciada!')
        onSuccess()
      },
      onError: (error) => {
        const err = error as ApiError
        if (err.response?.data?.title === 'voting-already-open') {
          toast.error('Já existe uma votação ativa para este grupo.')
        } else {
          toast.error(err.response?.data?.detail ?? 'Erro ao iniciar votação.')
        }
      },
    })
  }

  if (!open) {
    return (
      <Button variant="primary" size="sm" onClick={handleOpen}>
        <Plus className="size-4" />
        Iniciar votação
      </Button>
    )
  }

  return (
    <div className="rounded-card border border-arena-border bg-arena-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-arena-text">Nova votação</p>
        <button onClick={() => setOpen(false)} className="text-arena-muted hover:text-arena-text">
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-arena-muted">Prazo de encerramento</label>
          <input
            type="datetime-local"
            value={deadline}
            min={minDeadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className="w-full rounded-md border border-arena-border bg-arena-raised px-3 py-2 text-sm text-arena-text focus:outline-none focus:ring-1 focus:ring-arena-accent"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={openVoting.isPending}
          disabled={!deadline}
        >
          Iniciar
        </Button>
      </form>
    </div>
  )
}

function BanMemberDialog({
  groupId,
  votingId,
  members,
}: {
  groupId: string
  votingId: string
  members: Member[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [reason, setReason] = useState('')
  const banMutation = useBanFromVoting(groupId, votingId)

  const votableMembers = members.filter((m) => m.role !== 'REFEREE')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMemberId || !reason.trim()) return
    banMutation.mutate(
      { memberId: selectedMemberId, reason: reason.trim() },
      {
        onSuccess: () => {
          setOpen(false)
          setSelectedMemberId('')
          setReason('')
          toast.success('Membro banido da votação.')
        },
        onError: (error) => {
          const err = error as ApiError
          const code = err.response?.data?.title
          if (code === 'member-already-banned-from-voting') {
            toast.error('Este membro já está banido desta votação.')
          } else {
            toast.error(err.response?.data?.detail ?? 'Erro ao banir membro.')
          }
        },
      }
    )
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ShieldBan className="size-4" />
        Banir membro
      </Button>
    )
  }

  return (
    <div className="mt-3 rounded-card border border-arena-border bg-arena-raised p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-arena-text">Banir da votação</p>
        <button onClick={() => setOpen(false)} className="text-arena-muted hover:text-arena-text">
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-arena-muted">Membro</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            required
            className="w-full rounded-md border border-arena-border bg-arena-surface px-3 py-2 text-sm text-arena-text focus:outline-none focus:ring-1 focus:ring-arena-accent"
          >
            <option value="">Selecionar membro…</option>
            {votableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.userName ?? m.userId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-arena-muted">Motivo</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo do banimento…"
            required
            rows={2}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={banMutation.isPending}
          disabled={!selectedMemberId || !reason.trim()}
        >
          Banir
        </Button>
      </form>
    </div>
  )
}

function CloseVotingSection({
  groupId,
  voting,
}: {
  groupId: string
  voting: ActiveVoting
}) {
  const [confirming, setConfirming] = useState(false)
  const closeMutation = useCloseVoting(groupId, voting.id)

  function handleClose() {
    closeMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirming(false)
        toast.success('Votação encerrada. Skills atualizados.')
      },
      onError: (error) => {
        const err = error as ApiError
        toast.error(err.response?.data?.detail ?? 'Erro ao encerrar votação.')
      },
    })
  }

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Encerrar agora
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
      <p className="flex-1 text-xs text-arena-muted">
        Os skills serão atualizados imediatamente. Confirmar?
      </p>
      <Button
        variant="danger"
        size="sm"
        onClick={handleClose}
        loading={closeMutation.isPending}
      >
        <Check className="size-4" />
        Sim
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        <X className="size-4" />
      </Button>
    </div>
  )
}

function ActiveVotingView({
  groupId,
  voting,
  members,
  canManage,
  myMemberId,
}: {
  groupId: string
  voting: ActiveVoting
  members: Member[]
  canManage: boolean
  myMemberId: string | undefined
}) {
  const { data: myVotesData, isLoading: loadingVotes } = useMyVotes(groupId, voting.id)
  const castVote = useCastVote(groupId, voting.id)
  const [pendingVotes, setPendingVotes] = useState<Record<string, boolean>>({})
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, number>>({})

  const serverVotesMap = useMemo(() => {
    const map: Record<string, number> = {}
    myVotesData?.votes.forEach((v) => { map[v.targetMemberId] = v.stars })
    return map
  }, [myVotesData])

  const localVotes = useMemo(
    () => ({ ...serverVotesMap, ...optimisticVotes }),
    [serverVotesMap, optimisticVotes]
  )

  const votableMembers = members.filter(
    (m) => m.role !== 'REFEREE' && m.id !== myMemberId
  )

  function handleVote(targetMemberId: string, stars: number) {
    setPendingVotes((p) => ({ ...p, [targetMemberId]: true }))
    setOptimisticVotes((p) => ({ ...p, [targetMemberId]: stars }))
    castVote.mutate(
      { targetMemberId, stars },
      {
        onSettled: () => {
          setPendingVotes((p) => ({ ...p, [targetMemberId]: false }))
          setOptimisticVotes((p) => { const n = { ...p }; delete n[targetMemberId]; return n })
        },
        onError: (error) => {
          const err = error as ApiError
          const code = err.response?.data?.title
          if (code === 'voter-is-banned') {
            toast.error('Você está banido desta votação.')
          } else {
            toast.error(err.response?.data?.detail ?? 'Erro ao registrar voto.')
          }
        },
      }
    )
  }

  const votedCount = Object.keys(localVotes).length
  const totalVotable = voting.totalVotable

  return (
    <div className="flex flex-col gap-5">
      {/* Header da votação */}
      <div className="rounded-card border border-arena-border bg-arena-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success">Aberta</Badge>
              <span className="text-sm text-arena-muted">{formatDeadline(voting.deadline)}</span>
            </div>
            {!voting.isBanned && (
              <p className="mt-1 text-sm text-arena-muted">
                Você votou em{' '}
                <span className="font-semibold text-arena-text">{votedCount}</span>
                {' '}de{' '}
                <span className="font-semibold text-arena-text">{totalVotable}</span>
                {' '}membros
              </p>
            )}
          </div>
          {canManage && (
            <Link
              href={`/groups/${groupId}/voting/${voting.id}/results`}
              className="flex items-center gap-1 text-sm text-arena-accent hover:underline"
            >
              <BarChart2 className="size-4" />
              Resultados parciais
              <ChevronRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Painel de gestão (admin) */}
      {canManage && (
        <div className="rounded-card border border-arena-border bg-arena-surface p-4">
          <p className="mb-3 text-sm font-medium text-arena-text">Gestão da votação</p>
          <div className="flex flex-wrap gap-2">
            <BanMemberDialog groupId={groupId} votingId={voting.id} members={members} />
            <CloseVotingSection groupId={groupId} voting={voting} />
          </div>
        </div>
      )}

      {/* Banido */}
      {voting.isBanned && (
        <div className="flex items-start gap-3 rounded-card border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-arena-text">
              Você foi banido desta votação
            </p>
            <p className="mt-0.5 text-sm text-arena-muted">
              Não é possível votar enquanto estiver banido.
            </p>
          </div>
        </div>
      )}

      {/* Lista de membros para votar */}
      {!voting.isBanned && (
        <div className="flex flex-col gap-2">
          {loadingVotes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-arena-accent" />
            </div>
          ) : votableMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-arena-muted">
              Nenhum membro disponível para votar.
            </p>
          ) : (
            votableMembers.map((member) => (
              <MemberVoteCard
                key={member.id}
                member={member}
                stars={localVotes[member.id] ?? 0}
                onVote={(stars) => handleVote(member.id, stars)}
                isPending={!!pendingVotes[member.id]}
                disabled={voting.isBanned}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function VotingPage() {
  const { id: groupId } = useParams<{ id: string }>()
  const myUserId = getCurrentUserId()

  const { data: group, isLoading: loadingGroup } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)
  const {
    data: voting,
    isLoading: loadingVoting,
    isError: votingError,
    error: votingErrorData,
  } = useActiveVoting(groupId)
  const { data: history } = useVotings(groupId)

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'
  const isReferee = group?.myRole === 'REFEREE'

  const noActiveVoting =
    votingError &&
    (votingErrorData as ApiError)?.response?.status === 404

  const myMember = members?.find((m) => m.userId === myUserId)
  const lastClosed = history?.find((v) => v.status === 'CLOSED')

  if (loadingGroup || loadingVoting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl">

        {/* Cabeçalho */}
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            {group?.name ?? 'Grupo'}
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">
            Votação de Habilidades
          </h1>
        </div>

        {/* Conteúdo principal */}
        {voting ? (
          isReferee ? (
            // Árbitro não pode votar, mas pode ver o status
            <div className="rounded-card border border-arena-border bg-arena-surface p-6 text-center">
              <Star className="mx-auto mb-3 size-10 text-arena-muted" />
              <p className="text-sm font-medium text-arena-text">Votação em andamento</p>
              <p className="mt-1 text-sm text-arena-muted">
                Árbitros não participam da votação de habilidades.
              </p>
              <p className="mt-2 text-xs text-arena-muted">
                {formatDeadline(voting.deadline)}
              </p>
            </div>
          ) : (
            <ActiveVotingView
              groupId={groupId}
              voting={voting}
              members={members ?? []}
              canManage={canManage}
              myMemberId={myMember?.id}
            />
          )
        ) : noActiveVoting ? (
          // Sem votação ativa
          <div className="flex flex-col gap-4">
            {lastClosed ? (
              // Mostra última votação encerrada
              <div className="rounded-card border border-arena-border bg-arena-surface p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="size-4 text-green-500" />
                  <span className="text-sm font-medium text-arena-text">
                    Votação encerrada em {formatClosedAt(lastClosed.closedAt!)}
                  </span>
                </div>
                <p className="text-sm text-arena-muted mb-3">
                  Os skills dos membros foram atualizados.
                </p>
                <Link
                  href={`/groups/${groupId}/voting/${lastClosed.id}/results`}
                  className="inline-flex items-center gap-1.5 text-sm text-arena-accent hover:underline"
                >
                  <BarChart2 className="size-4" />
                  Ver resultados
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            ) : null}

            <div className="rounded-card border border-arena-border bg-arena-surface p-6 text-center">
              <Star className="mx-auto mb-3 size-10 text-arena-muted" />
              <p className="text-sm text-arena-muted">
                Nenhuma votação ativa no momento.
              </p>
              {canManage && (
                <div className="mt-4 flex justify-center">
                  <OpenVotingDialog
                    groupId={groupId}
                    onSuccess={() => {}}
                  />
                </div>
              )}
            </div>

            {/* Histórico de votações */}
            {history && history.length > 0 && (
              <div className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-arena-border">
                  <p className="text-sm font-medium text-arena-text">Histórico</p>
                </div>
                <div className="divide-y divide-arena-border">
                  {history.map((v) => (
                    <Link
                      key={v.id}
                      href={`/groups/${groupId}/voting/${v.id}/results`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-arena-raised transition-colors"
                    >
                      <div>
                        <p className="text-sm text-arena-text">
                          {new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(v.openedAt))}
                        </p>
                        <p className="text-xs text-arena-muted">
                          {v.status === 'CLOSED' ? 'Encerrada' : 'Ativa'}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-arena-muted" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-arena-accent" />
          </div>
        )}

      </div>
    </div>
  )
}
