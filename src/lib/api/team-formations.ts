import { apiClient } from './client'

export type FormationType = 'AUTOMATIC' | 'MANUAL_ADJUSTED'

export interface TeamPlayer {
  memberId: string
  userName: string | null
  skill: number
  position: string | null
}

export interface Team {
  id: string
  name: string
  averageSkill: number
  playerCount: number
  players: TeamPlayer[]
}

export interface TeamFormation {
  id: string
  matchId: string
  numberOfTeams: number
  formationType: FormationType
  confirmedBy: string
  confirmedAt: string
  teams: Team[]
}

export interface GenerateFormationPayload {
  numberOfTeams: number
}

export interface MovePlayerPayload {
  memberId: string
  toTeamId: string
}

export const teamFormationsApi = {
  getCurrent: (groupId: string, matchId: string) =>
    apiClient
      .get<TeamFormation>(
        `/groups/${groupId}/matches/${matchId}/team-formations/current`,
      )
      .then((r) => r.data),

  generate: (groupId: string, matchId: string, data: GenerateFormationPayload) =>
    apiClient
      .post<TeamFormation>(
        `/groups/${groupId}/matches/${matchId}/team-formations`,
        data,
      )
      .then((r) => r.data),

  movePlayer: (
    groupId: string,
    matchId: string,
    formationId: string,
    data: MovePlayerPayload,
  ) =>
    apiClient
      .put<TeamFormation>(
        `/groups/${groupId}/matches/${matchId}/team-formations/${formationId}/move`,
        data,
      )
      .then((r) => r.data),

  delete: (groupId: string, matchId: string, formationId: string) =>
    apiClient
      .delete(
        `/groups/${groupId}/matches/${matchId}/team-formations/${formationId}`,
      )
      .then((r) => r.data),
}
