import { apiClient } from './client'
import type { PlayerPosition } from './groups'
import type { PendingCharge } from './payments'

export type MatchStatus = 'SCHEDULED' | 'CANCELLED'
export type PresenceListStatus = 'OPEN' | 'CLOSED'
export type PresenceStatus = 'CONFIRMED' | 'DECLINED' | 'BANNED_PENDING'

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'Agendada',
  CANCELLED: 'Cancelada',
}

export const PRESENCE_LIST_STATUS_LABELS: Record<PresenceListStatus, string> = {
  OPEN: 'Lista aberta',
  CLOSED: 'Lista fechada',
}

export const PRESENCE_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  DECLINED: 'Recusou',
  BANNED_PENDING: 'Banido (pendente)',
  WAITING: 'Na fila',
}

export interface MatchSummary {
  id: string
  scheduledAt: string
  listClosesAt: string
  locationName: string
  locationAddress: string | null
  maxPlayers: number
  status: MatchStatus
  presenceListStatus: PresenceListStatus
  confirmedCount: number
  waitingCount: number
}

export interface Match {
  id: string
  groupId: string
  scheduledAt: string
  listClosesAt: string
  locationName: string
  locationAddress: string | null
  maxPlayers: number
  status: MatchStatus
  presenceListStatus: PresenceListStatus
  createdBy: string
  createdAt: string
  myPresenceStatus: string | null
  confirmedCount: number
  waitingCount: number
}

export interface PresenceEntry {
  id: string
  memberId: string
  userName: string | null
  role: string | null
  skill: number | null
  position: PlayerPosition | null
  status: PresenceStatus
  confirmedAt: string | null
}

export interface WaitingEntry {
  id: string
  memberId: string
  userName: string | null
  role: string | null
  skill: number | null
  position: PlayerPosition | null
  queuePosition: number
  createdAt: string
}

export interface PresenceList {
  confirmed: PresenceEntry[]
  declined: PresenceEntry[]
  waiting: WaitingEntry[]
}

export interface PresenceActionResult {
  type: 'PRESENCE' | 'WAITING' | 'DECLINED'
  presenceEntry: PresenceEntry | null
  waitingEntry: WaitingEntry | null
  pendingCharge: PendingCharge | null
}

export interface CreateMatchPayload {
  scheduledAt: string
  locationName: string
  locationAddress?: string
  maxPlayers: number
}

export interface UpdateMatchPayload {
  scheduledAt?: string
  locationName?: string
  locationAddress?: string
  maxPlayers?: number
}

export const matchesApi = {
  list: (groupId: string, filter?: 'upcoming' | 'past' | 'all') =>
    apiClient
      .get<MatchSummary[]>(`/groups/${groupId}/matches`, { params: filter ? { filter } : undefined })
      .then((r) => r.data),

  get: (groupId: string, matchId: string) =>
    apiClient.get<Match>(`/groups/${groupId}/matches/${matchId}`).then((r) => r.data),

  create: (groupId: string, data: CreateMatchPayload) =>
    apiClient.post<Match>(`/groups/${groupId}/matches`, data).then((r) => r.data),

  update: (groupId: string, matchId: string, data: UpdateMatchPayload) =>
    apiClient.patch<Match>(`/groups/${groupId}/matches/${matchId}`, data).then((r) => r.data),

  cancel: (groupId: string, matchId: string) =>
    apiClient.post<void>(`/groups/${groupId}/matches/${matchId}/cancel`).then((r) => r.data),

  closePresenceList: (groupId: string, matchId: string) =>
    apiClient
      .post<void>(`/groups/${groupId}/matches/${matchId}/close-list`)
      .then((r) => r.data),

  getPresenceList: (groupId: string, matchId: string) =>
    apiClient
      .get<PresenceList>(`/groups/${groupId}/matches/${matchId}/presence`)
      .then((r) => r.data),

  confirmPresence: (groupId: string, matchId: string) =>
    apiClient
      .post<PresenceActionResult>(`/groups/${groupId}/matches/${matchId}/presence`, {
        action: 'CONFIRM',
      })
      .then((r) => r.data),

  declinePresence: (groupId: string, matchId: string) =>
    apiClient
      .post<PresenceActionResult>(`/groups/${groupId}/matches/${matchId}/presence`, {
        action: 'DECLINE',
      })
      .then((r) => r.data),

  cancelPresence: (groupId: string, matchId: string) =>
    apiClient.delete(`/groups/${groupId}/matches/${matchId}/presence`).then((r) => r.data),

  adminForcePresence: (groupId: string, matchId: string, memberId: string) =>
    apiClient
      .put<PresenceEntry>(`/groups/${groupId}/matches/${matchId}/presence/${memberId}`)
      .then((r) => r.data),

  adminRemovePresence: (groupId: string, matchId: string, memberId: string) =>
    apiClient
      .delete(`/groups/${groupId}/matches/${matchId}/presence/${memberId}`)
      .then((r) => r.data),

  banMember: (groupId: string, memberId: string, reason: string) =>
    apiClient
      .post(`/groups/${groupId}/members/${memberId}/presence-ban`, { reason })
      .then((r) => r.data),

  unbanMember: (groupId: string, memberId: string) =>
    apiClient.delete(`/groups/${groupId}/members/${memberId}/presence-ban`).then((r) => r.data),
}
