import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

/**
 * A player's turn-up record. `eligibleTournaments` only counts tournaments held
 * since the player joined, so newer members aren't marked absent for club
 * history that predates them.
 */
export interface IPlayerAttendance {
    playerId: number;
    playerName: string;
    position?: string;
    active: boolean;
    eligibleTournaments: number;
    /** RSVP'd yes. */
    confirmed: number;
    /** RSVP'd no. */
    declined: number;
    /** Never answered. */
    noResponse: number;
    /** Named in a team. */
    played: number;
    /** Said yes but never made a team sheet. */
    confirmedButNotPlayed: number;
    attendanceRate: number;
    responseRate: number;
    reliabilityRate: number;
    currentStreak: number;
    longestStreak: number;
    currentAbsenceStreak: number;
    lastPlayedDate?: string;
    firstCountedDate?: string;
}

export interface IPlayerAttendanceResponse extends BasicResType {
    content: IPlayerAttendance[];
}

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["attendance"],
});

export const attendanceApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getPlayerAttendance: builder.query<
            IPlayerAttendanceResponse,
            { year?: number; activeOnly?: boolean }
        >({
            query: ({ year, activeOnly = true }) => {
                const params = new URLSearchParams();
                if (year) params.append("year", String(year));
                params.append("activeOnly", String(activeOnly));
                return {
                    url: `/player-attendance?${params.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["attendance"],
        }),
    }),
});

export const { useGetPlayerAttendanceQuery } = attendanceApi;
