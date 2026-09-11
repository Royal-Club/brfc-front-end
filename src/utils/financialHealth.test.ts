import { defaultersFor, sumMonth, totalsByMonth } from "./financialHealth";

/**
 * The Financial Health page reads these to answer the three questions it exists for: what came in
 * and went out each month, who has not paid, and where the money went.
 */

const player = (name: string, amounts: Record<string, number>, unpaid: string[] = []) => ({
    playerName: name,
    monthlyAmounts: amounts,
    unpaidMonths: unpaid,
});

const costType = (name: string, amounts: Record<string, number>) => ({
    costTypeName: name,
    monthlyAmounts: amounts,
});

describe("sumMonth", () => {
    it("adds one month's column across every row", () => {
        const rows = [
            player("Rakib", { "2026-08": 500, "2026-09": 500 }),
            player("Kasem", { "2026-09": 700 }),
        ];

        expect(sumMonth(rows, "2026-09")).toBe(1200);
        expect(sumMonth(rows, "2026-08")).toBe(500);
    });

    it("treats a month nobody paid in as zero rather than a gap", () => {
        const rows = [player("Rakib", { "2026-09": 500 })];

        expect(sumMonth(rows, "2026-07")).toBe(0);
        expect(sumMonth([], "2026-09")).toBe(0);
        expect(sumMonth(undefined, "2026-09")).toBe(0);
    });
});

describe("totalsByMonth", () => {
    it("totals every month in the range, including ones with no activity", () => {
        const rows = [
            player("Rakib", { "2026-07": 500, "2026-09": 500 }),
            player("Kasem", { "2026-09": 700 }),
        ];

        expect(totalsByMonth(rows, ["2026-07", "2026-08", "2026-09"])).toEqual({
            "2026-07": 500,
            // A quiet month still needs a bar on the chart, so it has to be present as zero.
            "2026-08": 0,
            "2026-09": 1200,
        });
    });

    it("returns nothing when the range is empty", () => {
        expect(totalsByMonth([player("Rakib", { "2026-09": 500 })], [])).toEqual({});
    });
});

describe("defaultersFor", () => {
    const rows = [
        player("Rakib", { "2026-09": 500 }, []),
        player("Kasem", {}, ["2026-09"]),
        player("Sarower", {}, ["2026-08"]),
    ];

    it("names only the players who owe for that month", () => {
        expect(defaultersFor(rows, "2026-09").map((row) => row.playerName)).toEqual(["Kasem"]);
    });

    it("does not carry a previous month's defaulter into this one", () => {
        expect(defaultersFor(rows, "2026-08").map((row) => row.playerName)).toEqual(["Sarower"]);
    });

    it("leaves an excused player out entirely", () => {
        // A paused player has the month in neither `monthlyAmounts` nor `unpaidMonths`: the report
        // excuses it upstream, so nothing here should flag them.
        const onHold = [player("Injured", {}, [])];

        expect(defaultersFor(onHold, "2026-09")).toEqual([]);
    });

    it("copes with an empty report", () => {
        expect(defaultersFor([], "2026-09")).toEqual([]);
        expect(defaultersFor(undefined, "2026-09")).toEqual([]);
    });
});

