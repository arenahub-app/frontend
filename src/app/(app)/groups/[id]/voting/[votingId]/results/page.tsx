'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useGroup } from '@/lib/hooks/use-groups'
import { useVotingResults } from '@/lib/hooks/use-votings'
import type { MemberResult } from '@/lib/api/votings'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function SkillDelta({ previous, next }: { previous: number | null; next: number | null }) {
  if (next === null) {
    return <span className="text-arena-muted">—</span>
  }
  if (previous === null || previous === next) {
    return (
      <span className="font-semibold text-arena-text">{next.toFixed(1)}</span>
    )
  }
  const up = next > previous
  return (
    <span className={`flex items-center gap-0.5 font-semibold ${up ? 'text-green-500' : 'text-red-500'}`}>
      {next.toFixed(1)}
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
    </span>
  )
}

function ResultRow({ member }: { member: MemberResult }) {
  return (
    <tr className="border-b border-arena-border last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-arena-raised text-xs font-semibold text-arena-muted uppercase">
            {(member.userName ?? '?').charAt(0)}
          </div>
          <span className="text-sm text-arena-text">
            {member.userName ?? `ID: ${member.memberId.slice(0, 8)}…`}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-arena-muted">
        {member.previousSkill !== null ? (
          <span>{Number(member.previousSkill).toFixed(1)}</span>
        ) : (
          <Minus className="size-3.5 mx-auto text-arena-border" />
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <SkillDelta
          previous={member.previousSkill}
          next={member.newSkill}
        />
      </td>
      <td className="px-4 py-3 text-center text-sm text-arena-muted">
        {member.voteCount}
      </td>
    </tr>
  )
}

export default function VotingResultsPage() {
  const { id: groupId, votingId } = useParams<{ id: string; votingId: string }>()

  const { data: group } = useGroup(groupId)
  const { data: results, isLoading, isError } = useVotingResults(groupId, votingId)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (isError || !results) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-arena-bg">
        <p className="text-sm text-arena-muted">
          Resultados não disponíveis ou acesso negado.
        </p>
        <Link
          href={`/groups/${groupId}/voting`}
          className="text-sm text-arena-accent hover:underline"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const sorted = [...results.members].sort((a, b) => {
    const aSkill = a.newSkill ?? a.previousSkill ?? 0
    const bSkill = b.newSkill ?? b.previousSkill ?? 0
    return bSkill - aSkill
  })

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">

        {/* Cabeçalho */}
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/voting`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Votação
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-hero text-arena-text uppercase">Resultados</h1>
              {group && (
                <p className="mt-1 text-sm text-arena-muted">{group.name}</p>
              )}
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <Badge variant={results.status === 'CLOSED' ? 'neutral' : 'success'}>
                {results.status === 'CLOSED' ? 'Encerrada' : 'Em andamento'}
              </Badge>
              {results.closedAt && (
                <p className="text-xs text-arena-muted">
                  Encerrada em {formatDate(results.closedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de resultados */}
        <div className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-arena-border bg-arena-raised">
                  <th className="px-4 py-3 text-left text-xs font-medium text-arena-muted uppercase tracking-wider">
                    Membro
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-arena-muted uppercase tracking-wider">
                    Skill anterior
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-arena-muted uppercase tracking-wider">
                    Novo skill
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-arena-muted uppercase tracking-wider">
                    Votos
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-arena-muted">
                      Nenhum membro com votos registrados.
                    </td>
                  </tr>
                ) : (
                  sorted.map((member) => (
                    <ResultRow key={member.memberId} member={member} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {results.status === 'CLOSED' && (
            <div className="border-t border-arena-border px-4 py-3">
              <p className="text-xs text-arena-muted">
                Votos de membros banidos foram excluídos do cálculo.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
