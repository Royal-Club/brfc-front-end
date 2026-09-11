import { postableLines, voucherBalance } from "./voucherBalance";

/**
 * The entry form lets Save through only when these say the voucher balances, and the server rejects
 * anything that gets past them. The cash handover the form was built for is the worked example: the
 * custodian who received the money is debited, the one who gave it up is credited.
 */
describe("voucherBalance", () => {
    const RAKIB = 4;
    const KASEM = 15;

    it("balances a handover where one side is debited and the other credited", () => {
        const balance = voucherBalance([
            { acChartId: KASEM, dr: 41332, cr: 0 },
            { acChartId: RAKIB, dr: 0, cr: 41332 },
        ]);

        expect(balance.dr).toBe(41332);
        expect(balance.cr).toBe(41332);
        expect(balance.difference).toBe(0);
        expect(balance.isBalanced).toBe(true);
    });

    it("reports how far off an entry is when the two sides disagree", () => {
        const balance = voucherBalance([
            { acChartId: KASEM, dr: 41332, cr: 0 },
            { acChartId: RAKIB, dr: 0, cr: 40000 },
        ]);

        expect(balance.difference).toBe(1332);
        expect(balance.isBalanced).toBe(false);
    });

    it("does not treat an empty form as balanced", () => {
        // Nothing typed yet: the two sides technically agree at zero, but there is no entry to save.
        expect(voucherBalance([]).isBalanced).toBe(false);
        expect(voucherBalance([{}, {}]).isBalanced).toBe(false);
        expect(voucherBalance(undefined).isBalanced).toBe(false);
    });

    it("counts a half-typed or blank amount as nothing rather than breaking the total", () => {
        const balance = voucherBalance([
            { acChartId: KASEM, dr: 19000, cr: null },
            { acChartId: RAKIB, dr: undefined, cr: 19000 },
        ]);

        expect(balance.dr).toBe(19000);
        expect(balance.cr).toBe(19000);
        expect(balance.isBalanced).toBe(true);
    });

    it("ignores text that is not a number instead of producing NaN", () => {
        const balance = voucherBalance([
            { acChartId: KASEM, dr: "abc" as unknown as number, cr: 0 },
            { acChartId: RAKIB, dr: 0, cr: 0 },
        ]);

        expect(Number.isNaN(balance.dr)).toBe(false);
        expect(balance.dr).toBe(0);
        expect(balance.isBalanced).toBe(false);
    });

    it("balances an entry split across more than two lines", () => {
        const balance = voucherBalance([
            { acChartId: KASEM, dr: 25000, cr: 0 },
            { acChartId: 5, dr: 16332, cr: 0 },
            { acChartId: RAKIB, dr: 0, cr: 41332 },
        ]);

        expect(balance.isBalanced).toBe(true);
        expect(balance.dr).toBe(41332);
    });

    it("accepts sides that differ only by a floating point crumb", () => {
        // 0.1 + 0.2 does not equal 0.3 in binary floating point. A strict equality check would
        // refuse this entry even though it is correct to the paisa.
        const balance = voucherBalance([
            { acChartId: KASEM, dr: 0.1, cr: 0 },
            { acChartId: KASEM, dr: 0.2, cr: 0 },
            { acChartId: RAKIB, dr: 0, cr: 0.3 },
        ]);

        expect(balance.difference).not.toBe(0);
        expect(balance.isBalanced).toBe(true);
    });

    it("does not let a genuine one paisa error slip through the tolerance", () => {
        const balance = voucherBalance([
            { acChartId: KASEM, dr: 100.02, cr: 0 },
            { acChartId: RAKIB, dr: 0, cr: 100.0 },
        ]);

        expect(balance.isBalanced).toBe(false);
    });

    it("treats an all-debit entry as unbalanced", () => {
        expect(voucherBalance([{ acChartId: KASEM, dr: 41332, cr: 0 }]).isBalanced).toBe(false);
    });
});

describe("postableLines", () => {
    it("keeps only lines that have an account and an amount", () => {
        const lines = postableLines([
            { acChartId: 15, dr: 41332, cr: 0 },
            { acChartId: 4, dr: 0, cr: 41332 },
            // A spare row the user added and left empty.
            {},
            // An account picked but no amount entered.
            { acChartId: 9, dr: 0, cr: 0 },
            // An amount entered against no account.
            { dr: 500 },
        ]);

        expect(lines).toHaveLength(2);
        expect(lines.map((line) => line.acChartId)).toEqual([15, 4]);
    });

    it("returns nothing for an untouched form", () => {
        expect(postableLines(undefined)).toEqual([]);
        expect(postableLines([{}, {}])).toEqual([]);
    });
});
