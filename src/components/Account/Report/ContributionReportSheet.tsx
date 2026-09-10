import { ContributionReportRow } from "../../../interfaces/IContributionReport";
import { fmtMoney } from "../../../utils/acFormat";

/**
 * The printable face of the contribution report — the thing that actually gets downloaded.
 *
 * <p>It is rendered off-screen at a fixed width and captured as the PNG, so the image never depends
 * on the reader's window size, scroll position or theme. That is also why every colour here is
 * literal rather than a theme token: a downloaded document is a white sheet of paper whether the app
 * is in light or dark mode.
 *
 * <p>The on-screen table stays a working tool (sortable, filterable, scrollable); this is the
 * presentation of the same data, and the PDF export mirrors this layout column for column.
 */

const NAVY = "#14213D";
const GOLD = "#C6A15B";
const INK = "#282C36";
const MUTED = "#7A808C";
const RULE = "#E1E3E8";
const ZEBRA = "#FAFAFC";

const PAID_FG = "#166534";
const PAID_BG = "#DCFCE7";
const DUE_FG = "#B02B2B";
const DUE_BG = "#FDE7E7";
const HOLD_FG = "#6E7480";
const HOLD_BG = "#F0F1F4";

/** Paid, excused, or owing — the three things a month can be for a player. */
type MonthState = "paid" | "onHold" | "due";

export interface ContributionSheetProps {
    /** Club crest; omitted, the masthead simply runs without it. */
    logo?: string;
    clubName: string;
    /** Month keys ("yyyy-MM") in column order. */
    months: string[];
    monthLabel: (month: string) => string;
    /** The rows as filtered on screen — what you see is what you download. */
    rows: ContributionReportRow[];
    /** Human-readable period, e.g. "September 2026" or "Jan 2026 — Sep 2026". */
    period: string;
    /** The filters in force, e.g. "Active players · Unpaid only". */
    filterLine: string;
    generatedAt: string;
}

const th: React.CSSProperties = {
    background: NAVY,
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 11.5,
    letterSpacing: 0.3,
    padding: "9px 10px",
    border: `1px solid ${NAVY}`,
    textAlign: "center",
    whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
    padding: "7px 10px",
    border: `1px solid ${RULE}`,
    fontSize: 11.5,
    color: INK,
    whiteSpace: "nowrap",
};

const numeric: React.CSSProperties = {
    fontVariantNumeric: "tabular-nums",
    fontFeatureSettings: '"tnum"',
};

const metaLabel: React.CSSProperties = {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: MUTED,
};

const PILL_TONE: Record<MonthState, { fg: string; bg: string; label: string }> = {
    paid: { fg: PAID_FG, bg: PAID_BG, label: "PAID" },
    onHold: { fg: HOLD_FG, bg: HOLD_BG, label: "ON HOLD" },
    due: { fg: DUE_FG, bg: DUE_BG, label: "DUE" },
};

const pill = (state: MonthState): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.4,
    color: PILL_TONE[state].fg,
    background: PILL_TONE[state].bg,
});

function ContributionReportSheet({
    logo,
    clubName,
    months,
    monthLabel,
    rows,
    period,
    filterLine,
    generatedAt,
}: ContributionSheetProps) {
    // A single month reads as a roster — name and whether they paid — rather than as a grid with one
    // column in it. This is the case the club looks at most, so it gets the clearer layout.
    const isSingleMonth = months.length === 1;

    // Excused for the whole range, so they owed nothing — counted apart from both paid and due,
    // or they would drag one of those figures somewhere misleading.
    const onHoldPlayers = rows.filter((row) => months.length > 0 && row.onHoldMonthCount === months.length).length;
    const paidCount = rows.filter((row) => row.paidMonthCount > 0).length;
    const fullyPaid = rows.filter(
        (row) => row.unpaidMonthCount === 0 && row.onHoldMonthCount !== months.length
    ).length;
    const neverPaid = rows.filter(
        (row) => row.paidMonthCount === 0 && row.onHoldMonthCount !== months.length
    ).length;
    const collected = rows.reduce((sum, row) => sum + row.totalPaid, 0);
    const monthlyTotals = months.map((month) =>
        rows.reduce((sum, row) => sum + (row.monthlyAmounts[month] ?? 0), 0)
    );
    const dueCount = rows.length - paidCount - onHoldPlayers;

    const stats = (
        isSingleMonth
            ? [
                  { label: "Players", value: String(rows.length) },
                  { label: "Paid", value: String(paidCount) },
                  { label: "Due", value: String(dueCount) },
                  onHoldPlayers ? { label: "On hold", value: String(onHoldPlayers) } : null,
                  { label: "Collected", value: fmtMoney(collected) },
              ]
            : [
                  { label: "Players", value: String(rows.length) },
                  { label: "Fully paid", value: String(fullyPaid) },
                  { label: "Partial", value: String(rows.length - fullyPaid - neverPaid - onHoldPlayers) },
                  { label: "Never paid", value: String(neverPaid) },
                  onHoldPlayers ? { label: "On hold", value: String(onHoldPlayers) } : null,
                  { label: "Collected", value: fmtMoney(collected) },
              ]
    ).filter((stat): stat is { label: string; value: string } => stat !== null);

    return (
        <div
            style={{
                width: isSingleMonth ? 760 : Math.max(900, 300 + months.length * 78),
                background: "#FFFFFF",
                padding: 36,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                color: INK,
                boxSizing: "border-box",
            }}
        >
            {/* ── Letterhead ─────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {logo && <img src={logo} alt="" width={46} height={46} style={{ objectFit: "contain" }} />}
                    <div>
                        <div
                            style={{
                                fontSize: 17,
                                fontWeight: 800,
                                color: NAVY,
                                letterSpacing: 0.6,
                                textTransform: "uppercase",
                                lineHeight: 1.2,
                            }}
                        >
                            {clubName}
                        </div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Monthly Contribution Report</div>
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={metaLabel}>Period</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{period}</div>
                    <div style={metaLabel}>Generated</div>
                    <div style={{ fontSize: 11.5, color: INK }}>{generatedAt}</div>
                </div>
            </div>

            <div style={{ height: 2, background: GOLD, borderRadius: 2, margin: "14px 0 0" }} />

            {/* ── Stat strip ─────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 28, padding: "12px 2px 16px" }}>
                {stats.map((stat) => (
                    <div key={stat.label}>
                        <div style={metaLabel}>{stat.label}</div>
                        <div style={{ ...numeric, fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.3 }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
                <div style={{ marginLeft: "auto", alignSelf: "flex-end", fontSize: 10.5, color: MUTED }}>
                    {filterLine}
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────── */}
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead>
                    <tr>
                        <th style={{ ...th, width: 34 }}>#</th>
                        <th style={{ ...th, textAlign: "left" }}>Player</th>
                        {isSingleMonth ? (
                            <>
                                <th style={{ ...th, width: 130 }}>Amount</th>
                                <th style={{ ...th, width: 110 }}>Status</th>
                            </>
                        ) : (
                            <>
                                {months.map((month) => (
                                    <th key={month} style={th}>
                                        {monthLabel(month)}
                                    </th>
                                ))}
                                <th style={{ ...th, width: 62 }}>Paid</th>
                                <th style={{ ...th, width: 96 }}>Total</th>
                            </>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, index) => {
                        const zebra = index % 2 === 1 ? ZEBRA : "#FFFFFF";
                        const amount = isSingleMonth ? row.monthlyAmounts[months[0]] : undefined;
                        const hasPaid = amount !== undefined;
                        const onHoldMonths = new Set(row.onHoldMonths);
                        const singleState: MonthState = hasPaid
                            ? "paid"
                            : row.onHoldMonthCount > 0
                            ? "onHold"
                            : "due";

                        return (
                            <tr key={row.playerId} style={{ background: zebra }}>
                                <td style={{ ...td, ...numeric, textAlign: "center", color: MUTED }}>{index + 1}</td>
                                <td style={{ ...td, fontWeight: 600 }}>
                                    {row.playerName}
                                    {!row.active && (
                                        <span style={{ color: MUTED, fontWeight: 400, fontSize: 10.5 }}> (inactive)</span>
                                    )}
                                </td>

                                {isSingleMonth ? (
                                    <>
                                        <td style={{ ...td, ...numeric, textAlign: "right" }}>
                                            {hasPaid ? fmtMoney(amount as number) : "—"}
                                        </td>
                                        <td style={{ ...td, textAlign: "center" }}>
                                            <span style={pill(singleState)}>{PILL_TONE[singleState].label}</span>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {months.map((month) => {
                                            const cell = row.monthlyAmounts[month];
                                            const state: MonthState =
                                                cell !== undefined
                                                    ? "paid"
                                                    : onHoldMonths.has(month)
                                                    ? "onHold"
                                                    : "due";
                                            return (
                                                <td
                                                    key={month}
                                                    style={{
                                                        ...td,
                                                        ...numeric,
                                                        textAlign: state === "paid" ? "right" : "center",
                                                        color: state === "paid" ? INK : PILL_TONE[state].fg,
                                                        fontWeight: state === "due" ? 700 : 400,
                                                        fontSize: state === "onHold" ? 10 : undefined,
                                                        background: state === "paid" ? undefined : PILL_TONE[state].bg,
                                                    }}
                                                >
                                                    {state === "paid"
                                                        ? fmtMoney(cell as number)
                                                        : state === "onHold"
                                                        ? "On hold"
                                                        : "Due"}
                                                </td>
                                            );
                                        })}
                                        <td style={{ ...td, ...numeric, textAlign: "center", fontWeight: 700 }}>
                                            {/* Out of the months they owed — excused months are not dues. */}
                                            {row.paidMonthCount}/{months.length - row.onHoldMonthCount}
                                        </td>
                                        <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 700 }}>
                                            {fmtMoney(row.totalPaid)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}

                    {rows.length === 0 && (
                        <tr>
                            <td
                                style={{ ...td, textAlign: "center", color: MUTED, padding: 20 }}
                                colSpan={isSingleMonth ? 4 : months.length + 4}
                            >
                                No players match the selected filters.
                            </td>
                        </tr>
                    )}
                </tbody>

                {rows.length > 0 && (
                    <tfoot>
                        <tr style={{ background: "#F4F5F8" }}>
                            <td style={{ ...td, border: `1px solid ${RULE}` }} colSpan={2}>
                                <b>Total ({rows.length} players)</b>
                            </td>
                            {isSingleMonth ? (
                                <>
                                    <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 800, color: NAVY }}>
                                        {fmtMoney(collected)}
                                    </td>
                                    <td style={{ ...td, textAlign: "center", fontWeight: 700, color: NAVY }}>
                                        {paidCount} paid / {dueCount} due
                                        {onHoldPlayers > 0 && ` / ${onHoldPlayers} on hold`}
                                    </td>
                                </>
                            ) : (
                                <>
                                    {monthlyTotals.map((total, index) => (
                                        <td
                                            key={months[index]}
                                            style={{ ...td, ...numeric, textAlign: "right", fontWeight: 700, color: NAVY }}
                                        >
                                            {total > 0 ? fmtMoney(total) : "—"}
                                        </td>
                                    ))}
                                    <td style={{ ...td, textAlign: "center", fontWeight: 700, color: NAVY }}>
                                        {rows.reduce((sum, row) => sum + row.paidMonthCount, 0)}
                                    </td>
                                    <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 800, color: NAVY }}>
                                        {fmtMoney(collected)}
                                    </td>
                                </>
                            )}
                        </tr>
                    </tfoot>
                )}
            </table>

            {/* ── Footnote ───────────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${RULE}`, marginTop: 16, paddingTop: 8, fontSize: 9.5, color: MUTED }}>
                "Due" means no contribution was recorded against that player for that month. Any recorded
                contribution counts as paid.
                {onHoldPlayers > 0 || rows.some((row) => row.onHoldMonthCount > 0)
                    ? ' "On hold" means the player was excused for that month and owes nothing for it.'
                    : ""}
            </div>
        </div>
    );
}

export default ContributionReportSheet;
