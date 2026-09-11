import { useMemo } from "react";
import { Row, Col, Typography, Table, Tag, Tooltip, Empty, Spin, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    DollarOutlined,
    MinusCircleOutlined,
    WalletOutlined,
    RiseOutlined,
    FallOutlined,
    WarningOutlined,
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
import dayjs from "dayjs";
import AntTitle from "antd/es/typography/Title";
import { useGetAccountSummaryQuery } from "../../../state/features/account/accountSummarySlice";
import { useGetContributionReportQuery } from "../../../state/features/account/contributionReportSlice";
import { useGetBillPaymentReportQuery } from "../../../state/features/account/billPaymentReportSlice";
import { useGetCashPositionQuery } from "../../../state/features/account/cashPositionSlice";
import { CashHolderRow } from "../../../interfaces/ICashPosition";
import { ContributionReportRow } from "../../../interfaces/IContributionReport";
import AnalyticsCard from "../../Dashboard/AnalyticsCard";
import { fmtMoney } from "../../../utils/acFormat";
import { defaultersFor, totalsByMonth } from "../../../utils/financialHealth";
import useIsMobile from "../../../hooks/useIsMobile";
import { club, kicker } from "../../../theme/clubTheme";
import "../../../theme/clubTable.css";

// Chart.js v3+ ships nothing registered by default — without this the trend chart throws
// "category is not a registered scale" whenever it is the first chart mounted on the page.
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, ChartLegend);

const { Text } = Typography;

/** How far back the trend chart and this-month figures look. Six months fits on one screen
 *  without a picker, and is enough to show a season's worth of shape. */
const TREND_MONTHS = 6;

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
    const spansYears = useMemo(
        () => new Set(months.map((m) => m.slice(0, 4))).size > 1,
        [months]
    );
    const monthLabel = (month: string) => dayjs(`${month}-01`).format(spansYears ? "MMM 'YY" : "MMM");

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
                backgroundColor: token.colorSuccess,
                borderRadius: 4,
                maxBarThickness: 34,
            },
            {
                label: "Spent",
                data: months.map((m) => spentByMonth[m] ?? 0),
                backgroundColor: token.colorError,
                borderRadius: 4,
                maxBarThickness: 34,
            },
        ],
    };

    const defaulterColumns: ColumnsType<ContributionReportRow> = [
        {
            title: "Player",
            dataIndex: "playerName",
            key: "playerName",
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            // Every row here is already unpaid for the month running now, so the tag names which
            // month rather than counting how many they have missed across the range.
            title: "Status",
            key: "status",
            align: "right",
            render: () => <Tag color="error">Unpaid {currentMonthLabel}</Tag>,
        },
    ];

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
            <Row gutter={[16, 16]} style={{ marginTop: 26 }}>
                <Col xs={24} lg={14}>
                    <div style={{ ...kicker, color: club.gold, marginBottom: 10 }}>
                        Contributions vs spending — last {months.length || TREND_MONTHS} months
                    </div>
                    <div
                        className="brfc-club-table"
                        style={{ borderRadius: 10, padding: 16, height: isMobile ? 240 : 300 }}
                    >
                        {isTrendLoading ? (
                            <Spin />
                        ) : months.length ? (
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: "top" } },
                                    scales: { y: { beginAtZero: true } },
                                }}
                            />
                        ) : (
                            <Empty description="No data for this period" />
                        )}
                    </div>
                </Col>
                <Col xs={24} lg={10}>
                    <div style={{ ...kicker, color: club.gold, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <WarningOutlined /> Unpaid this month{defaulters.length ? ` (${defaulters.length})` : ""}
                    </div>
                    <Table
                        loading={isContributionLoading}
                        size="small"
                        rowKey="playerId"
                        className="brfc-club-table"
                        style={{ borderRadius: 10, overflow: "hidden" }}
                        dataSource={defaulters}
                        columns={defaulterColumns}
                        scroll={{ x: "max-content" }}
                        pagination={defaulters.length > 8 ? { pageSize: 8, size: "small" } : false}
                        locale={{ emptyText: <Empty description="Every active player is paid up this month" /> }}
                    />
                </Col>
            </Row>
        </div>
    );
}

export default ClubFinancialHealth;
