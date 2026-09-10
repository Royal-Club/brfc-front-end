import { BillPaymentReportRow, BillPaymentReportSummary } from "../../../interfaces/IBillPaymentReport";
import { fmtMoney } from "../../../utils/acFormat";

/**
 * The printable face of the spend report — the thing that actually gets downloaded.
 *
 * <p>Rendered off-screen at a fixed width and captured as the PNG, so the image never depends on the
 * reader's window size, scroll position or theme. Colours are literal for the same reason a
 * downloaded document is always a white sheet of paper.
 *
 * <p>Deliberately the same letterhead and table furniture as the contribution report: the two are
 * halves of one period statement, and should look like it side by side on a committee table.
 */

const NAVY = "#14213D";
const GOLD = "#C6A15B";
const INK = "#282C36";
const MUTED = "#7A808C";
const RULE = "#E1E3E8";
const ZEBRA = "#FAFAFC";
const POSITIVE = "#166534";
const NEGATIVE = "#B02B2B";

export interface BillPaymentSheetProps {
    logo?: string;
    clubName: string;
    /** Month keys ("yyyy-MM") in column order. */
    months: string[];
    monthLabel: (month: string) => string;
    rows: BillPaymentReportRow[];
    summary?: BillPaymentReportSummary;
    period: string;
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

function BillPaymentReportSheet({
    logo,
    clubName,
    months,
    monthLabel,
    rows,
    summary,
    period,
    generatedAt,
}: BillPaymentSheetProps) {
    const totalSpent = rows.reduce((sum, row) => sum + row.total, 0);
    const monthlyTotals = months.map((month) =>
        rows.reduce((sum, row) => sum + (row.monthlyAmounts[month] ?? 0), 0)
    );
    const collected = summary?.totalCollected ?? 0;
    const net = collected - totalSpent;

    const stats = [
        { label: "Collected", value: fmtMoney(collected), tone: INK },
        { label: "Spent", value: fmtMoney(totalSpent), tone: INK },
        // The number the committee actually looks for, so it gets the colour.
        { label: "Net", value: fmtMoney(net), tone: net < 0 ? NEGATIVE : POSITIVE },
        { label: "Cost types", value: String(rows.length), tone: INK },
        { label: "Payments", value: String(summary?.paymentCount ?? 0), tone: INK },
    ];

    return (
        <div
            style={{
                width: Math.max(900, 340 + months.length * 78),
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
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Bill Payment Report</div>
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

            {/* ── Net position ───────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 28, padding: "12px 2px 16px" }}>
                {stats.map((stat) => (
                    <div key={stat.label}>
                        <div style={metaLabel}>{stat.label}</div>
                        <div style={{ ...numeric, fontSize: 16, fontWeight: 800, color: stat.tone, lineHeight: 1.3 }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table ──────────────────────────────────────────────── */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ ...th, width: 34 }}>#</th>
                        <th style={{ ...th, textAlign: "left" }}>Cost type</th>
                        {months.map((month) => (
                            <th key={month} style={th}>
                                {monthLabel(month)}
                            </th>
                        ))}
                        <th style={{ ...th, width: 100 }}>Total</th>
                        <th style={{ ...th, width: 62 }}>Share</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, index) => (
                        <tr key={row.costTypeId} style={{ background: index % 2 === 1 ? ZEBRA : "#FFFFFF" }}>
                            <td style={{ ...td, ...numeric, textAlign: "center", color: MUTED }}>{index + 1}</td>
                            <td style={{ ...td, fontWeight: 600 }}>{row.costTypeName}</td>
                            {months.map((month) => {
                                const amount = row.monthlyAmounts[month];
                                const count = row.monthlyPaymentCounts?.[month] ?? 1;
                                return (
                                    <td
                                        key={month}
                                        style={{
                                            ...td,
                                            ...numeric,
                                            textAlign: amount === undefined ? "center" : "right",
                                            color: amount === undefined ? MUTED : INK,
                                        }}
                                    >
                                        {amount === undefined ? "—" : fmtMoney(amount)}
                                        {/* Marks a figure that is several payments added together. */}
                                        {amount !== undefined && count > 1 && (
                                            <sup style={{ color: GOLD, fontWeight: 700, marginLeft: 2 }}>{count}</sup>
                                        )}
                                    </td>
                                );
                            })}
                            <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 700 }}>
                                {fmtMoney(row.total)}
                            </td>
                            <td style={{ ...td, ...numeric, textAlign: "right", color: MUTED }}>
                                {row.sharePercent.toFixed(1)}%
                            </td>
                        </tr>
                    ))}

                    {rows.length === 0 && (
                        <tr>
                            <td
                                style={{ ...td, textAlign: "center", color: MUTED, padding: 20 }}
                                colSpan={months.length + 4}
                            >
                                No payments recorded in this period.
                            </td>
                        </tr>
                    )}
                </tbody>

                {rows.length > 0 && (
                    <tfoot>
                        <tr style={{ background: "#F4F5F8" }}>
                            <td style={{ ...td, border: `1px solid ${RULE}` }} colSpan={2}>
                                <b>Total ({rows.length} cost types)</b>
                            </td>
                            {monthlyTotals.map((total, index) => (
                                <td
                                    key={months[index]}
                                    style={{ ...td, ...numeric, textAlign: "right", fontWeight: 700, color: NAVY }}
                                >
                                    {total > 0 ? fmtMoney(total) : "—"}
                                </td>
                            ))}
                            <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 800, color: NAVY }}>
                                {fmtMoney(totalSpent)}
                            </td>
                            <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 700, color: NAVY }}>
                                100%
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>

            {/* ── Footnote ───────────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${RULE}`, marginTop: 16, paddingTop: 8, fontSize: 9.5, color: MUTED }}>
                A raised number beside a figure is how many separate payments make it up; no number means a
                single payment. Payments are grouped by the month they were paid. Collections are counted by
                the month they were for, so Net compares what the club took in for these months against what
                it spent in them.
            </div>
        </div>
    );
}

export default BillPaymentReportSheet;
