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

export type CashTransferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

/** A handover still waiting on the receiver, as either side sees it. */
export interface PendingCashTransfer {
    id: number;
    fromAccountId: number;
    fromAccountName: string;
    fromHolderName: string | null;
    toAccountId: number;
    toAccountName: string;
    toHolderName: string | null;
    amount: number;
    date: string;
    note: string | null;
    status: CashTransferStatus;
    initiatedByName: string | null;
    createdDate: string;
}

export interface IPendingCashTransfers {
    /** Coming into me, waiting on me to accept or reject. */
    incoming: PendingCashTransfer[];
    /** Offered by me, waiting on the other side. I may cancel these. */
    outgoing: PendingCashTransfer[];
}

export default ICashTransferOptions;
