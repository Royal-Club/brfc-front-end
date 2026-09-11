export interface CashMovement {
    voucherId: number;
    voucherCode: string;
    date: string;
    narration: string | null;
    /** Money into this custodian's hands. */
    in: number;
    /** Money out of them. */
    out: number;
}

export interface IMyCashInHand {
    /** False for the great majority of members, who hold no club cash. */
    custodian: boolean;
    accountId: number | null;
    accountCode: string | null;
    accountName: string | null;
    /** Received less paid out. What they should be able to count. */
    balance: number;
    movements: CashMovement[];
}

export default IMyCashInHand;
