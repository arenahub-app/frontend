import { apiClient } from './client'

export type ChargeStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ChargeType = 'DAILY' | 'SUBSCRIPTION'
export type ValidationResult = 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW'

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  PENDING:  'Pendente',
  APPROVED: 'Pago',
  REJECTED: 'Rejeitado',
}

export interface PendingCharge {
  chargeId: string
  amount: number
  pixKey: string | null
  status: ChargeStatus
}

export interface ChargeResponse {
  chargeId: string
  memberId: string | null
  memberName: string | null
  guestId: string | null
  guestName: string | null
  type: ChargeType
  amount: number
  referenceMatchId: string | null
  matchDate: string | null
  status: ChargeStatus
  latestAttemptStatus: ValidationResult | null
  createdAt: string
}

export interface PaymentAttemptDetail {
  attemptId: string
  fileUrl: string | null
  contentType: string | null
  submittedAt: string
  validationResult: ValidationResult | null
  validationSource: string | null
  reviewNote: string | null
}

export interface ChargeDetailResponse extends ChargeResponse {
  pixKey: string | null
  attempts: PaymentAttemptDetail[]
}

export interface ChargeStatusResponse {
  chargeId: string
  status: ChargeStatus
  approvedAt?: string
  attemptId?: string
  reviewNote?: string
}

export interface ChargePageResponse {
  content: ChargeResponse[]
  totalElements: number
  totalPages: number
}

export const paymentsApi = {
  listGroupCharges: (
    groupId: string,
    params?: { status?: ChargeStatus; matchId?: string; page?: number; size?: number },
  ) =>
    apiClient
      .get<ChargePageResponse>(`/groups/${groupId}/charges`, { params })
      .then((r) => r.data),

  listMyCharges: (groupId: string) =>
    apiClient.get<ChargeResponse[]>(`/groups/${groupId}/charges/mine`).then((r) => r.data),

  listByMatch: (groupId: string, matchId: string) =>
    apiClient
      .get<ChargeResponse[]>(`/groups/${groupId}/charges/by-match/${matchId}`)
      .then((r) => r.data),

  getDetail: (groupId: string, chargeId: string) =>
    apiClient
      .get<ChargeDetailResponse>(`/groups/${groupId}/charges/${chargeId}`)
      .then((r) => r.data),

  submitReceipt: (groupId: string, chargeId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient
      .post<{ attemptId: string; message: string }>(
        `/groups/${groupId}/charges/${chargeId}/payment-attempts`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data)
  },

  approveAttempt: (
    groupId: string,
    chargeId: string,
    attemptId: string,
    reviewNote?: string,
  ) =>
    apiClient
      .post<ChargeStatusResponse>(
        `/groups/${groupId}/charges/${chargeId}/payment-attempts/${attemptId}/approve`,
        { reviewNote: reviewNote ?? null },
      )
      .then((r) => r.data),

  rejectAttempt: (
    groupId: string,
    chargeId: string,
    attemptId: string,
    reviewNote: string,
  ) =>
    apiClient
      .post<ChargeStatusResponse>(
        `/groups/${groupId}/charges/${chargeId}/payment-attempts/${attemptId}/reject`,
        { reviewNote },
      )
      .then((r) => r.data),

  approveManually: (groupId: string, chargeId: string, note?: string) =>
    apiClient
      .post<ChargeStatusResponse>(
        `/groups/${groupId}/charges/${chargeId}/approve-manually`,
        { note: note ?? null },
      )
      .then((r) => r.data),
}
