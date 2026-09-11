export interface CashHolderRow {
    accountId: number;
    accountCode: string;
    accountName: string;
    /** Null when no member holds this account. */
    holderId: number | null;
    /** Null when no member holds this account. */
    holderName: string | null;
    balance: number;
    /**
     * A pocket cannot hold less than nothing, so this means money was recorded as paid out of the
     * account without the matching receipts being recorded into it.
     */
    negative: boolean;
}

export interface ICashPosition {
    holders: CashHolderRow[];
    total: number;
}

export default ICashPosition;
