import { apiClient } from './client'

export type Sport = 'FOOTBALL' | 'VOLLEYBALL' | 'BASKETBALL' | 'FUTEVOLEI' | 'BEACH_TENNIS' | 'OTHER'
export type GroupRole = 'OWNER' | 'ADMIN' | 'PLAYER' | 'REFEREE'
export type GroupStatus = 'ACTIVE' | 'INACTIVE'
export type SkillSource = 'DEFAULT' | 'VOTING' | 'MANUAL'
export type PlayerPosition =
  | 'GOALKEEPER' | 'DEFENDER' | 'LATERAL' | 'MIDFIELDER' | 'FORWARD'
  | 'SETTER' | 'WING_SPIKER' | 'MIDDLE_BLOCKER' | 'OPPOSITE' | 'LIBERO'
  | 'POINT_GUARD' | 'SHOOTING_GUARD' | 'SMALL_FORWARD' | 'POWER_FORWARD' | 'CENTER'
  | 'ATTACKER_FV' | 'DEFENDER_FV'
  | 'RIGHT_BT' | 'LEFT_BT'
  | 'OTHER'

export const SPORT_LABELS: Record<Sport, string> = {
  FOOTBALL:     'Futebol',
  VOLLEYBALL:   'Vôlei',
  BASKETBALL:   'Basquete',
  FUTEVOLEI:    'Futevôlei',
  BEACH_TENNIS: 'Beach Tennis',
  OTHER:        'Outro',
}

export const ROLE_BADGE_VARIANT: Record<GroupRole, 'success' | 'warning' | 'neutral'> = {
  OWNER:   'success',
  ADMIN:   'warning',
  PLAYER:  'neutral',
  REFEREE: 'neutral',
}

export const ROLE_LABELS: Record<GroupRole, string> = {
  OWNER:   'Dono',
  ADMIN:   'Admin',
  PLAYER:  'Jogador',
  REFEREE: 'Árbitro',
}

export const ROLE_ORDER: Record<GroupRole, number> = {
  OWNER:   0,
  ADMIN:   1,
  PLAYER:  2,
  REFEREE: 3,
}

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOALKEEPER:    'Goleiro',
  DEFENDER:      'Zagueiro',
  LATERAL:       'Lateral',
  MIDFIELDER:    'Meia',
  FORWARD:       'Atacante',
  SETTER:        'Levantador',
  WING_SPIKER:   'Ponta',
  MIDDLE_BLOCKER:'Central',
  OPPOSITE:      'Oposto',
  LIBERO:        'Líbero',
  POINT_GUARD:   'Armador',
  SHOOTING_GUARD:'Ala Atirador',
  SMALL_FORWARD: 'Ala',
  POWER_FORWARD: 'Ala Pivô',
  CENTER:        'Pivô',
  ATTACKER_FV:   'Atacante',
  DEFENDER_FV:   'Defensor',
  RIGHT_BT:      'Direita',
  LEFT_BT:       'Esquerda',
  OTHER:         'Outro',
}

export const POSITIONS_BY_SPORT: Record<Sport, PlayerPosition[]> = {
  FOOTBALL:     ['GOALKEEPER', 'DEFENDER', 'LATERAL', 'MIDFIELDER', 'FORWARD'],
  VOLLEYBALL:   ['SETTER', 'WING_SPIKER', 'MIDDLE_BLOCKER', 'OPPOSITE', 'LIBERO'],
  BASKETBALL:   ['POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER'],
  FUTEVOLEI:    ['ATTACKER_FV', 'DEFENDER_FV'],
  BEACH_TENNIS: ['RIGHT_BT', 'LEFT_BT'],
  OTHER:        ['OTHER'],
}

export interface GroupSummary {
  id: string
  name: string
  sport: Sport
  photoUrl: string | null
  status: GroupStatus
  memberCount: number
  myRole: GroupRole
}

export interface Group {
  id: string
  name: string
  sport: Sport
  description: string | null
  photoUrl: string | null
  pixKey: string | null
  status: GroupStatus
  memberCount: number
  myRole: GroupRole
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  userId: string
  groupId: string
  userName: string | null
  role: GroupRole
  skill: number
  skillSource: SkillSource
  position: PlayerPosition | null
  isSubscriber: boolean
  joinedAt: string
}

export interface Invite {
  id: string
  groupId: string
  token: string
  usageCount: number
  maxUsages: number
  active: boolean
  expiresAt: string
  createdAt: string
}

export interface InvitePreview {
  groupId: string
  groupName: string
  sport: Sport
  photoUrl: string | null
  memberCount: number
  expiresAt: string
}

export interface JoinGroupResponse {
  groupId: string
  memberId: string
  role: GroupRole
}

export interface CreateGroupPayload {
  name: string
  sport: Sport
  description?: string
}

export interface UpdateGroupPayload {
  name?: string
  sport?: Sport
  description?: string
  pixKey?: string
}

export interface UpdateMemberPayload {
  role?: GroupRole
  skill?: number
  position?: PlayerPosition | null
  subscriptionActive?: boolean
}

export const groupsApi = {
  list: () =>
    apiClient.get<GroupSummary[]>('/groups').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Group>(`/groups/${id}`).then((r) => r.data),

  create: (data: CreateGroupPayload) =>
    apiClient.post<Group>('/groups', data).then((r) => r.data),

  update: (id: string, data: UpdateGroupPayload) =>
    apiClient.patch<Group>(`/groups/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.delete(`/groups/${id}`).then((r) => r.data),

  listMembers: (id: string) =>
    apiClient.get<Member[]>(`/groups/${id}/members`).then((r) => r.data),

  updateMember: (groupId: string, memberId: string, data: UpdateMemberPayload) =>
    apiClient.patch<Member>(`/groups/${groupId}/members/${memberId}`, data).then((r) => r.data),

  removeMember: (groupId: string, memberId: string) =>
    apiClient.delete(`/groups/${groupId}/members/${memberId}`).then((r) => r.data),

  listInvites: (id: string) =>
    apiClient.get<Invite[]>(`/groups/${id}/invites`).then((r) => r.data),

  generateInvite: (id: string) =>
    apiClient.post<Invite>(`/groups/${id}/invites`).then((r) => r.data),

  deactivateInvite: (groupId: string, inviteId: string) =>
    apiClient.delete(`/groups/${groupId}/invites/${inviteId}`).then((r) => r.data),

  getInvitePreview: (token: string) =>
    apiClient.get<InvitePreview>(`/invites/${token}`).then((r) => r.data),

  joinByInvite: (token: string) =>
    apiClient.post<JoinGroupResponse>(`/invites/${token}/join`).then((r) => r.data),
}

export function buildInviteLink(token: string): string {
  if (typeof window === 'undefined') return `/invite/${token}`
  return `${window.location.origin}/invite/${token}`
}

export function isInviteValid(invite: Invite): boolean {
  return invite.active
    && invite.usageCount < invite.maxUsages
    && new Date(invite.expiresAt) > new Date()
}

export function isPreviewValid(preview: InvitePreview): boolean {
  return new Date(preview.expiresAt) > new Date()
}
