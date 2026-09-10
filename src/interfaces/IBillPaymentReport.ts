/** What the club spent on one cost type across the reported month range. */
export interface BillPaymentReportRow {
    costTypeId: number;
    costTypeName: string;
    /** Month key ("yyyy-MM") to the amount spent that month. Sparse: absent means nothing spent. */
    monthlyAmounts: Record<string, number>;
    /**
     * Month key to how many separate payments make up that month's figure.
     *
     * Drives the marker that tells a reader a cell is an aggregate rather than a single payment.
     */
    monthlyPaymentCounts: Record<string, number>;
    total: number;
    /** This cost type's share of total spend, to one decimal place. */
    sharePercent: number;
    paymentCount: number;
}

export interface BillPaymentReportSummary {
    monthCount: number;
    costTypeCount: number;
    paymentCount: number;
    totalSpent: number;
    /** Collected for the same months, so the report reads as a period statement. */
    totalCollected: number;
    /** Collected minus spent. Negative means the club spent more than it took in. */
    net: number;
}

interface IBillPaymentReport {
    fromMonth: string;
    toMonth: string;
    /** Every month in range as "yyyy-MM", oldest first — the report's column order. */
    months: string[];
    /** Cost types with spend in range, biggest spender first. */
    rows: BillPaymentReportRow[];
    summary: BillPaymentReportSummary;
}

export default IBillPaymentReport;
