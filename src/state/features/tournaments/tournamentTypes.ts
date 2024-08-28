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
  tournamentParticipantId: number;
}

export interface IoTournamentSummaryResType extends BasicResType {
  content: IoTournamentSingleSummaryType[];
}

export interface NextTournamentResType {
  timeStamp: string;
  statusCode: number;
  status: boolean;
  message: string;
  content: {
    tournamentId: number;
    tournamentName: string;
    tournamentDate: string;
    players: TournamentPlayerInfoType[];
  };
}
