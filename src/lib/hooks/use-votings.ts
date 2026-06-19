'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { votingsApi } from '@/lib/api/votings'

export function useActiveVoting(groupId: string) {
  return useQuery({
    queryKey: ['active-voting', groupId],
    queryFn: () => votingsApi.getActive(groupId),
    enabled: !!groupId,
    retry: (count, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) return false
      return count < 2
    },
  })
}

export function useVotings(groupId: string) {
  return useQuery({
    queryKey: ['votings', groupId],
    queryFn: () => votingsApi.list(groupId),
    enabled: !!groupId,
  })
}

export function useMyVotes(groupId: string, votingId: string | undefined) {
  return useQuery({
    queryKey: ['my-votes', groupId, votingId],
    queryFn: () => votingsApi.getMyVotes(groupId, votingId!),
    enabled: !!groupId && !!votingId,
  })
}

export function useVotingResults(groupId: string, votingId: string) {
  return useQuery({
    queryKey: ['voting-results', groupId, votingId],
    queryFn: () => votingsApi.getResults(groupId, votingId),
    enabled: !!groupId && !!votingId,
  })
}

export function useOpenVoting(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (deadline: string) => votingsApi.open(groupId, deadline),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-voting', groupId] })
      qc.invalidateQueries({ queryKey: ['votings', groupId] })
    },
  })
}

export function useCastVote(groupId: string, votingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ targetMemberId, stars }: { targetMemberId: string; stars: number }) =>
      votingsApi.castVote(groupId, votingId, targetMemberId, stars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-votes', groupId, votingId] })
      qc.invalidateQueries({ queryKey: ['active-voting', groupId] })
    },
  })
}

export function useCloseVoting(groupId: string, votingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => votingsApi.close(groupId, votingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-voting', groupId] })
      qc.invalidateQueries({ queryKey: ['votings', groupId] })
      qc.invalidateQueries({ queryKey: ['voting-results', groupId, votingId] })
      qc.invalidateQueries({ queryKey: ['group-members', groupId] })
    },
  })
}

export function useBanFromVoting(groupId: string, votingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, reason }: { memberId: string; reason: string }) =>
      votingsApi.ban(groupId, votingId, memberId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-voting', groupId] })
    },
  })
}

export function useUnbanFromVoting(groupId: string, votingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => votingsApi.unban(groupId, votingId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-voting', groupId] })
    },
  })
}
