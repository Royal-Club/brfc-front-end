import { BasicResType } from "../../responesTypes";

export interface IoTournamentSingleSummaryType {
    id: number;
    name: string;
    tournamentDate: string;
    venueName: string;
    activeStatus: boolean;
    defaultTournament?: boolean;
    tournamentStatus?: string;
    auctionMode?: boolean;
    season?: string;
    description?: string;
    rules?: string;
    roadmapImageUrl?: string;
    /** Players per side, keeper included — drives the line-up presets. */
    teamSize?: number;
    /** When false, invitation and reminder emails are suppressed for this tournament. */
    emailNotificationEnabled?: boolean;
}

export interface getSingleTournamentInfoType extends BasicResType {
    content: IoTournamentSingleSummaryType;
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
    tournamentStatus?: string;
    isCaptain?: boolean;
    teamPlayerRole?: string;
    jerseyNumber?: number;
    photoUrl?: string;
    photoKey?: string;
}

export interface IoTournamentSummaryResType extends BasicResType {
    content: {
        tournaments: IoTournamentSingleSummaryType[];
        totalCount: number;
    };
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
            name?: string;
            title?: string;
            season?: string;
            description?: string;
            rules?: string;
            roadmapImageUrl?: string;
            tournamentDate: string;
            venueName: string;
            activeStatus: boolean;
            teams: [
                {
                    teamId: number;
                    teamName: string;
                    logoKey?: string;
                    logoUrl?: string;
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

export interface TournamentGoalKeeperHistoryInfoType extends BasicResType {
    content: {
        [key: string]: [
            {
                playerId: number;
                playerName: string;
                roundNumber: number | null;
                playedDate: string | null;
            }
        ]; 
    };
}

/** ELIGIBLE ranks by what's owed; COOLDOWN rested recently; EXEMPT opted out and isn't ranked. */
export type GoalKeeperCategoryType = "ELIGIBLE" | "COOLDOWN" | "EXEMPT";

export interface GoalKeeperPriorityPlayerType {
    priority: number;
    category: GoalKeeperCategoryType;
    playerId: number;
    playerName: string;
    employeeId: string;
    playAsGkDates: string[]; // Format: dd-MM-yy
    totalTournamentParticipations: number;
    activeTournamentCount: number;
    participationFrequency: number; // percentage
    totalGoalKeeperTournaments: number; // distinct tournaments; see goalKeeperStints for turns
    lastGoalKeeperDate: string | null;
    lastPlayedTournamentDate: string | null; // Format: dd-MM-yy

    // Ledger. Ranking is by goalKeeperDebt, and the other three are what explain it to a player:
    // "you've turned up N times, your share of that was X turns, you've served Y".
    accruedObligation: number;
    goalKeeperStints: number;
    goalKeeperDebt: number; // accruedObligation - goalKeeperStints; > 0 means owed a turn
    attendedTournaments: number;
    cooldownRemaining: number | null; // tournaments left resting; null unless COOLDOWN
}

export interface GoalKeeperQueueResType extends BasicResType {
    content: {
        tournamentId: number;
        tournamentName: string;
        tournamentDate: string;
        goalKeeperPriorityQueue: GoalKeeperPriorityPlayerType[];
        cooldownTournaments: number;
        /** How much of the ledger rests on recorded data rather than the configured estimate. */
        ledgerCoverage: {
            tournamentsConsidered: number;
            tournamentsWithRecordedKeepers: number;
            tournamentsEstimated: number;
            estimatingMissingSlots: boolean;
        } | null;
    };
}

export interface LatestTournamentWithUserStatusType extends BasicResType {
    content: {
        tournament: {
            id: number;
            name: string;
            tournamentDate: string;
            venueName: string;
            activeStatus: boolean;
            tournamentStatus: string;
        };
        totalParticipant: number;
        remainParticipant: number;
        totalPlayer: number;
        isUserParticipated: boolean | null;
        tournamentParticipantId?: number;
    };
}

export interface TournamentSessionsResType extends BasicResType {
    content: string[];
}

export interface TournamentListItemType {
    id: number;
    name: string;
    tournamentDate: string;
}

export interface TournamentListResType extends BasicResType {
    content: TournamentListItemType[];
}
