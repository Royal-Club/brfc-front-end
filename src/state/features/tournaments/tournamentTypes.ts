import { BasicResType } from "../../responesTypes";

export interface IoTournamentSingleSummaryType {
  id: number;
  tournamentName: string;
  tournamentDate: string;
  venueName: string;
  activeStatus: boolean;
}

export interface TournamentPlayerInfoType {
  playerId: number;
  playerName: string;
  employeeId: string;
  participationStatus: boolean;
  comments: string;
}

export interface IoTournamentSummaryResType extends BasicResType {
  content: IoTournamentSingleSummaryType[];
}

export interface NextTournamentResType {
  message: string;
  statusCode: number;
  timeStamp: string;
  status: boolean;
  content: {
    tournamentId: Number;
    tournamentName: String;
    tournamentDate: String;
    players: TournamentPlayerInfoType[];
  };
}
