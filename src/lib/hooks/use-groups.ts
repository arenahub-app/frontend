'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi, type UpdateGroupPayload, type UpdateMemberPayload } from '@/lib/api/groups'

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.get(id),
    enabled: !!id,
  })
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => groupsApi.listMembers(groupId),
    enabled: !!groupId,
  })
}

export function useGroupInvites(groupId: string) {
  return useQuery({
    queryKey: ['group-invites', groupId],
    queryFn: () => groupsApi.listInvites(groupId),
    enabled: !!groupId,
  })
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => groupsApi.getInvitePreview(token),
    enabled: !!token,
    retry: false,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useUpdateGroup(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateGroupPayload) => groupsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', id] })
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useDeactivateGroup(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => groupsApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.removeQueries({ queryKey: ['group', id] })
    },
  })
}

export function useUpdateMember(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateMemberPayload }) =>
      groupsApi.updateMember(groupId, memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', groupId] })
    },
  })
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => groupsApi.removeMember(groupId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', groupId] })
      qc.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

export function useGenerateInvite(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => groupsApi.generateInvite(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-invites', groupId] })
    },
  })
}

export function useDeactivateInvite(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => groupsApi.deactivateInvite(groupId, inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-invites', groupId] })
    },
  })
}

export function useJoinByInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => groupsApi.joinByInvite(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}
