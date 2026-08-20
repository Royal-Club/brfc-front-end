/**
 * The one rule for "does this RSVP need saving?", shared by every place a player can answer.
 *
 * There are two vote surfaces - the tournament page and the dashboard card - and they hold the
 * player's current answer in different shapes, from different endpoints. Keeping the comparison
 * here rather than inline at each call site is what stops them drifting: the guard was added to
 * the tournament page first and the dashboard kept re-sending unchanged answers for weeks.
 */

/** Yes, No, or no answer yet. `null` is what the API stores for "Later". */
export type RsvpAnswer = boolean | null;

/**
 * A player who has never answered comes back as `null` from one endpoint and is simply absent from
 * the other, so both have to collapse to the same "Later" before anything is compared.
 */
export const toRsvpAnswer = (value: boolean | null | undefined): RsvpAnswer =>
    value === true ? true : value === false ? false : null;

/** A missing comment and an empty one are the same answer to the server. */
export const toRsvpComment = (value: string | null | undefined): string => value ?? "";

export interface RsvpState {
    participationStatus?: boolean | null;
    comments?: string | null;
}

/**
 * True when saving would store exactly what is stored already - tapping "Yes" while already in,
 * or re-picking the same option from a dropdown.
 *
 * Worth skipping rather than letting the server absorb it: every save overwrites
 * `participationSource`, so a no-op write turns an emailed Yes into an in-app one and loses how
 * the answer was actually given.
 */
export const isRsvpUnchanged = (current: RsvpState, next: RsvpState): boolean =>
    toRsvpAnswer(current.participationStatus) === toRsvpAnswer(next.participationStatus) &&
    toRsvpComment(current.comments) === toRsvpComment(next.comments);
