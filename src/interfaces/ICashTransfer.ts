export interface CashTransferAccount {
    id: number;
    code: string;
    name: string;
    /** Null when no member holds this account. */
    holderId: number | null;
    holderName: string | null;
    balance: number;
}

export interface ICashTransferOptions {
    /** Where the money may come from. One entry for a custodian, all of them for an admin. */
    sources: CashTransferAccount[];
    /** Where the money may go. Any cash account. */
    destinations: CashTransferAccount[];
    /** True when the caller may pick the source. The form fixes it otherwise. */
    canChooseSource: boolean;
}

export interface CashTransferPayload {
    /** Only sent by an admin recording somebody else's handover. */
    fromAccountId?: number;
    toAccountId: number;
    amount: number;
    date: string;
    note?: string;
}

export default ICashTransferOptions;
