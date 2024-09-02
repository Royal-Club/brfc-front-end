import { BasicResType } from "../../responesTypes";

export interface SingleVanueType {
    id: number;
    name: string;
    address: string;
    active: boolean;
}

export interface AllVenueResType extends BasicResType {
    content: SingleVanueType[];
}
