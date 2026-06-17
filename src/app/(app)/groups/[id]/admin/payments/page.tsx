'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, FileImage, Check, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Input, Label } from '@/components/ui'
import { Textarea } from '@/components/ui/textarea'
import { useGroup, useGroupMembers } from '@/lib/hooks/use-groups'
import {
  useGroupCharges,
  useApproveAttempt,
  useRejectAttempt,
  useApproveManually,
} from '@/lib/hooks/use-payments'
import { paymentsApi, type ChargeResponse } from '@/lib/api/payments'
import type { ApiError } from '@/lib/api/errors'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

function apiErr(error: unknown): string {
  return (error as ApiError).response?.data?.detail ?? 'Erro inesperado.'
}

type Tab = 'pending' | 'approved' | 'rejected'

interface ReviewModalProps {
  groupId: string
  charge: ChargeResponse
  mode: 'approve' | 'reject'
  onClose: () => void
}

function ReviewModal({ groupId, charge, mode, onClose }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)

  const approveAttempt = useApproveAttempt(groupId)
  const rejectAttempt = useRejectAttempt(groupId)

  useState(() => {
    paymentsApi.getDetail(groupId, charge.chargeId).then((detail) => {
      const pending = detail.attempts.find((a) => a.validationResult === null)
      setAttemptId(pending?.attemptId ?? null)
      setLoadingDetail(false)
    })
  })

  function handleSubmit() {
    if (!attemptId) return
    if (mode === 'approve') {
      approveAttempt.mutate(
        { chargeId: charge.chargeId, attemptId, reviewNote: note || undefined },
        {
          onSuccess: () => {
            toast.success('Comprovante aprovado!')
            onClose()
          },
          onError: (error) => toast.error(apiErr(error)),
        },
      )
    } else {
      if (!note.trim()) {
        toast.error('Informe o motivo da rejeição.')
        return
      }
      rejectAttempt.mutate(
        { chargeId: charge.chargeId, attemptId, reviewNote: note },
        {
          onSuccess: () => {
            toast.success('Comprovante rejeitado.')
            onClose()
          },
          onError: (error) => toast.error(apiErr(error)),
        },
      )
    }
  }

  const isPending = approveAttempt.isPending || rejectAttempt.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-card bg-arena-surface border border-arena-border shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
          <h3 className="font-display text-title text-arena-text">
            {mode === 'approve' ? 'Aprovar comprovante' : 'Rejeitar comprovante'}
          </h3>
          <button onClick={onClose} className="text-arena-muted hover:text-arena-text">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="rounded-lg border border-arena-border bg-arena-raised p-3">
            <p className="text-sm font-medium text-arena-text">{charge.memberName ?? 'Membro'}</p>
            <p className="text-caption text-arena-muted">
              {formatCurrency(charge.amount)} · {charge.matchDate ? formatDate(charge.matchDate) : '—'}
            </p>
          </div>

          {loadingDetail && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-arena-accent" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">
              {mode === 'approve' ? 'Nota (opcional)' : 'Motivo da rejeição *'}
            </Label>
            <Textarea
              id="note"
              placeholder={mode === 'approve' ? 'Ex: Comprovante válido' : 'Ex: Valor incorreto no comprovante'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant={mode === 'approve' ? 'primary' : 'danger'}
              size="md"
              className="flex-1"
              loading={isPending}
              disabled={loadingDetail || !attemptId}
              onClick={handleSubmit}
            >
              {mode === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ManualApprovalModalProps {
  groupId: string
  onClose: () => void
}

function ManualApprovalModal({ groupId, onClose }: ManualApprovalModalProps) {
  const [chargeId, setChargeId] = useState('')
  const [note, setNote] = useState('')
  const approveManually = useApproveManually(groupId)

  function handleSubmit() {
    if (!chargeId.trim()) {
      toast.error('Informe o ID da cobrança.')
      return
    }
    approveManually.mutate(
      { chargeId: chargeId.trim(), note: note || undefined },
      {
        onSuccess: () => {
          toast.success('Pagamento registrado manualmente!')
          onClose()
        },
        onError: (error) => toast.error(apiErr(error)),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-card bg-arena-surface border border-arena-border shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
          <h3 className="font-display text-title text-arena-text">Registrar pagamento manual</h3>
          <button onClick={onClose} className="text-arena-muted hover:text-arena-text">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-caption text-arena-muted">
            Use quando o membro pagou em dinheiro ou por outro meio sem comprovante digital.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chargeId">ID da cobrança</Label>
            <Input
              id="chargeId"
              placeholder="Cole o UUID da cobrança"
              value={chargeId}
              onChange={(e) => setChargeId(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manualNote">Nota (opcional)</Label>
            <Textarea
              id="manualNote"
              placeholder="Ex: Pago em dinheiro no dia da partida"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
              loading={approveManually.isPending}
              onClick={handleSubmit}
            >
              Registrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ChargeCardProps {
  charge: ChargeResponse
  tab: Tab
  onApprove?: () => void
  onReject?: () => void
}

function ChargeCard({ charge, tab, onApprove, onReject }: ChargeCardProps) {
  const hasPendingAttempt = charge.latestAttemptStatus === null && charge.status === 'PENDING'

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex-shrink-0">
        <div className="size-10 rounded-full bg-arena-raised border border-arena-border flex items-center justify-center">
          <FileImage className="size-5 text-arena-muted" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-arena-text truncate">
          {charge.memberName ?? 'Membro'}
        </p>
        <p className="text-caption text-arena-muted">
          {formatCurrency(charge.amount)}
          {charge.matchDate && ` · ${formatDate(charge.matchDate)}`}
        </p>
        {hasPendingAttempt && tab === 'pending' && (
          <p className="text-xs text-arena-accent mt-0.5">Sem comprovante enviado</p>
        )}
      </div>

      {tab === 'pending' && hasPendingAttempt ? (
        <span className="text-xs text-arena-muted">Aguardando jogador</span>
      ) : tab === 'pending' ? (
        <div className="flex gap-1.5 shrink-0">
          {onApprove && (
            <Button variant="primary" size="sm" onClick={onApprove}>
              <Check className="size-3.5" />
              Aprovar
            </Button>
          )}
          {onReject && (
            <Button variant="danger" size="sm" onClick={onReject}>
              <X className="size-3.5" />
              Rejeitar
            </Button>
          )}
        </div>
      ) : tab === 'approved' ? (
        <Badge variant="success">Pago</Badge>
      ) : (
        <Badge variant="danger">Rejeitado</Badge>
      )}
    </div>
  )
}

export default function AdminPaymentsPage() {
  const { id: groupId } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: group, isLoading: loadingGroup } = useGroup(groupId)

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'

  const pendingCharges = useGroupCharges(groupId, { status: 'PENDING' })
  const approvedCharges = useGroupCharges(groupId, { status: 'APPROVED' })

  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [reviewModal, setReviewModal] = useState<{ charge: ChargeResponse; mode: 'approve' | 'reject' } | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)

  if (loadingGroup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (!group || !canManage) {
    router.replace(`/groups/${groupId}`)
    return null
  }

  const pending = pendingCharges.data?.content ?? []
  const withAttempt = pending.filter((c) => c.latestAttemptStatus !== null)
  const withRejection = pending.filter((c) => c.latestAttemptStatus === 'REJECTED')
  const approved = approvedCharges.data?.content ?? []

  const tabItems = {
    pending: withAttempt.filter((c) => c.latestAttemptStatus !== 'REJECTED'),
    approved,
    rejected: withRejection,
  }

  const currentItems = tabItems[activeTab]

  const TAB_LABELS: Record<Tab, string> = {
    pending: `Aguardando revisão (${tabItems.pending.length})`,
    approved: `Aprovados (${approved.length})`,
    rejected: `Rejeitados (${tabItems.rejected.length})`,
  }

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/settings`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Configurações
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-hero text-arena-text uppercase">Pagamentos</h1>
              <p className="mt-1 text-caption text-arena-muted">{group.name}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowManualModal(true)}>
              <Plus className="size-4" />
              Registrar manual
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 rounded-lg border border-arena-border bg-arena-surface p-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-arena-accent text-white'
                  : 'text-arena-muted hover:text-arena-text'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Lista */}
        <section className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
          {(pendingCharges.isLoading || approvedCharges.isLoading) ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-arena-accent" />
            </div>
          ) : currentItems.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-arena-muted">
              {activeTab === 'pending'
                ? 'Nenhum comprovante aguardando revisão.'
                : activeTab === 'approved'
                  ? 'Nenhum pagamento aprovado.'
                  : 'Nenhum comprovante rejeitado.'}
            </p>
          ) : (
            <div className="divide-y divide-arena-border">
              {currentItems.map((charge) => (
                <ChargeCard
                  key={charge.chargeId}
                  charge={charge}
                  tab={activeTab}
                  onApprove={activeTab === 'pending'
                    ? () => setReviewModal({ charge, mode: 'approve' })
                    : undefined}
                  onReject={activeTab === 'pending'
                    ? () => setReviewModal({ charge, mode: 'reject' })
                    : undefined}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {reviewModal && (
        <ReviewModal
          groupId={groupId}
          charge={reviewModal.charge}
          mode={reviewModal.mode}
          onClose={() => setReviewModal(null)}
        />
      )}

      {showManualModal && (
        <ManualApprovalModal
          groupId={groupId}
          onClose={() => setShowManualModal(false)}
        />
      )}
    </div>
  )
}
