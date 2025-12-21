// Statistics API Response Types

export interface IMatchStatistics {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goalsScored: number;
  assists: number;
  redCards: number;
  yellowCards: number;
  substitutionIn: number;
  substitutionOut: number;
  minutesPlayed: number;
}

export interface ITournamentStanding {
  teamId: number;
  teamName: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
}

// Response wrappers
export interface IGetTournamentStandingsResponse {
  status: string;
  message: string;
  content: ITournamentStanding[];
}

export interface IGetTopScorersResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetTopAssistsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetTopCardsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetMatchStatisticsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IGetPlayerTournamentStatisticsResponse {
  status: string;
  message: string;
  content: IMatchStatistics[];
}

export interface IPlayerStatistics {
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  goalsAndAssists: number;
  yellowCards: number;
  redCards: number;
}

export interface IPlayerStatisticsData {
  playerId: number;
  playerName: string;
  position: string;
  statistics: IPlayerStatistics;
}

export interface IGetPlayerStatisticsResponse {
  timeStamp: number;
  statusCode: number;
  status: string;
  message: string;
  content: IPlayerStatisticsData[];
}
