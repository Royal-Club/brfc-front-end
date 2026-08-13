interface IPlayer {
    id: number;
    name: string;
    email: string;
    employeeId: string;
    fullName: string;
    skypeId: string;
    mobileNo: string;
    profilePhoto?: string;
    active: Boolean;
    playingPosition?: string;
    createdDate: Date;
    updatedDate: Date;
    roles?: Array<{
        id: number;
        name: string;
    }>;
    photoKey?: string;
    photoUrl?: string;
    /** When this player last replaced their photo; absent if they never have. */
    photoUpdatedAt?: string;
    /**
     * When they may next change their photo. Absent means now — the backend rate-limits changes to
     * one per rolling 30 days to protect a free-tier R2 bucket.
     */
    photoChangeAvailableAt?: string;
}

export default IPlayer;
