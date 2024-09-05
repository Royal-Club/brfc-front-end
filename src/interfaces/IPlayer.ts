interface IPlayer {
    id: number;
    name: string;
    email: string;
    employeeId: string;
    skypeId: string;
    mobileNo: string;
    active: Boolean;
    playingPosition?: string;
    createdDate: Date;
    updatedDate: Date;
}

export default IPlayer;
