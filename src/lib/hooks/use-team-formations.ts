'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  teamFormationsApi,
  type GenerateFormationPayload,
  type MovePlayerPayload,
} from '@/lib/api/team-formations'

export function useCurrentFormation(groupId: string, matchId: string) {
  return useQuery({
    queryKey: ['team-formation', groupId, matchId],
    queryFn: () => teamFormationsApi.getCurrent(groupId, matchId),
    enabled: !!groupId && !!matchId,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) return false
      return failureCount < 3
    },
  })
}

export function useGenerateFormation(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateFormationPayload) =>
      teamFormationsApi.generate(groupId, matchId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-formation', groupId, matchId] })
    },
  })
}

export function useMovePlayer(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      formationId,
      data,
    }: {
      formationId: string
      data: MovePlayerPayload
    }) => teamFormationsApi.movePlayer(groupId, matchId, formationId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-formation', groupId, matchId] })
    },
  })
}

export function useDeleteFormation(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formationId: string) =>
      teamFormationsApi.delete(groupId, matchId, formationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-formation', groupId, matchId] })
    },
  })
}
