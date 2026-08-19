import apiSlice from "../../api/apiSlice";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["TeamChatRoom", "TeamChatMessages"],
});

export interface ITeamChatAttachment {
    id: number;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    /** Server route, not a storage link — it re-checks squad membership on every fetch. */
    downloadUrl: string;
}

export interface ITeamChatMessage {
    id: number;
    teamId: number;
    senderId: number | null;
    senderName: string | null;
    senderPhotoUrl: string | null;
    body: string | null;
    sentAt: string;
    attachments: ITeamChatAttachment[];
}

export interface ITeamChatMember {
    id: number;
    playerId: number;
    playerName: string;
    playingPosition?: string | null;
    teamPlayerRole?: string | null;
    isCaptain?: boolean | null;
    jerseyNumber?: number | null;
    photoUrl?: string | null;
}

export interface ITeamChatRoom {
    teamId: number;
    teamName: string;
    tournamentId: number | null;
    tournamentName: string | null;
    open: boolean;
    /** Populated only when `open` is false — say this rather than inventing a reason. */
    closedReason: string | null;
    openedAt: string | null;
    members: ITeamChatMember[];
    messageCount: number;
    /** Bytes of files this room already holds. */
    storageUsedBytes: number;
    /** The room's shared file budget. Sent by the server so the two can never disagree. */
    storageLimitBytes: number;
    /** Largest single file the room will accept. */
    maxFileBytes: number;
}

export interface ITeamChatPresign {
    key: string;
    uploadUrl: string;
    expiresInSeconds: number;
}

interface ApiEnvelope<T> {
    content: T;
}

export const teamChatApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * The signed-in player's own room for a tournament. Returns 204 with an empty body when
         * they are not on a team, which RTK Query surfaces as undefined content.
         */
        getMyTeamChatRoom: builder.query<ITeamChatRoom | null, number>({
            query: (tournamentId) => `team-chats/tournaments/${tournamentId}/my-room`,
            transformResponse: (response: ApiEnvelope<ITeamChatRoom> | undefined) =>
                response?.content ?? null,
            providesTags: ["TeamChatRoom"],
        }),

        /**
         * Every open room the caller is in, across tournaments.
         *
         * <p>What the dock runs on, since it is on screen everywhere and has no tournament in its
         * URL to scope by. Always an array, empty included - having no open room is the ordinary
         * state for most of the week, not a failure.
         */
        getMyOpenTeamChatRooms: builder.query<ITeamChatRoom[], void>({
            query: () => "team-chats/my-open-rooms",
            transformResponse: (response: ApiEnvelope<ITeamChatRoom[]>) =>
                response.content ?? [],
            providesTags: ["TeamChatRoom"],
        }),

        getTeamChatRoom: builder.query<ITeamChatRoom, number>({
            query: (teamId) => `team-chats/${teamId}`,
            transformResponse: (response: ApiEnvelope<ITeamChatRoom>) => response.content,
            providesTags: ["TeamChatRoom"],
        }),

        /**
         * A page of history, oldest-first within the page. Live messages arrive over the socket
         * instead, so this is not re-fetched on every send — the cache is updated in place.
         */
        getTeamChatMessages: builder.query<
            ITeamChatMessage[],
            { teamId: number; before?: number; limit?: number }
        >({
            query: ({ teamId, before, limit = 50 }) => {
                const params = new URLSearchParams({ limit: String(limit) });
                if (before) {
                    params.set("before", String(before));
                }
                return `team-chats/${teamId}/messages?${params.toString()}`;
            },
            transformResponse: (response: ApiEnvelope<ITeamChatMessage[]>) =>
                response.content ?? [],
            providesTags: ["TeamChatMessages"],
        }),

        sendTeamChatMessage: builder.mutation<
            ITeamChatMessage,
            {
                teamId: number;
                body?: string;
                attachments?: {
                    key: string;
                    fileName: string;
                    contentType: string;
                    sizeBytes: number;
                }[];
            }
        >({
            query: ({ teamId, body, attachments }) => ({
                url: `team-chats/${teamId}/messages`,
                method: "POST",
                body: { body, attachments },
            }),
            transformResponse: (response: ApiEnvelope<ITeamChatMessage>) => response.content,
            // The message list is deliberately not invalidated: the sent message comes back in this
            // response and is merged locally, and refetching the page would make sending feel slower
            // than receiving, which is the wrong way round.
            //
            // The room is invalidated, but only when files were attached — that is the one thing the
            // client cannot recompute for itself, because the room's used-bytes total covers the whole
            // history rather than the page currently loaded.
            invalidatesTags: (result, error, arg) =>
                arg.attachments?.length ? ["TeamChatRoom"] : [],
        }),

        presignTeamChatAttachment: builder.mutation<
            ITeamChatPresign,
            { teamId: number; fileName: string; contentType: string; sizeBytes: number }
        >({
            query: ({ teamId, fileName, contentType, sizeBytes }) => ({
                url: `team-chats/${teamId}/attachments/presign?fileName=${encodeURIComponent(
                    fileName
                )}&contentType=${encodeURIComponent(contentType)}&sizeBytes=${sizeBytes}`,
                method: "POST",
            }),
            transformResponse: (response: ApiEnvelope<ITeamChatPresign>) => response.content,
        }),
    }),
});

export const {
    useGetMyTeamChatRoomQuery,
    useGetMyOpenTeamChatRoomsQuery,
    useGetTeamChatRoomQuery,
    useGetTeamChatMessagesQuery,
    // Lazy variant for scrolling back: paging older messages is an explicit action, not something
    // that should re-run whenever the component re-renders.
    useLazyGetTeamChatMessagesQuery,
    useSendTeamChatMessageMutation,
    usePresignTeamChatAttachmentMutation,
} = teamChatApi;
