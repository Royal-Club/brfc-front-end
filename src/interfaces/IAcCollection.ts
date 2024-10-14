import IPlayer from "./IPlayer";

interface IAcCollection {
    id: number;
    transactionId: string;
    playerIds: number[];
    playerName: string;
    date: Date;
    players: IPlayer[];
    amount: number;
    totalAmount: number;
    monthOfPayment: Date;
    description?: string;
    voucherCode?: string;
    voucherId?: number;
    allPayersName?: string;
    paid: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IAcCollection;