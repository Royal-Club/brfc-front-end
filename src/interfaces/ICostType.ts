interface ICostType {
    id: number;
    name: string;
    description: string;
    /**
     * Named `active`, not `isActive`: Lombok generates an `isActive()` getter for the
     * server's boolean field and Jackson strips the prefix, so that is what the JSON carries.
     * Matches IAcChart and IPlayer, which map the same server-side field name.
     */
    active: boolean;
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
}

export default ICostType;
