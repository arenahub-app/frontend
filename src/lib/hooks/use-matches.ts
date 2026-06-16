'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { matchesApi, type CreateMatchPayload, type UpdateMatchPayload } from '@/lib/api/matches'

export function useMatches(groupId: string, filter?: 'upcoming' | 'past' | 'all') {
  return useQuery({
    queryKey: ['matches', groupId, filter ?? 'upcoming'],
    queryFn: () => matchesApi.list(groupId, filter),
    enabled: !!groupId,
  })
}

export function useMatch(groupId: string, matchId: string) {
  return useQuery({
    queryKey: ['match', groupId, matchId],
    queryFn: () => matchesApi.get(groupId, matchId),
    enabled: !!groupId && !!matchId,
  })
}

export function usePresenceList(groupId: string, matchId: string) {
  return useQuery({
    queryKey: ['presence', groupId, matchId],
    queryFn: () => matchesApi.getPresenceList(groupId, matchId),
    enabled: !!groupId && !!matchId,
  })
}

export function useCreateMatch(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMatchPayload) => matchesApi.create(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches', groupId] })
    },
  })
}

export function useUpdateMatch(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMatchPayload) => matchesApi.update(groupId, matchId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['matches', groupId] })
    },
  })
}

export function useCancelMatch(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (matchId: string) => matchesApi.cancel(groupId, matchId),
    onSuccess: (_data, matchId) => {
      qc.invalidateQueries({ queryKey: ['matches', groupId] })
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
    },
  })
}

export function useClosePresenceList(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => matchesApi.closePresenceList(groupId, matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
    },
  })
}

export function useConfirmPresence(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => matchesApi.confirmPresence(groupId, matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['presence', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['matches', groupId] })
    },
  })
}

export function useDeclinePresence(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => matchesApi.declinePresence(groupId, matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['presence', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['matches', groupId] })
    },
  })
}

export function useCancelPresence(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => matchesApi.cancelPresence(groupId, matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['presence', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['matches', groupId] })
    },
  })
}

export function useAdminForcePresence(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => matchesApi.adminForcePresence(groupId, matchId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presence', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
    },
  })
}

export function useAdminRemovePresence(groupId: string, matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => matchesApi.adminRemovePresence(groupId, matchId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presence', groupId, matchId] })
      qc.invalidateQueries({ queryKey: ['match', groupId, matchId] })
    },
  })
}

export function useBanMember(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, reason }: { memberId: string; reason: string }) =>
      matchesApi.banMember(groupId, memberId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', groupId] })
    },
  })
}

export function useUnbanMember(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => matchesApi.unbanMember(groupId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', groupId] })
    },
  })
}
