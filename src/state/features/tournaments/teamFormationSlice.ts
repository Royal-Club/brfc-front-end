import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["teamFormation"],
});

export type FormationPositionGroup = "GK" | "DEF" | "MID" | "FWD";

export interface ITeamFormationSlot {
    id?: number | null;
    slotIndex: number;
    positionGroup: FormationPositionGroup;
    slotLabel?: string | null;
    /** Percentage across the pitch box; y = 100 is the team's own goal line. */
    x: number;
    y: number;
    isStarter: boolean;

    /** Null while the captain has left the place open. */
    teamPlayerId?: number | null;
    playerId?: number | null;
    playerName?: string | null;
    jerseyNumber?: number | null;
    playingPosition?: string | null;
    isCaptain?: boolean | null;
    photoKey?: string | null;
    photoUrl?: string | null;
}

export interface ITeamFormation {
    id?: number | null;
    teamId: number;
    teamName: string;
    teamLogoUrl?: string | null;
    /** Null on the team's default line-up. */
    matchId?: number | null;
    isDefault: boolean;
    presetName: string;
    teamSize: number;
    notes?: string | null;
    /** Whether the signed-in user may save changes to this line-up. */
    editable: boolean;
    lockedReason?: string | null;
    /**
     * False when nothing is stored yet and these slots are the starting point
     * the server is offering — the preset, or the team default for a match.
     */
    saved: boolean;
    availablePresets: string[];
    slots: ITeamFormationSlot[];
    /** Everyone signed to the team — what the player picker chooses from. */
    squad: ITeamSquadPlayer[];
}

export interface ITeamSquadPlayer {
    /** The team-player row id, which is what a slot references. */
    id: number;
    teamId: number;
    playerId: number;
    playerName: string;
    playingPosition?: string | null;
    teamPlayerRole?: string | null;
    isCaptain?: boolean | null;
    jerseyNumber?: number | null;
    photoKey?: string | null;
    photoUrl?: string | null;
}

export interface TeamFormationResType extends BasicResType {
    content: ITeamFormation;
}

export interface TeamFormationListResType extends BasicResType {
    content: ITeamFormation[];
}

/** What the client sends back; the slot list replaces the stored sheet. */
export interface ITeamFormationSlotPayload {
    teamPlayerId?: number | null;
    positionGroup: FormationPositionGroup;
    slotLabel?: string | null;
    x: number;
    y: number;
    isStarter: boolean;
}

export interface ITeamFormationPayload {
    presetName: string;
    notes?: string | null;
    slots: ITeamFormationSlotPayload[];
}

export const teamFormationApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        teamDefaultFormation: builder.query<TeamFormationResType, { teamId: number }>({
            query: ({ teamId }) => ({
                url: `formations/teams/${teamId}`,
                method: "GET",
            }),
            providesTags: ["teamFormation"],
        }),

        saveTeamDefaultFormation: builder.mutation<
            TeamFormationResType,
            { teamId: number; body: ITeamFormationPayload }
        >({
            query: ({ teamId, body }) => ({
                url: `formations/teams/${teamId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["teamFormation"],
        }),

        matchTeamFormation: builder.query<
            TeamFormationResType,
            { matchId: number; teamId: number }
        >({
            query: ({ matchId, teamId }) => ({
                url: `formations/matches/${matchId}/teams/${teamId}`,
                method: "GET",
            }),
            providesTags: ["teamFormation"],
        }),

        saveMatchTeamFormation: builder.mutation<
            TeamFormationResType,
            { matchId: number; teamId: number; body: ITeamFormationPayload }
        >({
            query: ({ matchId, teamId, body }) => ({
                url: `formations/matches/${matchId}/teams/${teamId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["teamFormation"],
        }),

        /** Drops the match line-up so the team falls back to its default. */
        resetMatchTeamFormation: builder.mutation<
            BasicResType,
            { matchId: number; teamId: number }
        >({
            query: ({ matchId, teamId }) => ({
                url: `formations/matches/${matchId}/teams/${teamId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["teamFormation"],
        }),

        matchFormations: builder.query<TeamFormationListResType, { matchId: number }>({
            query: ({ matchId }) => ({
                url: `formations/matches/${matchId}`,
                method: "GET",
            }),
            providesTags: ["teamFormation"],
        }),
    }),
});

export const {
    useTeamDefaultFormationQuery,
    useSaveTeamDefaultFormationMutation,
    useMatchTeamFormationQuery,
    useSaveMatchTeamFormationMutation,
    useResetMatchTeamFormationMutation,
    useMatchFormationsQuery,
} = teamFormationApi;
