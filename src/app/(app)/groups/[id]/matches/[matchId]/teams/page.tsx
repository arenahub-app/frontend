'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Select } from '@/components/ui'
import { useGroup } from '@/lib/hooks/use-groups'
import {
  useCurrentFormation,
  useGenerateFormation,
  useMovePlayer,
  useDeleteFormation,
} from '@/lib/hooks/use-team-formations'
import type { Team, TeamPlayer } from '@/lib/api/team-formations'
import type { ApiError } from '@/lib/api/errors'

const POSITION_LABELS: Record<string, string> = {
  FORWARD: 'Atacante',
  MIDFIELDER: 'Meia',
  DEFENDER: 'Zagueiro',
  GOALKEEPER: 'Goleiro',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

function apiErr(error: unknown): string {
  return (error as ApiError).response?.data?.detail ?? 'Erro inesperado.'
}

interface PlayerRowProps {
  player: TeamPlayer
  canManage: boolean
  teams: Team[]
  currentTeamId: string
  formationId: string
  groupId: string
  matchId: string
  openMoveId: string | null
  onOpenMove: (memberId: string | null) => void
}

function PlayerRow({
  player,
  canManage,
  teams,
  currentTeamId,
  formationId,
  groupId,
  matchId,
  openMoveId,
  onOpenMove,
}: PlayerRowProps) {
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const movePlayer = useMovePlayer(groupId, matchId)
  const isOpen = openMoveId === player.memberId
  const displayName = player.userName ?? `Jogador ${player.memberId.slice(0, 8)}…`
  const positionLabel = player.position ? POSITION_LABELS[player.position] : null

  function handleConfirmMove() {
    if (!selectedTeamId) return
    movePlayer.mutate(
      { formationId, data: { memberId: player.memberId, toTeamId: selectedTeamId } },
      {
        onSuccess: () => {
          toast.success(`${displayName} movido com sucesso.`)
          onOpenMove(null)
          setSelectedTeamId('')
        },
        onError: (error) => toast.error(apiErr(error)),
      },
    )
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-arena-text block truncate">{displayName}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-arena-accent">★ {Number(player.skill).toFixed(1)}</span>
            {positionLabel && (
              <span className="text-xs text-arena-muted">{positionLabel}</span>
            )}
          </div>
        </div>
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isOpen) {
                onOpenMove(null)
                setSelectedTeamId('')
              } else {
                onOpenMove(player.memberId)
                setSelectedTeamId('')
              }
            }}
          >
            Mover
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="flex items-center gap-2 pl-0">
          <Select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="flex-1 h-9 text-sm"
          >
            <option value="">Selecionar time...</option>
            {teams
              .filter((t) => t.id !== currentTeamId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </Select>
          <Button
            variant="primary"
            size="sm"
            loading={movePlayer.isPending}
            disabled={!selectedTeamId}
            onClick={handleConfirmMove}
          >
            Confirmar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenMove(null)
              setSelectedTeamId('')
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}

interface TeamCardProps {
  team: Team
  canManage: boolean
  allTeams: Team[]
  formationId: string
  groupId: string
  matchId: string
  openMoveId: string | null
  onOpenMove: (memberId: string | null) => void
}

function TeamCard({
  team,
  canManage,
  allTeams,
  formationId,
  groupId,
  matchId,
  openMoveId,
  onOpenMove,
}: TeamCardProps) {
  return (
    <div className="rounded-card border border-arena-border bg-arena-surface p-4">
      <div className="mb-3">
        <h3 className="font-display text-title text-arena-text">{team.name}</h3>
        <span className="text-xs text-arena-muted">
          Skill médio: {Number(team.averageSkill).toFixed(1)} ★
        </span>
      </div>
      <div className="divide-y divide-arena-border">
        {team.players.map((player) => (
          <PlayerRow
            key={player.memberId}
            player={player}
            canManage={canManage}
            teams={allTeams}
            currentTeamId={team.id}
            formationId={formationId}
            groupId={groupId}
            matchId={matchId}
            openMoveId={openMoveId}
            onOpenMove={onOpenMove}
          />
        ))}
      </div>
    </div>
  )
}

export default function TeamsPage() {
  const { id: groupId, matchId } = useParams<{ id: string; matchId: string }>()
  const router = useRouter()

  const { data: group } = useGroup(groupId)
  const { data: formation, isLoading, isError, error } = useCurrentFormation(groupId, matchId)

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'

  const generateFormation = useGenerateFormation(groupId, matchId)
  const deleteFormation = useDeleteFormation(groupId, matchId)

  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [openMoveId, setOpenMoveId] = useState<string | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const is404 =
    isError && (error as ApiError).response?.status === 404

  function handleGenerate() {
    generateFormation.mutate(
      { numberOfTeams },
      {
        onSuccess: () => toast.success('Times gerados com sucesso!'),
        onError: (err) => toast.error(apiErr(err)),
      },
    )
  }

  function handleRegenerate() {
    const count = formation?.numberOfTeams ?? numberOfTeams
    generateFormation.mutate(
      { numberOfTeams: count },
      {
        onSuccess: () => {
          toast.success('Times regenerados com sucesso!')
          setConfirmRegenerate(false)
        },
        onError: (err) => {
          toast.error(apiErr(err))
          setConfirmRegenerate(false)
        },
      },
    )
  }

  function handleDelete() {
    if (!formation) return
    deleteFormation.mutate(formation.id, {
      onSuccess: () => {
        toast.success('Formação desfeita.')
        router.push(`/groups/${groupId}/matches/${matchId}`)
      },
      onError: (err) => {
        toast.error(apiErr(err))
        setConfirmDelete(false)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  const skills = formation?.teams.map((t) => t.averageSkill) ?? []
  const isImbalanced =
    skills.length >= 2 && Math.max(...skills) - Math.min(...skills) > 0.5

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/matches/${matchId}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Voltar à partida
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Formação de Times</h1>
        </div>

        {(is404 || !formation) && !isLoading ? (
          canManage ? (
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <p className="text-sm text-arena-muted mb-5">Nenhuma formação gerada ainda.</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-arena-text mb-2">
                    Número de times
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNumberOfTeams((n) => Math.max(2, n - 1))}
                      disabled={numberOfTeams <= 2}
                    >
                      −
                    </Button>
                    <span className="text-sm font-medium text-arena-text w-4 text-center">
                      {numberOfTeams}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNumberOfTeams((n) => Math.min(6, n + 1))}
                      disabled={numberOfTeams >= 6}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Button
                  variant="primary"
                  loading={generateFormation.isPending}
                  onClick={handleGenerate}
                  className="w-full"
                >
                  Gerar Times Automaticamente
                </Button>
              </div>
            </section>
          ) : (
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <p className="text-sm text-arena-muted">
                Os times ainda não foram formados. Aguarde o organizador gerar a formação.
              </p>
            </section>
          )
        ) : formation ? (
          <div className="flex flex-col gap-5">
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={formation.formationType === 'AUTOMATIC' ? 'neutral' : 'warning'}>
                  {formation.formationType === 'AUTOMATIC'
                    ? 'Geração automática'
                    : 'Ajustado manualmente'}
                </Badge>
                {isImbalanced && (
                  <Badge variant="warning">⚠ Times desequilibrados</Badge>
                )}
                <span className="text-xs text-arena-muted ml-auto">
                  Confirmado em {formatDate(formation.confirmedAt)}{' '}
                  {formatTime(formation.confirmedAt)}
                </span>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {formation.teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  canManage={canManage}
                  allTeams={formation.teams}
                  formationId={formation.id}
                  groupId={groupId}
                  matchId={matchId}
                  openMoveId={openMoveId}
                  onOpenMove={setOpenMoveId}
                />
              ))}
            </div>

            {canManage && (
              <section className="rounded-card border border-arena-border bg-arena-surface p-5">
                <h2 className="font-display text-title text-arena-text mb-3">Administração</h2>
                <div className="flex flex-col gap-2">
                  {!confirmRegenerate ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRegenerate(true)}
                    >
                      Regenerar Times
                    </Button>
                  ) : (
                    <div className="flex gap-2 rounded-lg border border-arena-border bg-arena-raised p-3">
                      <p className="flex-1 text-sm text-arena-text">Regenerar os times?</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRegenerate(false)}
                      >
                        Não
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={generateFormation.isPending}
                        onClick={handleRegenerate}
                      >
                        Confirmar
                      </Button>
                    </div>
                  )}

                  {!confirmDelete ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Desfazer Formação
                    </Button>
                  ) : (
                    <div className="flex gap-2 rounded-lg border border-arena-danger/20 bg-arena-danger/5 p-3">
                      <p className="flex-1 text-sm text-arena-danger">Desfazer a formação?</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Não
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleteFormation.isPending}
                        onClick={handleDelete}
                      >
                        Confirmar
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
