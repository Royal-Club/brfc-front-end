import { BasicResType } from "../../responesTypes";

export interface IoTournamentSingleSummaryType {
    id: number;
    tournamentName: string;
    tournamentDate: string;
    venueName: string;
    activeStatus: boolean;
}

export interface TournamentPlayerInfoType {
    id?: number;
    playerId: number;
    playerName: string;
    employeeId: string;
    participationStatus: boolean;
    comments: string;
    tournamentParticipantId: number;
    playingPosition?: string;
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
        totalParticipants: number;
        players: TournamentPlayerInfoType[];
    };
}

export interface TournamentSummeryResType {
    timeStamp: string;
    statusCode: number;
    status: boolean;
    message: string;
    content: [
        {
            id: number;
            tournamentName: string;
            tournamentDate: string;
            venueName: string;
            activeStatus: boolean;
            teams: [
                {
                    teamId: number;
                    teamName: string;
                    players: TournamentPlayerInfoType[];
                }
            ];
        }
    ];
}

export interface PlayerListToAddToTeamType extends BasicResType {
    content: TournamentPlayerInfoType[];
}

export interface TournamentGoalKeeperInfoType extends BasicResType {
    content: [
        {
            playerId: number;
            playerName: string;
            goalkeeperCount: number;
        }
    ];
}
