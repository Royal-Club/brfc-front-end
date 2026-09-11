/**
 * Derivations behind the Financial Health page.
 *
 * The contribution and bill payment endpoints total a *row* across the reported range - one player,
 * or one cost type - but never the whole club for a single month. These turn those rows into the
 * per-month and this-month figures the page actually shows.
 */

/** The shape both report rows share: a sparse month key to amount map. */
export interface MonthlyRow {
    monthlyAmounts: Record<string, number>;
}

/** A contribution row, as far as the defaulters list is concerned. */
export interface UnpaidRow {
    unpaidMonths: string[];
}

/** Sums one month's column across every row. Absent means nothing that month, not a gap. */
export const sumMonth = (rows: MonthlyRow[] | undefined, month: string): number =>
    (rows ?? []).reduce((sum, row) => sum + (row?.monthlyAmounts?.[month] ?? 0), 0);

/** Every month in the range totalled across rows, keyed the same way the report keys them. */
export const totalsByMonth = (
    rows: MonthlyRow[] | undefined,
    months: string[] | undefined
): Record<string, number> => {
    const totals: Record<string, number> = {};
    for (const month of months ?? []) {
        totals[month] = sumMonth(rows, month);
    }
    return totals;
};

/**
 * Who owes for the given month.
 *
 * Reads the report's own `unpaidMonths`, which already excludes months a pause excused, so a player
 * on hold never shows up as a defaulter.
 */
export const defaultersFor = <T extends UnpaidRow>(rows: T[] | undefined, month: string): T[] =>
    (rows ?? []).filter((row) => row?.unpaidMonths?.includes(month));

