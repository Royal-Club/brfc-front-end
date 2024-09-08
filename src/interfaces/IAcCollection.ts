import IPlayer from "./IPlayer";

interface IAcCollection {
    id: number;
    transactionId: string;
    playerIds: number[];
    playerName: string;
    players: IPlayer[];
    amount: number;
    totalAmount: number;
    monthOfPayment: Date;
    description?: string;
    allPayersName?: string;
    paid: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IAcCollection;