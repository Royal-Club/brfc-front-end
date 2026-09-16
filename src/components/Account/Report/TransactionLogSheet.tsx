import { TransactionLogEntry, TransactionLogSummary } from "../../../interfaces/ITransactionLog";
import { fmtMoney } from "../../../utils/acFormat";

/**
 * The printable face of the transaction log — the thing that actually gets downloaded.
 *
 * <p>Rendered off-screen at a fixed width and captured as the PNG, so the image never depends on the
 * reader's window size, scroll position or theme. Colours are literal for the same reason a
 * downloaded document is always a white sheet of paper.
 *
 * <p>Same letterhead and table furniture as the contribution and bill payment sheets: these end up
 * side by side on a committee table and should read as one set of papers.
 */

const NAVY = "#14213D";
const GOLD = "#C6A15B";
const INK = "#282C36";
const MUTED = "#7A808C";
const RULE = "#E1E3E8";
const ZEBRA = "#FAFAFC";
const POSITIVE = "#166534";
const NEGATIVE = "#B02B2B";

export interface TransactionLogSheetProps {
    logo?: string;
    clubName: string;
    entries: TransactionLogEntry[];
    summary?: TransactionLogSummary;
    /** Human-readable label for the source of each row, e.g. "Bill Payment". */
    sourceLabel: (entry: TransactionLogEntry) => string;
    /** Server timestamps rendered in the reader's own clock. */
    stamp: (value: string | null) => string;
    period: string;
    generatedAt: string;
    /** Set when the cap trimmed the download, so the sheet says so rather than quietly lying. */
    omittedCount?: number;
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

/** Free text has no length limit, so these two cells wrap instead of stretching the sheet. */
const wrapped: React.CSSProperties = {
    ...td,
    whiteSpace: "normal",
    wordBreak: "break-word",
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

function TransactionLogSheet({
    logo,
    clubName,
    entries,
    summary,
    sourceLabel,
    stamp,
    period,
    generatedAt,
    omittedCount = 0,
}: TransactionLogSheetProps) {
    const net = summary?.net ?? 0;

    const stats = [
        { label: "Money in", value: fmtMoney(summary?.totalIn ?? 0), tone: POSITIVE },
        { label: "Money out", value: fmtMoney(summary?.totalOut ?? 0), tone: NEGATIVE },
        { label: "Net", value: fmtMoney(net), tone: net < 0 ? NEGATIVE : POSITIVE },
        { label: "Handed over", value: fmtMoney(summary?.totalTransferred ?? 0), tone: INK },
        { label: "Transactions", value: String(summary?.entryCount ?? entries.length), tone: INK },
    ];

    return (
        <div
            style={{
                width: 1400,
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
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Transaction Log</div>
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
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                    <col style={{ width: 34 }} />
                    <col style={{ width: 92 }} />
                    <col style={{ width: 96 }} />
                    <col style={{ width: 128 }} />
                    <col style={{ width: 180 }} />
                    <col style={{ width: 210 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 86 }} />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 150 }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={th}>#</th>
                        <th style={th}>Date</th>
                        <th style={th}>Type</th>
                        <th style={{ ...th, textAlign: "left" }}>Reference</th>
                        <th style={{ ...th, textAlign: "left" }}>Party</th>
                        <th style={{ ...th, textAlign: "left" }}>Description</th>
                        <th style={th}>Amount</th>
                        <th style={th}>Status</th>
                        <th style={{ ...th, textAlign: "left" }}>Entered by</th>
                        <th style={{ ...th, textAlign: "left" }}>Last changed</th>
                    </tr>
                </thead>

                <tbody>
                    {entries.map((entry, index) => {
                        const tone =
                            entry.direction === "IN" ? POSITIVE : entry.direction === "OUT" ? NEGATIVE : MUTED;
                        // A handover is neither in nor out, so it stays unsigned rather than
                        // pretending to be one of them.
                        const sign = entry.direction === "IN" ? "+" : entry.direction === "OUT" ? "−" : "";
                        return (
                            <tr
                                key={`${entry.source}-${entry.sourceId}`}
                                style={{ background: index % 2 === 1 ? ZEBRA : "#FFFFFF" }}
                            >
                                <td style={{ ...td, ...numeric, textAlign: "center", color: MUTED }}>{index + 1}</td>
                                <td style={{ ...td, ...numeric }}>{entry.date}</td>
                                <td style={{ ...td, fontWeight: 600 }}>{sourceLabel(entry)}</td>
                                <td style={{ ...wrapped, ...numeric }}>{entry.reference ?? "—"}</td>
                                <td style={wrapped}>{entry.party ?? "—"}</td>
                                <td style={{ ...wrapped, color: MUTED }}>{entry.description ?? "—"}</td>
                                <td style={{ ...td, ...numeric, textAlign: "right", fontWeight: 700, color: tone }}>
                                    {sign}
                                    {fmtMoney(entry.amount)}
                                </td>
                                <td style={{ ...td, textAlign: "center", color: MUTED }}>{entry.status ?? "—"}</td>
                                <td style={wrapped}>
                                    <div>{entry.enteredBy ?? "—"}</div>
                                    <div style={{ ...numeric, fontSize: 9.5, color: MUTED }}>
                                        {stamp(entry.enteredAt)}
                                    </div>
                                </td>
                                <td style={wrapped}>
                                    {entry.modifiedAt ? (
                                        <>
                                            <div>{entry.modifiedBy ?? "Unknown"}</div>
                                            <div style={{ ...numeric, fontSize: 9.5, color: MUTED }}>
                                                {stamp(entry.modifiedAt)}
                                            </div>
                                        </>
                                    ) : (
                                        <span style={{ color: MUTED }}>Never edited</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {entries.length === 0 && (
                        <tr>
                            <td style={{ ...td, textAlign: "center", color: MUTED, padding: 20 }} colSpan={10}>
                                No transactions recorded in this period.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ── Footnote ───────────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${RULE}`, marginTop: 16, paddingTop: 8, fontSize: 9.5, color: MUTED }}>
                Every collection, bill payment, voucher and cash handover in the period, newest first. A
                handover moves cash between custodians without changing what the club holds, so it is shown
                unsigned and left out of Net. "Never edited" means the row has not been touched since it was
                entered.
                {omittedCount > 0 && (
                    <>
                        {" "}
                        <b>
                            This document shows the first {entries.length} of{" "}
                            {entries.length + omittedCount} transactions; narrow the date range to see the
                            rest.
                        </b>
                    </>
                )}
            </div>
        </div>
    );
}

export default TransactionLogSheet;
