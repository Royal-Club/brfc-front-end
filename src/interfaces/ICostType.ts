interface ICostType {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    /** The expense account this type posts to. Required by the create and update endpoints. */
    chartId: number;
    chartName: string;
    /**
     * Set by the server once a bill payment or a monthly cost refers to this type. Such a type can
     * only be deactivated - deleting it would orphan the spending recorded against it.
     */
    inUse: boolean;
    /**
     * How much history is filed under this type. A rename re-labels all of it, since payments
     * reference the type by id rather than by name, so the edit screen says so up front.
     */
    billPaymentCount: number;
    monthlyCostCount: number;
    createdDate: Date;
    updatedDate: Date;
}

export default ICostType;
