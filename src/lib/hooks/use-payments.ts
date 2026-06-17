'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsApi, type ChargeStatus } from '@/lib/api/payments'

export function useMyCharges(groupId: string) {
  return useQuery({
    queryKey: ['my-charges', groupId],
    queryFn: () => paymentsApi.listMyCharges(groupId),
    enabled: !!groupId,
  })
}

export function useMatchCharges(groupId: string, matchId: string, enabled = true) {
  return useQuery({
    queryKey: ['match-charges', groupId, matchId],
    queryFn: () => paymentsApi.listByMatch(groupId, matchId),
    enabled: !!groupId && !!matchId && enabled,
  })
}

export function useGroupCharges(
  groupId: string,
  params?: { status?: ChargeStatus; page?: number; size?: number },
) {
  return useQuery({
    queryKey: ['group-charges', groupId, params],
    queryFn: () => paymentsApi.listGroupCharges(groupId, params),
    enabled: !!groupId,
  })
}

export function useChargeDetail(groupId: string, chargeId: string | null) {
  return useQuery({
    queryKey: ['charge-detail', groupId, chargeId],
    queryFn: () => paymentsApi.getDetail(groupId, chargeId!),
    enabled: !!groupId && !!chargeId,
  })
}

export function useSubmitReceipt(groupId: string, chargeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => paymentsApi.submitReceipt(groupId, chargeId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-charges', groupId] })
      qc.invalidateQueries({ queryKey: ['group-charges', groupId] })
    },
  })
}

export function useApproveAttempt(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      chargeId,
      attemptId,
      reviewNote,
    }: {
      chargeId: string
      attemptId: string
      reviewNote?: string
    }) => paymentsApi.approveAttempt(groupId, chargeId, attemptId, reviewNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-charges', groupId] })
      qc.invalidateQueries({ queryKey: ['match-charges', groupId] })
      qc.invalidateQueries({ queryKey: ['charge-detail', groupId] })
    },
  })
}

export function useRejectAttempt(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      chargeId,
      attemptId,
      reviewNote,
    }: {
      chargeId: string
      attemptId: string
      reviewNote: string
    }) => paymentsApi.rejectAttempt(groupId, chargeId, attemptId, reviewNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-charges', groupId] })
      qc.invalidateQueries({ queryKey: ['match-charges', groupId] })
      qc.invalidateQueries({ queryKey: ['charge-detail', groupId] })
    },
  })
}

export function useApproveManually(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ chargeId, note }: { chargeId: string; note?: string }) =>
      paymentsApi.approveManually(groupId, chargeId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-charges', groupId] })
      qc.invalidateQueries({ queryKey: ['match-charges', groupId] })
    },
  })
}
