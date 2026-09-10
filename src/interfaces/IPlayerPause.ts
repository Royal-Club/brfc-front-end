/** Why a player is excused from monthly contributions for a stretch of months. */
export type PauseReason = "INJURY" | "TRAVEL" | "PERSONAL" | "INACTIVE" | "OTHER";

export const PAUSE_REASON_LABEL: Record<PauseReason, string> = {
    INJURY: "Injury",
    TRAVEL: "Travel",
    PERSONAL: "Personal",
    INACTIVE: "Set inactive",
    OTHER: "Other",
};

/**
 * The reasons an admin picks from.
 *
 * <p>INACTIVE is left out on purpose: the system records it when a player is deactivated, so
 * offering it here would invite someone to claim a hold was automatic when it was not.
 */
export const SELECTABLE_PAUSE_REASONS: PauseReason[] = ["INJURY", "TRAVEL", "PERSONAL", "OTHER"];

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
