/** Why a player is excused from monthly contributions for a stretch of months. */
export type PauseReason = "INJURY" | "TRAVEL" | "PERSONAL" | "OTHER";

export const PAUSE_REASON_LABEL: Record<PauseReason, string> = {
    INJURY: "Injury",
    TRAVEL: "Travel",
    PERSONAL: "Personal",
    OTHER: "Other",
};

/** One pause on a player's record. */
export interface IPlayerPause {
    id: number;
    playerId: number;
    playerName: string;
    /** First day of the first excused month, as "YYYY-MM-DD". */
    fromMonth: string;
    /** First day of the last excused month; null while the pause is still running. */
    toMonth: string | null;
    openEnded: boolean;
    reason: PauseReason;
    note: string | null;
}

export default IPlayerPause;
