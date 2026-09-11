import { useMemo } from "react";
import type { CSSProperties } from "react";
import { Row, Col, Typography, Table, Tag, Tooltip, Empty, Spin, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    DollarOutlined,
    MinusCircleOutlined,
    WalletOutlined,
    RiseOutlined,
    FallOutlined,
    WarningOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import dayjs from "dayjs";
import AntTitle from "antd/es/typography/Title";
import { useGetAccountSummaryQuery } from "../../../state/features/account/accountSummarySlice";
import { useGetContributionReportQuery } from "../../../state/features/account/contributionReportSlice";
import { useGetBillPaymentReportQuery } from "../../../state/features/account/billPaymentReportSlice";
import { useGetCashPositionQuery } from "../../../state/features/account/cashPositionSlice";
import { CashHolderRow } from "../../../interfaces/ICashPosition";
import AnalyticsCard from "../../Dashboard/AnalyticsCard";
import { fmtMoney } from "../../../utils/acFormat";
import { defaultersFor, totalsByMonth } from "../../../utils/financialHealth";
import useIsMobile from "../../../hooks/useIsMobile";
import { club, kicker, scoreNum } from "../../../theme/clubTheme";
import "../../../theme/clubTable.css";

// Chart.js v3+ ships nothing registered by default — without this the trend chart throws
// "category is not a registered scale" whenever it is the first chart mounted on the page.
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, ChartLegend);

const { Text } = Typography;

/** How far back the trend chart and this-month figures look. A full year, so the shape covers a
 *  whole season rather than part of one, and every month can be compared against the same month
 *  last time round. */
const TREND_MONTHS = 12;

/** The club's own green and red, the same pair the amount styles use, so money reads alike. */
const POSITIVE = club.pitch;
const NEGATIVE = "#E0736B";

/** The seam between panel halves and between list rows. */
const HAIRLINE = "rgba(255, 255, 255, 0.09)";

const CENTRED: CSSProperties = {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const COUNT_CHIP: CSSProperties = {
    ...scoreNum,
    minWidth: 26,
    textAlign: "center",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 700,
    color: club.gold,
    background: "rgba(198, 161, 91, 0.12)",
    border: `1px solid ${club.panelBorder}`,
};

const AVATAR: CSSProperties = {
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: club.goldSoft,
    background: club.tileBg,
    border: club.tileBorder,
};

/** Up to two initials, so a long name still fits the circle. */
const initialsOf = (name: string): string =>
    (name || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

/** Axis figures in thousands, so the scale stays readable at a glance. */
const compactAmount = (value: number): string => {
    const amount = Number(value) || 0;
    return Math.abs(amount) >= 1000 ? `${Math.round(amount / 1000)}k` : `${amount}`;
};

function LegendKey({ color, label }: { color: string; label: string }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i
                style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    background: color,
                    display: "inline-block",
                }}
            />
            <span style={{ color: club.textMuted, fontSize: 12, fontWeight: 600 }}>{label}</span>
        </span>
    );
}

function ClubFinancialHealth() {
    const { token } = theme.useToken();
    const isMobile = useIsMobile(768);

    const to = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
    const from = useMemo(
        () => dayjs().subtract(TREND_MONTHS - 1, "month").format("YYYY-MM-DD"),
        []
    );
    const currentMonthKey = useMemo(() => dayjs().format("YYYY-MM"), []);
    const currentMonthLabel = useMemo(() => dayjs().format("MMM YYYY"), []);

    const { data: summaryData, isLoading: isSummaryLoading } = useGetAccountSummaryQuery();
    const { data: contributionData, isFetching: isContributionLoading } =
        useGetContributionReportQuery({ from, to, activeOnly: true });
    const { data: billPaymentData, isFetching: isBillPaymentLoading } =
        useGetBillPaymentReportQuery({ from, to });
    const { data: cashPositionData, isFetching: isCashPositionLoading } = useGetCashPositionQuery();

    const cashRows = cashPositionData?.content?.holders ?? [];
    const cashTotal = cashPositionData?.content?.total ?? 0;

    const summary = summaryData?.content;
    const contribution = contributionData?.content;
    const billPayment = billPaymentData?.content;

    const isTrendLoading = isContributionLoading || isBillPaymentLoading;

    // Both reports were asked for the same range, so their month axes should agree; fall back to
    // whichever answered first so the chart still has labels while the other is still loading.
    const months = useMemo(
        () => contribution?.months ?? billPayment?.months ?? [],
        [contribution, billPayment]
    );
    // A rolling year holds each month exactly once, so the name alone is unambiguous and a year
    // suffix would only crowd twelve labels. The range itself is named in the page header.
    const monthLabel = (month: string) => dayjs(`${month}-01`).format("MMM");

    const collectedByMonth = useMemo(
        () => totalsByMonth(contribution?.rows, contribution?.months),
        [contribution]
    );

    const spentByMonth = useMemo(
        () => totalsByMonth(billPayment?.rows, billPayment?.months),
        [billPayment]
    );

    // Note on wording: this figure is the sum of *player contributions*, which is not necessarily
    // every taka the club took in that month. The labels below say "Contributions" rather than
    // "Collected" so the page never implies a total it isn't measuring.
    const thisMonthCollected = collectedByMonth[currentMonthKey] ?? 0;
    const thisMonthSpent = spentByMonth[currentMonthKey] ?? 0;
    const thisMonthNet = thisMonthCollected - thisMonthSpent;

    // A player counts as a defaulter for the month only when nothing covers it and no pause
    // excuses it — exactly the rule the contribution report itself uses for `unpaidMonths`.
    const defaulters = useMemo(
        () => defaultersFor(contribution?.rows, currentMonthKey),
        [contribution, currentMonthKey]
    );

    const period = useMemo(() => {
        if (!months.length) return "";
        const first = dayjs(`${months[0]}-01`);
        const last = dayjs(`${months[months.length - 1]}-01`);
        return `${first.format("MMM YYYY")} — ${last.format("MMM YYYY")}`;
    }, [months]);

    const chartData = {
        labels: months.map(monthLabel),
        datasets: [
            {
                label: "Contributions",
                data: months.map((m) => collectedByMonth[m] ?? 0),
                backgroundColor: POSITIVE,
                borderRadius: 5,
                maxBarThickness: 26,
            },
            {
                label: "Spent",
                data: months.map((m) => spentByMonth[m] ?? 0),
                backgroundColor: NEGATIVE,
                borderRadius: 5,
                maxBarThickness: 26,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 2 } },
        // Pairs sit close together and months apart, so each month reads as one unit.
        categoryPercentage: 0.68,
        barPercentage: 0.9,
        plugins: {
            // Drawn in the section header instead, which gives the bars the height back.
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(14, 24, 48, 0.96)",
                borderColor: club.panelBorder,
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
                titleColor: club.textPrimary,
                bodyColor: club.textMuted,
                titleFont: { size: 12, weight: 700 as const },
                bodyFont: { size: 12 },
                boxWidth: 8,
                boxHeight: 8,
                boxPadding: 4,
                callbacks: {
                    label: (item: TooltipItem<"bar">) =>
                        ` ${item.dataset.label}: ${fmtMoney(item.parsed.y)}`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: "rgba(245, 247, 250, 0.58)",
                    font: { size: 11, weight: 600 as const },
                    // Never drop a month to make the axis fit: a year with gaps in it misreads as a
                    // year with no activity in those months. Tilt them instead when space is tight.
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 0,
                },
            },
            y: {
                beginAtZero: true,
                // Horizontal rules only. Vertical ones add clutter without helping comparison.
                grid: { color: "rgba(255, 255, 255, 0.06)" },
                border: { display: false },
                ticks: {
                    color: "rgba(245, 247, 250, 0.45)",
                    font: { size: 11 },
                    maxTicksLimit: 5,
                    padding: 6,
                    callback: (value: string | number) => compactAmount(Number(value)),
                },
            },
        },
    };

    const cashColumns: ColumnsType<CashHolderRow> = [
        {
            title: "Held by",
            dataIndex: "holderName",
            key: "holderName",
            render: (name: string | null) =>
                name ? (
                    <Text strong>{name}</Text>
                ) : (
                    // An account with money and nobody answerable for it is the thing worth seeing.
                    <Tag color="warning">Unassigned</Tag>
                ),
        },
        {
            title: "Account",
            dataIndex: "accountName",
            key: "accountName",
            responsive: ["sm"],
            render: (accountName: string, row) => (
                <span>
                    {accountName}{" "}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {row.accountCode}
                    </Text>
                </span>
            ),
        },
        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",
            align: "right",
            render: (balance: number, row) =>
                row.negative ? (
                    <Tooltip title="More was paid out of this account than was recorded into it. Cash in hand cannot really be negative.">
                        <span className="brfc-amount brfc-amount--neg">
                            <WarningOutlined /> {fmtMoney(balance)}
                        </span>
                    </Tooltip>
                ) : (
                    fmtMoney(balance)
                ),
            sorter: (a, b) => a.balance - b.balance,
            defaultSortOrder: "descend",
        },
    ];

    return (
        <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
            <div className="brfc-page-header">
                <AntTitle level={2} style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? 20 : undefined }}>
                    Financial Health
                </AntTitle>
                <Text type="secondary">Current condition at a glance · {period}</Text>
            </div>
            <div className="brfc-gold-divider" />

            {/* All-time position */}
            <div style={{ ...kicker, color: club.gold, margin: "18px 0 10px" }}>Overall position</div>
            {isSummaryLoading ? (
                <Spin />
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <AnalyticsCard
                            title="Total Collections"
                            value={summary?.totalCollection || 0}
                            accentColor={token.colorSuccess}
                            icon={<DollarOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <AnalyticsCard
                            title="Total Expenses"
                            value={summary?.totalExpense || 0}
                            accentColor={token.colorError}
                            icon={<MinusCircleOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <AnalyticsCard
                            title="Account Balance"
                            value={summary?.currentBalance || 0}
                            accentColor={token.colorPrimary}
                            icon={<WalletOutlined />}
                        />
                    </Col>
                </Row>
            )}

            {/* This month */}
            <div style={{ ...kicker, color: club.gold, margin: "26px 0 10px" }}>
                This month ({dayjs().format("MMMM YYYY")})
            </div>
            {isTrendLoading ? (
                <Spin />
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <AnalyticsCard
                            title="Contributions"
                            value={thisMonthCollected}
                            accentColor={token.colorSuccess}
                            icon={<RiseOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <AnalyticsCard
                            title="Spent"
                            value={thisMonthSpent}
                            accentColor={token.colorError}
                            icon={<FallOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <AnalyticsCard
                            title="Net"
                            value={thisMonthNet}
                            accentColor={thisMonthNet >= 0 ? token.colorSuccess : token.colorError}
                            icon={<WalletOutlined />}
                        />
                    </Col>
                </Row>
            )}

            {/* Who is holding the club's cash */}
            <div style={{ ...kicker, color: club.gold, margin: "26px 0 10px" }}>
                Cash in hand — who is holding it
            </div>
            <Table
                loading={isCashPositionLoading}
                size="small"
                rowKey="accountId"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                columns={cashColumns}
                dataSource={cashRows}
                pagination={false}
                scroll={{ x: "max-content" }}
                locale={{ emptyText: <Empty description="No cash accounts yet" /> }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>
                            <Text strong>Total cash</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} />
                        <Table.Summary.Cell index={2} align="right">
                            <Text strong>{fmtMoney(cashTotal)}</Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />

            {/* The six-month shape, beside who still owes for the month running now */}
            {/* One panel, split. The trend and the people behind on it are read together, and two
                separate cards of different heights made them look like unrelated widgets. */}
            <div
                style={{
                    marginTop: 26,
                    background: club.panel,
                    border: `1px solid ${club.panelBorder}`,
                    borderRadius: 14,
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                }}
            >
                {/* Trend */}
                <section
                    style={{
                        flex: "1 1 62%",
                        minWidth: 0,
                        padding: isMobile ? 16 : 20,
                        // The seam between the two halves, horizontal once they stack.
                        borderRight: isMobile ? "none" : `1px solid ${HAIRLINE}`,
                        borderBottom: isMobile ? `1px solid ${HAIRLINE}` : "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            marginBottom: 14,
                        }}
                    >
                        <div>
                            <div style={{ ...kicker, color: club.goldSoft }}>
                                Contributions vs spending
                            </div>
                            <div style={{ color: club.textMuted, fontSize: 12, marginTop: 3 }}>
                                Last {months.length || TREND_MONTHS} months
                            </div>
                        </div>
                        {/* Legend lives here rather than inside the canvas, which frees the height
                            for the bars themselves. */}
                        <div style={{ display: "flex", gap: 14 }}>
                            <LegendKey color={POSITIVE} label="Contributions" />
                            <LegendKey color={NEGATIVE} label="Spent" />
                        </div>
                    </div>

                    <div style={{ height: isMobile ? 240 : 288 }}>
                        {isTrendLoading ? (
                            <div style={CENTRED}>
                                <Spin />
                            </div>
                        ) : months.length ? (
                            <Bar data={chartData} options={chartOptions} />
                        ) : (
                            <div style={CENTRED}>
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <span style={{ color: club.textMuted }}>
                                            No data for this period
                                        </span>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Who still owes for the month running now */}
                <section
                    style={{
                        flex: "1 1 38%",
                        minWidth: 0,
                        padding: isMobile ? 16 : 20,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 14,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    ...kicker,
                                    color: club.goldSoft,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <WarningOutlined /> Unpaid
                            </div>
                            <div style={{ color: club.textMuted, fontSize: 12, marginTop: 3 }}>
                                {currentMonthLabel}
                            </div>
                        </div>
                        {defaulters.length > 0 && (
                            <span style={COUNT_CHIP}>{defaulters.length}</span>
                        )}
                    </div>

                    <div
                        style={{
                            flex: 1,
                            // Stacked on a phone the panel has no fixed height to divide up, so the
                            // list needs a floor of its own or it can collapse to nothing.
                            minHeight: isMobile ? 150 : 0,
                            overflowY: "auto",
                            marginRight: -4,
                            paddingRight: 4,
                        }}
                    >
                        {isContributionLoading ? (
                            <div style={CENTRED}>
                                <Spin />
                            </div>
                        ) : defaulters.length ? (
                            defaulters.map((player, index) => (
                                <div
                                    key={player.playerId}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "9px 0",
                                        borderTop: index === 0 ? "none" : `1px solid ${HAIRLINE}`,
                                    }}
                                >
                                    <span style={AVATAR}>{initialsOf(player.playerName)}</span>
                                    <span
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            color: club.textPrimary,
                                            fontWeight: 600,
                                            fontSize: 13.5,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {player.playerName}
                                    </span>
                                    <span className="brfc-status brfc-status--gold">
                                        <i className="brfc-status__dot" />
                                        Due
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ ...CENTRED, flexDirection: "column", gap: 6 }}>
                                <CheckCircleOutlined style={{ fontSize: 22, color: POSITIVE }} />
                                <span style={{ color: club.textMuted, fontSize: 13, textAlign: "center" }}>
                                    Everyone has paid for {currentMonthLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ClubFinancialHealth;
