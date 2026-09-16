/** Where a transaction log row came from. Mirrors the backend's TransactionLogSource. */
export type TransactionLogSource =
    | "COLLECTION"
    | "BILL_PAYMENT"
    | "VOUCHER"
    | "CASH_TRANSFER";

/** Which way the money moved, from the club's point of view. */
export type TransactionLogDirection = "IN" | "OUT" | "TRANSFER";

/** One money movement, flattened so all four sources can share a table. */
export interface TransactionLogEntry {
    source: TransactionLogSource;
    /** The id within that source, so a row can be traced back to its own screen. */
    sourceId: number;
    direction: TransactionLogDirection;
    /** Transaction id, bill code or voucher code — whatever a club member would recognise. */
    reference: string | null;
    /** The date the money moved, not the date the row was typed in. */
    date: string;
    amount: number;
    description: string | null;
    /** Who the money came from or went to: players, a cost type, or the two cash accounts. */
    party: string | null;
    voucherCode: string | null;
    voucherTypeName: string | null;
    /** POSTED/UNPOSTED for vouchers, the handover state for transfers, null where neither applies. */
    status: string | null;
    enteredById: number | null;
    enteredBy: string | null;
    enteredAt: string | null;
    modifiedById: number | null;
    modifiedBy: string | null;
    modifiedAt: string | null;
}

/** Totals across everything the filters match — the whole result, not the page on screen. */
export interface TransactionLogSummary {
    totalIn: number;
    totalOut: number;
    /** totalIn - totalOut. Handovers are excluded: they move cash without changing it. */
    net: number;
    totalTransferred: number;
    entryCount: number;
    /** Entry count per source, keyed by the source name. */
    countBySource: Record<string, number>;
}

interface ITransactionLog {
    fromDate: string;
    toDate: string;
    /** The requested page of entries, newest movement first. */
    entries: TransactionLogEntry[];
    summary: TransactionLogSummary;
    /** Zero-based, matching the other paged accounting endpoints. */
    page: number;
    size: number;
    totalEntries: number;
    totalPages: number;
}

export default ITransactionLog;
