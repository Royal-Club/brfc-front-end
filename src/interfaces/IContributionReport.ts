/** One player's contribution record across the reported month range. */
export interface ContributionReportRow {
    playerId: number;
    playerName: string;
    active: boolean;
    /** Month key ("yyyy-MM") to the amount collected. Sparse: absent means unpaid. */
    monthlyAmounts: Record<string, number>;
    /** Month keys with no collection, in range order. */
    unpaidMonths: string[];
    paidMonthCount: number;
    unpaidMonthCount: number;
    totalPaid: number;
}

export interface ContributionReportSummary {
    totalPlayers: number;
    monthCount: number;
    fullyPaidPlayers: number;
    partiallyPaidPlayers: number;
    unpaidPlayers: number;
    totalCollected: number;
    totalUnpaidMonths: number;
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
