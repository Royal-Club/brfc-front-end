interface IPlayer {
    id: number;
    name: string;
    email: string;
    employeeId: string;
    fullName: string;
    skypeId: string;
    mobileNo: string;
    active: Boolean;
    playingPosition?: string;
    createdDate: Date;
    updatedDate: Date;
    roles?: Array<{
        id: number;
        name: string;
    }>;
}

export default IPlayer;
