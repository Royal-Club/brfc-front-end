/**
 * The rule that decides whether a voucher can be saved: its debits and its credits have to agree.
 *
 * Kept apart from the entry form because the server enforces the same rule and rejects anything
 * that breaks it. Doing the arithmetic here lets the form say so while the user is still typing,
 * rather than after a failed round trip.
 */

/** One entry line as the form holds it, before anything is sent. */
export interface VoucherLineInput {
    acChartId?: number;
    dr?: number | string | null;
    cr?: number | string | null;
}

export interface VoucherBalance {
    dr: number;
    cr: number;
    /** Debits minus credits. Zero when the entry balances. */
    difference: number;
    /** A balanced entry that actually moves something. An all-zero entry balances but is not one. */
    isBalanced: boolean;
}

/** Blank, partially typed and non-numeric amounts all count as nothing rather than NaN. */
const amount = (value: number | string | null | undefined): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const voucherBalance = (lines: VoucherLineInput[] | undefined): VoucherBalance => {
    const rows = lines ?? [];
    const dr = rows.reduce((sum, line) => sum + amount(line?.dr), 0);
    const cr = rows.reduce((sum, line) => sum + amount(line?.cr), 0);
    const difference = dr - cr;

    return {
        dr,
        cr,
        difference,
        // Compared with a tolerance rather than `=== 0`: two sides that are correct to the paisa
        // can still differ by a floating point crumb, and rejecting that would block a valid entry.
        isBalanced: Math.abs(difference) < 0.005 && dr > 0,
    };
};

/** The lines worth sending: an account chosen and at least one side filled in. */
export const postableLines = <T extends VoucherLineInput>(lines: T[] | undefined): T[] =>
    (lines ?? []).filter((line) => line?.acChartId && (amount(line.dr) > 0 || amount(line.cr) > 0));
