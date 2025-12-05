import { BasicResType } from "../../responesTypes";

// Enums for match and event types
export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  ONGOING = "ONGOING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
}

export enum MatchEventType {
  GOAL = "GOAL",
  ASSIST = "ASSIST",
  RED_CARD = "RED_CARD",
  YELLOW_CARD = "YELLOW_CARD",
  SUBSTITUTION = "SUBSTITUTION",
  INJURY = "INJURY",
}

export enum TournamentType {
  ROUND_ROBIN = "ROUND_ROBIN",
  DOUBLE_ROUND_ROBIN = "DOUBLE_ROUND_ROBIN",
  GROUP_STAGE = "GROUP_STAGE",
  KNOCKOUT = "KNOCKOUT",
}

// Fixture/Match Types
export interface IFixture {
  id: number;
  tournamentId: number;
  tournamentName: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  venueId: number | null;
  venueName: string | null;
  matchDate: string;
  matchStatus: MatchStatus | string;
  homeTeamScore: number;
  awayTeamScore: number;
  matchOrder: number;
  round: number | null;
  groupName: string | null;
  matchDurationMinutes?: number;
  elapsedTimeSeconds?: number;
  startedAt: string | null;
  completedAt: string | null;
  createdDate?: string;
  updatedDate?: string;
}

// Fixture List Response
export interface IGetFixturesResponse extends BasicResType {
  content: IFixture[];
  numberOfElement: number;
}

// Match Details Response
export interface IGetMatchResponse extends BasicResType {
  content: IFixture;
}

// Fixture Generation Request - Simplified API
export interface IFixtureGenerationRequest {
  tournamentId: number;
  teamIds: number[];
  matchDates: string[];
  timeGapMinutes?: number;
  matchDurationMinutes?: number;
  venueId?: number;
  tournamentType?: TournamentType;
}

// Match Statistics
export interface IMatchStatistics {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goalsScored: number;
  assists: number;
  redCards: number;
  yellowCards: number;
  substitutionIn?: number;
  substitutionOut?: number;
  minutesPlayed?: number;
}

// Match Statistics Response
export interface IGetMatchStatisticsResponse extends BasicResType {
  content: IMatchStatistics[];
  numberOfElement: number;
}

// Match Events Response
export interface IGetMatchEventsResponse extends BasicResType {
  content: IMatchEvent[];
  numberOfElement: number;
}

// Elapsed Time Response
export interface IGetElapsedTimeResponse extends BasicResType {
  content: {
    matchId: number;
    elapsedTimeSeconds: number;
    elapsedTimeMinutes: number;
    matchStatus: string;
  };
}

// Match Event Types
export interface IMatchEvent {
  id: number;
  matchId: number;
  eventType: MatchEventType | string;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  eventTime: number;
  description?: string;
  relatedPlayerId?: number;
  relatedPlayerName?: string;
  details?: string;
  createdDate?: string;
}

// Match Event Request
export interface IRecordMatchEventRequest {
  matchId: number;
  eventType: MatchEventType | string;
  playerId: number;
  teamId: number;
  eventTime: number;
  description?: string;
  relatedPlayerId?: number;
  details?: string;
}

// Match Event Response
export interface IRecordMatchEventResponse extends BasicResType {
  content: IMatchEvent;
}

// Bulk Match Update
export interface IBulkMatchUpdateRequest {
  matchStatus?: MatchStatus | string;
  homeTeamScore?: number;
  awayTeamScore?: number;
  elapsedTimeSeconds?: number;
}

// Match Status Update Responses
export interface IStartMatchResponse extends BasicResType {
  content: IFixture;
}

export interface IPauseMatchResponse extends BasicResType {
  content: IFixture;
}

export interface IResumeMatchResponse extends BasicResType {
  content: IFixture;
}

export interface ICompleteMatchResponse extends BasicResType {
  content: IFixture;
}

export interface IUpdateMatchResponse extends BasicResType {
  content: IFixture;
}

// Elapsed Time Update Response
export interface IUpdateElapsedTimeResponse extends BasicResType {}

// Score Update Response
export interface IUpdateScoreResponse extends BasicResType {}

// Update Fixture Response
export interface IUpdateFixtureResponse extends BasicResType {
  content: IFixture;
}

// Clear Fixtures Response
export interface IClearFixturesResponse extends BasicResType {}

// Delete Event Response
export interface IDeleteEventResponse extends BasicResType {}

// If your API returns { content: IFixture }, you may need:
// export interface IFixtureResponse {
//   content: IFixture;
// }

// And update the query type in fixturesSlice.ts to:
// getFixtureById: builder.query<IFixtureResponse, { fixtureId: number }>({

// But based on the error, it seems the API returns IFixture directly, so the above changes should work.
