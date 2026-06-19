import { apiClient } from './client'

export type VotingStatus = 'OPEN' | 'CLOSED'

export interface ActiveVoting {
  id: string
  groupId: string
  status: VotingStatus
  openedBy: string
  openedAt: string
  deadline: string
  closedAt: string | null
  totalVotable: number
  myVoteCount: number
  isBanned: boolean
}

export interface VotingSummary {
  id: string
  status: VotingStatus
  openedAt: string
  deadline: string
  closedAt: string | null
}

export interface VoteEntry {
  targetMemberId: string
  targetUserName: string
  stars: number
  votedAt: string
}

export interface MyVotesResponse {
  votingId: string
  totalVotable: number
  votes: VoteEntry[]
}

export interface MemberResult {
  memberId: string
  userName: string
  photoUrl: string | null
  previousSkill: number | null
  newSkill: number | null
  voteCount: number
}

export interface VotingResults {
  votingId: string
  status: VotingStatus
  closedAt: string | null
  members: MemberResult[]
}

export const votingsApi = {
  getActive: (groupId: string) =>
    apiClient.get<ActiveVoting>(`/groups/${groupId}/votings/active`).then((r) => r.data),

  list: (groupId: string) =>
    apiClient.get<VotingSummary[]>(`/groups/${groupId}/votings`).then((r) => r.data),

  open: (groupId: string, deadline: string) =>
    apiClient.post<ActiveVoting>(`/groups/${groupId}/votings`, { deadline }).then((r) => r.data),

  castVote: (groupId: string, votingId: string, targetMemberId: string, stars: number) =>
    apiClient
      .put<VoteEntry>(`/groups/${groupId}/votings/${votingId}/votes/${targetMemberId}`, { stars })
      .then((r) => r.data),

  getMyVotes: (groupId: string, votingId: string) =>
    apiClient
      .get<MyVotesResponse>(`/groups/${groupId}/votings/${votingId}/votes/my`)
      .then((r) => r.data),

  getResults: (groupId: string, votingId: string) =>
    apiClient
      .get<VotingResults>(`/groups/${groupId}/votings/${votingId}/results`)
      .then((r) => r.data),

  close: (groupId: string, votingId: string) =>
    apiClient
      .post<VotingResults>(`/groups/${groupId}/votings/${votingId}/close`)
      .then((r) => r.data),

  ban: (groupId: string, votingId: string, memberId: string, reason: string) =>
    apiClient
      .post<void>(`/groups/${groupId}/votings/${votingId}/bans`, { memberId, reason })
      .then((r) => r.data),

  unban: (groupId: string, votingId: string, memberId: string) =>
    apiClient
      .delete(`/groups/${groupId}/votings/${votingId}/bans/${memberId}`)
      .then((r) => r.data),
}
