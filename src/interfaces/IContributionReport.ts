/** One player's contribution record across the reported month range. */
export interface ContributionReportRow {
    playerId: number;
    playerName: string;
    active: boolean;
    /** Month key ("yyyy-MM") to the amount collected. Sparse: absent means unpaid or on hold. */
    monthlyAmounts: Record<string, number>;
    /** Month keys with no collection and no pause covering them — the months to chase. */
    unpaidMonths: string[];
    /** Month keys excused by a pause. Not dues, and not counted against the player. */
    onHoldMonths: string[];
    paidMonthCount: number;
    unpaidMonthCount: number;
    onHoldMonthCount: number;
    totalPaid: number;
}

export interface ContributionReportSummary {
    totalPlayers: number;
    monthCount: number;
    fullyPaidPlayers: number;
    partiallyPaidPlayers: number;
    unpaidPlayers: number;
    /** Players excused for the whole range, who therefore owed nothing at all. */
    onHoldPlayers: number;
    totalCollected: number;
    totalUnpaidMonths: number;
    totalOnHoldMonths: number;
}

interface IContributionReport {
    fromMonth: string;
    toMonth: string;
    /** Every month in range as "yyyy-MM", oldest first — the report's column order. */
    months: string[];
    rows: ContributionReportRow[];
    summary: ContributionReportSummary;
}

export default IContributionReport;
