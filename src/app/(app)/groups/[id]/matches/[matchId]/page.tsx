'use client'

import { useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, MapPin, Users, Clock, Loader2,
  UserCheck, UserX, ShieldBan, Upload, X, Copy, Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button } from '@/components/ui'
import { useGroup } from '@/lib/hooks/use-groups'
import {
  useMatch,
  usePresenceList,
  useConfirmPresence,
  useDeclinePresence,
  useCancelPresence,
  useCancelMatch,
  useClosePresenceList,
  useAdminForcePresence,
  useAdminRemovePresence,
} from '@/lib/hooks/use-matches'
import { useCurrentFormation } from '@/lib/hooks/use-team-formations'
import { useMyCharges, useMatchCharges, useSubmitReceipt } from '@/lib/hooks/use-payments'
import {
  MATCH_STATUS_LABELS,
  PRESENCE_LIST_STATUS_LABELS,
  type PresenceEntry,
  type WaitingEntry,
} from '@/lib/api/matches'
import { CHARGE_STATUS_LABELS, type ChargeResponse } from '@/lib/api/payments'
import type { ApiError } from '@/lib/api/errors'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function buildWhatsAppText(
  match: import('@/lib/api/matches').Match,
  groupName: string | undefined,
  matchFee: number | null | undefined,
  pixKey: string | null | undefined,
  confirmed: import('@/lib/api/matches').PresenceEntry[],
): string {
  const available = match.maxPlayers - match.confirmedCount
  const divider = '━━━━━━━━━━━━━━━━'
  const lines: string[] = []

  if (groupName) lines.push(`⚽ *${groupName}*`)
  lines.push(divider)
  lines.push('')
  lines.push(`📅 *${formatDate(match.scheduledAt)}* às *${formatTime(match.scheduledAt)}*`)
  lines.push(`📍 ${match.locationName}`)
  if (match.locationAddress) lines.push(`    ${match.locationAddress}`)

  if (matchFee && matchFee > 0) {
    lines.push(`💰 ${formatCurrency(matchFee)}`)
    if (pixKey) lines.push(`    Pix: \`${pixKey}\``)
  }

  lines.push('')
  lines.push(divider)
  lines.push(
    `👥 *${match.confirmedCount}/${match.maxPlayers} confirmados* · ${available} vaga${available !== 1 ? 's' : ''} disponível`,
  )

  const pagos = confirmed.filter((e) => e.status === 'CONFIRMED')
  const pendentes = confirmed.filter((e) => e.status === 'PAYMENT_PENDING')

  if (pagos.length > 0) {
    lines.push('')
    if (pendentes.length > 0) lines.push('✅ *Pagamento confirmado*')
    pagos.forEach((entry, i) => {
      lines.push(`${i + 1}. ${entry.userName ?? `Jogador ${i + 1}`}`)
    })
  }

  if (pendentes.length > 0) {
    lines.push('')
    lines.push('⏳ *Aguardando pagamento*')
    pendentes.forEach((entry, i) => {
      lines.push(`${i + 1}. ${entry.userName ?? `Jogador ${i + 1}`}`)
    })
  }

  if (match.waitingCount > 0) {
    lines.push('')
    lines.push(`⏳ *Fila de espera:* ${match.waitingCount} pessoa${match.waitingCount !== 1 ? 's' : ''}`)
  }

  return lines.join('\n')
}

function apiErr(error: unknown): string {
  return (error as ApiError).response?.data?.detail ?? 'Erro inesperado.'
}

const CHARGE_STATUS_VARIANT = {
  PENDING:  'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
} as const

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface PresenceEntryRowProps {
  entry: PresenceEntry
  canManage: boolean
  charge?: ChargeResponse
  onRemove?: (memberId: string) => void
  isRemoving?: boolean
}

function PresenceEntryRow({ entry, canManage, charge, onRemove, isRemoving }: PresenceEntryRowProps) {
  const [confirming, setConfirming] = useState(false)
  const isBanned = entry.status === 'BANNED_PENDING'
  const isPaymentPending = entry.status === 'PAYMENT_PENDING'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-arena-text truncate">
            {entry.userName ?? `Membro ${entry.memberId.slice(0, 8)}…`}
          </span>
          {isBanned && <Badge variant="danger">Banido</Badge>}
          {isPaymentPending && <Badge variant="warning">Aguard. pagamento</Badge>}
        </div>
        {entry.skill != null && (
          <span className="text-xs text-arena-accent">★ {Number(entry.skill).toFixed(1)}</span>
        )}
      </div>

      {charge && (
        <Badge variant={CHARGE_STATUS_VARIANT[charge.status]}>
          {CHARGE_STATUS_LABELS[charge.status]}
        </Badge>
      )}

      {canManage && onRemove && (
        <>
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isRemoving}
                onClick={() => { onRemove(entry.memberId); setConfirming(false) }}
              >
                Remover
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              <UserX className="size-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

interface WaitingEntryRowProps {
  entry: WaitingEntry
  canManage: boolean
  onForce?: (memberId: string) => void
  onRemove?: (memberId: string) => void
  isActing?: boolean
}

function WaitingEntryRow({ entry, canManage, onForce, onRemove, isActing }: WaitingEntryRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-sm font-bold text-arena-muted w-6 text-center">{entry.queuePosition}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-arena-text truncate block">
          {entry.userName ?? `Membro ${entry.memberId.slice(0, 8)}…`}
        </span>
        {entry.skill != null && (
          <span className="text-xs text-arena-accent">★ {Number(entry.skill).toFixed(1)}</span>
        )}
      </div>
      {canManage && (
        <div className="flex gap-1.5 shrink-0">
          {onForce && (
            <Button variant="ghost" size="sm" loading={isActing} onClick={() => onForce(entry.memberId)}>
              <UserCheck className="size-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={() => onRemove(entry.memberId)}>
              <UserX className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

interface TeamsCardProps {
  groupId: string
  matchId: string
  canManage: boolean
}

function TeamsCard({ groupId, matchId, canManage }: TeamsCardProps) {
  const { data: formation, isLoading, isError } = useCurrentFormation(groupId, matchId)

  if (isLoading) {
    return <Loader2 className="size-4 animate-spin text-arena-muted" />
  }

  if (formation) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-arena-text">Times formados ✓</span>
        <Link
          href={`/groups/${groupId}/matches/${matchId}/teams`}
          className="text-sm font-medium text-arena-accent hover:underline"
        >
          Ver Times →
        </Link>
      </div>
    )
  }

  if (isError && canManage) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-arena-muted">Lista encerrada. Pronto para formar times.</span>
        <Link
          href={`/groups/${groupId}/matches/${matchId}/teams`}
          className="text-sm font-medium text-arena-accent hover:underline"
        >
          Formar Times →
        </Link>
      </div>
    )
  }

  return null
}

interface ReceiptModalProps {
  groupId: string
  chargeId: string
  amount: number
  pixKey: string | null
  onClose: () => void
}

function ReceiptModal({ groupId, chargeId, amount, pixKey, onClose }: ReceiptModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const submit = useSubmitReceipt(groupId, chargeId)

  function pickFile(f: File) {
    if (!ALLOWED_MIME.includes(f.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou PDF.')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 10 MB.')
      return
    }
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  function handleSend() {
    if (!file) return
    submit.mutate(file, {
      onSuccess: () => {
        toast.success('Comprovante enviado! Aguardando confirmação do administrador.')
        onClose()
      },
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  async function copyPix() {
    if (!pixKey) return
    await navigator.clipboard.writeText(pixKey)
    toast.success('Chave Pix copiada!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-card bg-arena-surface border border-arena-border shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
          <h3 className="font-display text-title text-arena-text">Enviar comprovante</h3>
          <button onClick={onClose} className="text-arena-muted hover:text-arena-text">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Pix info */}
          <div className="rounded-lg border border-arena-border bg-arena-raised p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-caption text-arena-muted">Valor a pagar</span>
              <span className="font-display text-title text-arena-text">{formatCurrency(amount)}</span>
            </div>
            {pixKey && (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-caption text-arena-muted block">Chave Pix</span>
                  <span className="text-sm text-arena-text font-mono truncate block">{pixKey}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={copyPix}>
                  <Copy className="size-3.5" />
                  Copiar
                </Button>
              </div>
            )}
          </div>

          {/* Upload area */}
          <div
            className={`rounded-lg border-2 border-dashed p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              dragOver ? 'border-arena-accent bg-arena-accent/5' : 'border-arena-border hover:border-arena-accent/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-6 text-arena-muted" />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-arena-text">{file.name}</p>
                <p className="text-xs text-arena-muted">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-arena-text">Arraste ou clique para selecionar</p>
                <p className="text-xs text-arena-muted">PNG, JPG ou PDF · máx. 10 MB</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              disabled={!file}
              loading={submit.isPending}
              onClick={handleSend}
            >
              Enviar comprovante
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MatchDetailPage() {
  const { id: groupId, matchId } = useParams<{ id: string; matchId: string }>()
  const router = useRouter()

  const { data: group } = useGroup(groupId)
  const { data: match, isLoading: loadingMatch } = useMatch(groupId, matchId)
  const { data: presenceList, isLoading: loadingPresence } = usePresenceList(groupId, matchId)

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'
  const isReferee = group?.myRole === 'REFEREE'
  const groupHasFee = (group?.matchFee ?? 0) > 0

  const { data: myCharges } = useMyCharges(groupId)
  const { data: matchCharges } = useMatchCharges(groupId, matchId, canManage && groupHasFee)

  const myMatchCharge = myCharges?.find((c) => c.referenceMatchId === matchId) ?? null
  const chargeByMember = new Map(matchCharges?.map((c) => [c.memberId, c]) ?? [])

  const confirmPresence = useConfirmPresence(groupId, matchId)
  const declinePresence = useDeclinePresence(groupId, matchId)
  const cancelPresence = useCancelPresence(groupId, matchId)
  const cancelMatch = useCancelMatch(groupId)
  const closePresenceList = useClosePresenceList(groupId, matchId)
  const adminForce = useAdminForcePresence(groupId, matchId)
  const adminRemove = useAdminRemovePresence(groupId, matchId)

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptCharge, setReceiptCharge] = useState<{ chargeId: string; amount: number } | null>(null)

  function openReceiptModal(chargeId: string, amount: number) {
    setReceiptCharge({ chargeId, amount })
    setShowReceiptModal(true)
  }

  if (loadingMatch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-arena-bg">
        <p className="text-body text-arena-muted">Partida não encontrada.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/groups/${groupId}/matches`)}>
          Voltar
        </Button>
      </div>
    )
  }

  const isScheduled = match.status === 'SCHEDULED'
  const isListOpen = match.presenceListStatus === 'OPEN'
  const myStatus = match.myPresenceStatus

  function handleConfirm() {
    confirmPresence.mutate(undefined, {
      onSuccess: (result) => {
        if (result.type === 'WAITING') {
          toast.success(`Você entrou na fila — posição ${result.waitingEntry?.queuePosition}.`)
        } else if (result.presenceEntry?.status === 'BANNED_PENDING') {
          toast.warning('Você está banido. Sua presença ficará pendente de revisão.')
        } else if (result.pendingCharge) {
          openReceiptModal(result.pendingCharge.chargeId, result.pendingCharge.amount)
        } else {
          toast.success('Presença confirmada!')
        }
      },
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  function handleDecline() {
    declinePresence.mutate(undefined, {
      onSuccess: () => toast.success('Você recusou a partida.'),
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  function handleCancelPresence() {
    cancelPresence.mutate(undefined, {
      onSuccess: () => toast.success('Presença cancelada.'),
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  function handleCloseList() {
    closePresenceList.mutate(undefined, {
      onSuccess: () => toast.success('Lista de presença fechada.'),
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  function handleCancelMatch() {
    cancelMatch.mutate(matchId, {
      onSuccess: () => {
        toast.success('Partida cancelada.')
        router.push(`/groups/${groupId}/matches`)
      },
      onError: (error) => {
        toast.error(apiErr(error))
        setConfirmCancel(false)
      },
    })
  }

  function handleForcePresence(memberId: string) {
    adminForce.mutate(memberId, {
      onSuccess: () => toast.success('Presença confirmada para o membro.'),
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  function handleRemovePresence(memberId: string) {
    adminRemove.mutate(memberId, {
      onSuccess: () => toast.success('Membro removido da lista.'),
      onError: (error) => toast.error(apiErr(error)),
    })
  }

  function handleShare() {
    if (!match) return
    const text = buildWhatsAppText(
      match,
      group?.name,
      group?.matchFee,
      group?.pixKey,
      presenceList?.confirmed ?? [],
    )
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const presenceActionPending =
    confirmPresence.isPending || declinePresence.isPending || cancelPresence.isPending

  const showChargeCard =
    !canManage &&
    !isReferee &&
    myMatchCharge !== null &&
    myMatchCharge?.status === 'PENDING'

  const hasPendingAttempt = myMatchCharge?.latestAttemptStatus === null && myMatchCharge.status === 'PENDING'

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">

        {/* Cabeçalho */}
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/matches`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Partidas
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Partida</h1>
        </div>

        <div className="flex flex-col gap-5">

          {/* Info card */}
          <section className="rounded-card border border-arena-border bg-arena-surface p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex gap-2 flex-wrap">
                {!isScheduled && (
                  <Badge variant="danger">{MATCH_STATUS_LABELS[match.status]}</Badge>
                )}
                <Badge variant={isListOpen ? 'success' : 'neutral'}>
                  {PRESENCE_LIST_STATUS_LABELS[match.presenceListStatus]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-sm">
                <Users className="size-4 text-arena-muted" />
                <span className="font-medium text-arena-text">{match.confirmedCount}</span>
                <span className="text-arena-muted">/ {match.maxPlayers}</span>
                {match.waitingCount > 0 && (
                  <span className="text-xs text-arena-accent">+{match.waitingCount}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-arena-text">
                <Calendar className="size-4 text-arena-muted shrink-0" />
                <span>{formatDate(match.scheduledAt)} às {formatTime(match.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-arena-muted">
                <Clock className="size-4 shrink-0" />
                <span>Lista fecha às {formatTime(match.listClosesAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-arena-text">
                <MapPin className="size-4 text-arena-muted shrink-0" />
                <div>
                  <span>{match.locationName}</span>
                  {match.locationAddress && (
                    <span className="block text-xs text-arena-muted">{match.locationAddress}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="size-3.5" />
                Compartilhar
              </Button>
            </div>
          </section>

          {/* Card de cobrança pendente (jogador) */}
          {showChargeCard && myMatchCharge && (
            <section className="rounded-card border border-arena-warning/30 bg-arena-warning/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-arena-text mb-0.5">
                    Pagamento pendente · {formatCurrency(myMatchCharge.amount)}
                  </p>
                  {group?.pixKey && (
                    <p className="text-xs text-arena-muted">
                      Pix: <span className="font-mono">{group.pixKey}</span>
                    </p>
                  )}
                  {myMatchCharge.latestAttemptStatus !== null && (
                    <p className="text-xs text-arena-muted mt-1">
                      Comprovante enviado · aguardando revisão do administrador.
                    </p>
                  )}
                </div>
                {!hasPendingAttempt && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openReceiptModal(myMatchCharge.chargeId, myMatchCharge.amount)}
                  >
                    Enviar comprovante
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Minha presença */}
          {isScheduled && !isReferee && (
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <h2 className="font-display text-title text-arena-text mb-3">Minha presença</h2>

              {myStatus === 'CONFIRMED' && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-arena-text">Confirmado</span>
                  </div>
                  {isListOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={presenceActionPending}
                      onClick={handleCancelPresence}
                    >
                      Cancelar presença
                    </Button>
                  )}
                </div>
              )}

              {myStatus === 'WAITING' && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm text-arena-text">Na fila de espera</span>
                  </div>
                  {isListOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={presenceActionPending}
                      onClick={handleCancelPresence}
                    >
                      Sair da fila
                    </Button>
                  )}
                </div>
              )}

              {myStatus === 'DECLINED' && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-arena-muted" />
                    <span className="text-sm text-arena-muted">Recusou</span>
                  </div>
                  {isListOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={presenceActionPending}
                      onClick={handleConfirm}
                    >
                      Confirmar agora
                    </Button>
                  )}
                </div>
              )}

              {myStatus === 'BANNED_PENDING' && (
                <div className="flex items-center gap-2">
                  <ShieldBan className="size-4 text-arena-danger" />
                  <span className="text-sm text-arena-danger">
                    Presença pendente — você está banido de partidas deste grupo.
                  </span>
                </div>
              )}

              {myStatus === 'PAYMENT_PENDING' && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm text-arena-text">Aguardando pagamento</span>
                  </div>
                  {myMatchCharge && (
                    myMatchCharge.latestAttemptStatus !== null ? (
                      <span className="text-xs text-arena-muted">
                        Comprovante enviado · aguardando revisão
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openReceiptModal(myMatchCharge.chargeId, myMatchCharge.amount)}
                      >
                        Enviar comprovante
                      </Button>
                    )
                  )}
                </div>
              )}

              {!myStatus && isListOpen && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={presenceActionPending}
                    onClick={handleConfirm}
                    className="flex-1"
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={presenceActionPending}
                    onClick={handleDecline}
                    className="flex-1"
                  >
                    Não vou
                  </Button>
                </div>
              )}

              {!myStatus && !isListOpen && (
                <p className="text-sm text-arena-muted">A lista de presença está fechada.</p>
              )}
            </section>
          )}

          {/* Ações admin */}
          {canManage && isScheduled && (
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <h2 className="font-display text-title text-arena-text mb-3">Administração</h2>
              <div className="flex flex-col gap-2">
                {isListOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={closePresenceList.isPending}
                    onClick={handleCloseList}
                  >
                    Fechar lista de presença
                  </Button>
                )}

                {!confirmCancel ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancelar partida
                  </Button>
                ) : (
                  <div className="flex gap-2 rounded-lg border border-arena-danger/20 bg-arena-danger/5 p-3">
                    <p className="flex-1 text-sm text-arena-danger">Cancelar a partida?</p>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
                      Não
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={cancelMatch.isPending}
                      onClick={handleCancelMatch}
                    >
                      Confirmar
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Lista de presença */}
          <section className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-arena-border">
              <h2 className="font-display text-title text-arena-text">Lista de presença</h2>
              {loadingPresence && <Loader2 className="size-4 animate-spin text-arena-muted" />}
            </div>

            {!presenceList ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-arena-accent" />
              </div>
            ) : (
              <>
                {/* Confirmados */}
                <div>
                  <div className="px-4 py-2 bg-arena-raised border-b border-arena-border flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-arena-muted">
                      Confirmados ({presenceList.confirmed.length}/{match.maxPlayers})
                    </span>
                    {canManage && groupHasFee && (
                      <span className="text-xs text-arena-muted">· Pagamento</span>
                    )}
                  </div>
                  {presenceList.confirmed.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-arena-muted">Nenhum confirmado ainda.</p>
                  ) : (
                    <div className="divide-y divide-arena-border">
                      {presenceList.confirmed.map((entry) => (
                        <PresenceEntryRow
                          key={entry.id}
                          entry={entry}
                          canManage={canManage}
                          charge={canManage && groupHasFee ? chargeByMember.get(entry.memberId) : undefined}
                          onRemove={canManage ? handleRemovePresence : undefined}
                          isRemoving={adminRemove.isPending}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Fila de espera */}
                {(presenceList.waiting.length > 0 || canManage) && (
                  <div className="border-t border-arena-border">
                    <div className="px-4 py-2 bg-arena-raised border-b border-arena-border">
                      <span className="text-xs font-semibold uppercase tracking-wide text-arena-muted">
                        Fila de espera ({presenceList.waiting.length})
                      </span>
                    </div>
                    {presenceList.waiting.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-arena-muted">Fila vazia.</p>
                    ) : (
                      <div className="divide-y divide-arena-border">
                        {presenceList.waiting.map((entry) => (
                          <WaitingEntryRow
                            key={entry.id}
                            entry={entry}
                            canManage={canManage}
                            onForce={canManage ? handleForcePresence : undefined}
                            onRemove={canManage ? (id) => adminRemove.mutate(id, {
                              onSuccess: () => toast.success('Removido da fila.'),
                              onError: (error) => toast.error(apiErr(error)),
                            }) : undefined}
                            isActing={adminForce.isPending}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recusaram */}
                {presenceList.declined.length > 0 && (
                  <div className="border-t border-arena-border">
                    <div className="px-4 py-2 bg-arena-raised border-b border-arena-border">
                      <span className="text-xs font-semibold uppercase tracking-wide text-arena-muted">
                        Não vão ({presenceList.declined.length})
                      </span>
                    </div>
                    <div className="divide-y divide-arena-border">
                      {presenceList.declined.map((entry) => (
                        <PresenceEntryRow
                          key={entry.id}
                          entry={entry}
                          canManage={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Times */}
          {match.presenceListStatus === 'CLOSED' && (
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <h2 className="font-display text-title text-arena-text mb-3">Times</h2>
              <TeamsCard groupId={groupId} matchId={matchId} canManage={canManage} />
            </section>
          )}

        </div>
      </div>

      {/* Modal de comprovante */}
      {showReceiptModal && receiptCharge && (
        <ReceiptModal
          groupId={groupId}
          chargeId={receiptCharge.chargeId}
          amount={receiptCharge.amount}
          pixKey={group?.pixKey ?? null}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  )
}
