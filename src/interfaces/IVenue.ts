interface IVenue {
    id: number;
    name: string;
    address: string;
    mapUrl?: string;
    active: Boolean;
    createdDate: Date;
    updatedDate: Date;
}

export default IVenue;