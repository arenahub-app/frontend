'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, MapPin, Users, Loader2 } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { useGroup } from '@/lib/hooks/use-groups'
import { useMatches } from '@/lib/hooks/use-matches'
import { MATCH_STATUS_LABELS, PRESENCE_LIST_STATUS_LABELS, type MatchSummary } from '@/lib/api/matches'

type Filter = 'upcoming' | 'past'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function MatchCard({ match, groupId }: { match: MatchSummary; groupId: string }) {
  const isCancelled = match.status === 'CANCELLED'
  return (
    <Link
      href={`/groups/${groupId}/matches/${match.id}`}
      className="block rounded-card border border-arena-border bg-arena-surface p-4 hover:border-arena-accent/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isCancelled ? (
              <Badge variant="danger">{MATCH_STATUS_LABELS[match.status]}</Badge>
            ) : (
              <Badge variant={match.presenceListStatus === 'OPEN' ? 'success' : 'neutral'}>
                {PRESENCE_LIST_STATUS_LABELS[match.presenceListStatus]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-arena-text mt-1">
            <Calendar className="size-3.5 shrink-0 text-arena-muted" />
            <span>{formatDate(match.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-arena-muted mt-0.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{match.locationName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-sm">
          <Users className="size-4 text-arena-muted" />
          <span className="font-medium text-arena-text">{match.confirmedCount}</span>
          <span className="text-arena-muted">/ {match.maxPlayers}</span>
          {match.waitingCount > 0 && (
            <span className="text-xs text-arena-accent ml-1">+{match.waitingCount} fila</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function MatchesPage() {
  const { id: groupId } = useParams<{ id: string }>()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data: group } = useGroup(groupId)
  const { data: matches, isLoading } = useMatches(groupId, filter)

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            {group?.name ?? 'Grupo'}
          </Link>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-hero text-arena-text uppercase">Partidas</h1>
            {canManage && (
              <Button
                variant="primary"
                size="sm"
                render={<Link href={`/groups/${groupId}/matches/new`} />}
              >
                <Plus className="size-4" />
                Nova partida
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-lg border border-arena-border bg-arena-surface p-1">
          {(['upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={[
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                filter === tab
                  ? 'bg-arena-accent text-white'
                  : 'text-arena-muted hover:text-arena-text',
              ].join(' ')}
            >
              {tab === 'upcoming' ? 'Próximas' : 'Passadas'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-7 animate-spin text-arena-accent" />
          </div>
        ) : !matches || matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Calendar className="size-10 text-arena-muted" />
            <p className="text-body text-arena-muted">
              {filter === 'upcoming' ? 'Nenhuma partida agendada.' : 'Nenhuma partida passada.'}
            </p>
            {canManage && filter === 'upcoming' && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/groups/${groupId}/matches/new`} />}
              >
                <Plus className="size-4" />
                Criar partida
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} groupId={groupId} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
