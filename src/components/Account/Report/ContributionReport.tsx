import { useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Dropdown,
    Input,
    Row,
    Segmented,
    Space,
    Table,
    Tag,
    theme,
    Tooltip,
    Typography,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
    DownloadOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    ReloadOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useGetContributionReportQuery } from "../../../state/features/account/contributionReportSlice";
import { ContributionReportRow } from "../../../interfaces/IContributionReport";
import { fmtMoney } from "../../../utils/acFormat";
import { exportNodeToPng, exportTableToPdf, loadImageAsDataUrl, PdfCell } from "../../../utils/reportExport";
import ContributionReportSheet from "./ContributionReportSheet";
import { club, kicker, scoreNum } from "../../../theme/clubTheme";
import clubLogo from "../../../assets/logo.png";
import type { CSSProperties } from "react";
import "../../../theme/clubTable.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CLUB_NAME = "BJIT Royal Football Club";

type PaymentStatus = "paid" | "partial" | "unpaid";
type StatusFilter = "all" | PaymentStatus;

const STATUS_LABEL: Record<PaymentStatus, string> = {
    paid: "Fully paid",
    partial: "Partial",
    unpaid: "Unpaid",
};

const STATUS_TONE: Record<PaymentStatus, string> = {
    paid: "active",
    partial: "gold",
    unpaid: "inactive",
};

/**
 * Months that have not happened yet cannot be paid for, and would report the whole club as
 * defaulters. The picker stops at the current month.
 */
const isFutureMonth = (month: Dayjs): boolean => month.isAfter(dayjs(), "month");

/**
 * A player is "unpaid" for a month when no collection covers them for it — the same rule the dues
 * reminder scheduler uses. The club records no expected per-player amount, so a part payment still
 * counts as paid.
 */
const rowStatus = (row: ContributionReportRow): PaymentStatus => {
    if (row.paidMonthCount === 0) return "unpaid";
    return row.unpaidMonthCount === 0 ? "paid" : "partial";
};

interface TableRow extends ContributionReportRow {
    key: number;
    status: PaymentStatus;
}

function ContributionReport() {
    // The app toggles between antd's light and dark algorithms, so the report is built from theme
    // tokens rather than fixed club colours — only the gold accent is constant across both.
    const { token } = theme.useToken();

    // Default to the current month — the everyday question is "who has not paid this month?".
    // Wider views are one click away in the range picker presets.
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs(), dayjs()]);
    const [activeOnly, setActiveOnly] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [generatedAt, setGeneratedAt] = useState(() => dayjs().format("D MMM YYYY, h:mm A"));

    /**
     * Stamps the sheet with the current time and forces that re-render to land before the caller
     * captures it — otherwise the PNG carries whenever the page last happened to render.
     */
    const stampGeneratedAt = (): string => {
        const now = dayjs().format("D MMM YYYY, h:mm A");
        flushSync(() => setGeneratedAt(now));
        return now;
    };

    // The off-screen print sheet that both downloads are built from.
    const sheetRef = useRef<HTMLDivElement>(null);
    const [messageApi, messageContext] = message.useMessage();

    const { data, isFetching, isError, refetch } = useGetContributionReportQuery({
        from: range[0].startOf("month").format("YYYY-MM-DD"),
        to: range[1].startOf("month").format("YYYY-MM-DD"),
        activeOnly,
    });

    const report = data?.content;
    const months = useMemo(() => report?.months ?? [], [report]);

    // Only disambiguate with the year when the range actually straddles one — "Jan" reads better
    // than "Jan '25" when every column is the same year.
    const spansYears = useMemo(
        () => new Set(months.map((month) => month.slice(0, 4))).size > 1,
        [months]
    );
    const monthLabel = useCallback(
        (month: string) => dayjs(`${month}-01`).format(spansYears ? "MMM 'YY" : "MMM"),
        [spansYears]
    );

    const rows: TableRow[] = useMemo(() => {
        const term = search.trim().toLowerCase();
        return (report?.rows ?? [])
            .map((row) => ({ ...row, key: row.playerId, status: rowStatus(row) }))
            .filter((row) => statusFilter === "all" || row.status === statusFilter)
            .filter((row) => !term || row.playerName.toLowerCase().includes(term));
    }, [report, statusFilter, search]);

    const monthlyTotals = useMemo(
        () => months.map((month) => rows.reduce((sum, row) => sum + (row.monthlyAmounts[month] ?? 0), 0)),
        [months, rows]
    );
    const grandTotal = useMemo(() => rows.reduce((sum, row) => sum + row.totalPaid, 0), [rows]);
    const paidMonthTotal = useMemo(() => rows.reduce((sum, row) => sum + row.paidMonthCount, 0), [rows]);

    const isSingleMonth = months.length === 1;

    // "September 2026" for one month, "Jan 2026 — Sep 2026" across a range.
    const period = useMemo(() => {
        if (!months.length) return "";
        const first = dayjs(`${months[0]}-01`);
        if (isSingleMonth) return first.format("MMMM YYYY");
        return `${first.format("MMM YYYY")} — ${dayjs(`${months[months.length - 1]}-01`).format("MMM YYYY")}`;
    }, [months, isSingleMonth]);

    const filterLine = [
        activeOnly ? "Active players" : "All players",
        statusFilter === "all" ? null : STATUS_LABEL[statusFilter],
        search.trim() ? `Search: "${search.trim()}"` : null,
    ]
        .filter(Boolean)
        .join("  ·  ");
    const subtitle = [period, filterLine].filter(Boolean).join("  •  ");

    const filename = isSingleMonth
        ? `contribution-report-${months[0]}`
        : `contribution-report-${range[0].format("YYYY-MM")}-to-${range[1].format("YYYY-MM")}`;

    const handleRangeChange = (value: unknown) => {
        const picked = value as [Dayjs | null, Dayjs | null] | null;
        if (picked?.[0] && picked?.[1]) {
            setRange([picked[0], picked[1]]);
        }
    };

    const paidPlayerCount = rows.filter((row) => row.paidMonthCount > 0).length;
    const fullyPaidCount = rows.filter((row) => row.status === "paid").length;
    const neverPaidCount = rows.filter((row) => row.status === "unpaid").length;

    /** The stat strip, worded for the layout in play — the PDF and the sheet must agree. */
    const summaryLine = isSingleMonth
        ? `${rows.length} players  ·  ${paidPlayerCount} paid  ·  ${rows.length - paidPlayerCount} due  ·  ${fmtMoney(grandTotal)} collected`
        : `${rows.length} players  ·  ${fullyPaidCount} fully paid  ·  ${rows.length - fullyPaidCount - neverPaidCount} partial  ·  ${neverPaidCount} never paid  ·  ${fmtMoney(grandTotal)} collected`;

    const handlePdf = async () => {
        setIsExporting(true);
        try {
            const stamped = stampGeneratedAt();
            const DUE_RED = [176, 43, 43];
            const right = { halign: "right" };
            const centre = { halign: "center" };

            // One month reads as a roster (name, amount, paid or due); a range reads as a grid.
            // Same split as the sheet, so the PDF and the PNG are the same document.
            const head = isSingleMonth
                ? ["#", "Player", "Amount", "Status"]
                : ["#", "Player", ...months.map(monthLabel), "Paid", "Total"];

            const body: PdfCell[][] = rows.map((row, index) => {
                const serial = { content: index + 1, styles: { ...centre, textColor: [122, 128, 140] } };
                const name = {
                    content: row.active ? row.playerName : `${row.playerName} (inactive)`,
                    styles: { fontStyle: "bold" },
                };

                if (isSingleMonth) {
                    const amount = row.monthlyAmounts[months[0]];
                    const hasPaid = amount !== undefined;
                    return [
                        serial,
                        name,
                        { content: hasPaid ? fmtMoney(amount) : "—", styles: right },
                        {
                            content: hasPaid ? "PAID" : "DUE",
                            styles: {
                                ...centre,
                                fontStyle: "bold",
                                textColor: hasPaid ? [22, 101, 52] : DUE_RED,
                                fillColor: hasPaid ? [220, 252, 231] : [253, 231, 231],
                            },
                        },
                    ];
                }

                return [
                    serial,
                    name,
                    ...months.map((month) => {
                        const amount = row.monthlyAmounts[month];
                        return amount === undefined
                            ? {
                                  content: "Due",
                                  styles: { ...centre, fontStyle: "bold", textColor: DUE_RED, fillColor: [253, 231, 231] },
                              }
                            : { content: fmtMoney(amount), styles: right };
                    }),
                    { content: `${row.paidMonthCount}/${months.length}`, styles: { ...centre, fontStyle: "bold" } },
                    { content: fmtMoney(row.totalPaid), styles: { ...right, fontStyle: "bold" } },
                ];
            });

            const foot: PdfCell[][] = isSingleMonth
                ? [
                      [
                          { content: `Total ( players)`, colSpan: 2 },
                          { content: fmtMoney(grandTotal), styles: right },
                          { content: `${paidPlayerCount} paid / ${rows.length - paidPlayerCount} due`, styles: centre },
                      ],
                  ]
                : [
                      [
                          { content: `Total ( players)`, colSpan: 2 },
                          ...monthlyTotals.map((total) => ({
                              content: total > 0 ? fmtMoney(total) : "—",
                              styles: right,
                          })),
                          { content: paidMonthTotal, styles: centre },
                          { content: fmtMoney(grandTotal), styles: right },
                      ],
                  ];

            await exportTableToPdf({
                brandName: CLUB_NAME,
                brandLogo: await loadImageAsDataUrl(clubLogo),
                title: "Monthly Contribution Report",
                meta: [
                    { label: "Period", value: period },
                    { label: "Generated", value: stamped },
                ],
                summaryLine,
                head,
                body,
                foot: rows.length ? foot : undefined,
                filename,
                // A roster fits portrait; a month-per-column grid needs the width.
                orientation: isSingleMonth ? "portrait" : "landscape",
                columnStyles: {
                    0: { cellWidth: 28, halign: "center" },
                    1: { cellWidth: isSingleMonth ? 220 : 130, halign: "left" },
                },
                note: '"Due" means no contribution was recorded against that player for that month.',
            });
            messageApi.success("PDF downloaded.");
        } catch (error) {
            messageApi.error("Could not build the PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePng = async () => {
        if (!sheetRef.current) return;
        setIsExporting(true);
        try {
            stampGeneratedAt();
            // The off-screen sheet is a white document, so the capture background is white too.
            await exportNodeToPng(sheetRef.current, filename, "#FFFFFF");
            messageApi.success("Image downloaded.");
        } catch (error) {
            messageApi.error("Could not build the image. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const downloadMenu: MenuProps = {
        items: [
            { key: "pdf", label: "Download as PDF", icon: <FilePdfOutlined /> },
            { key: "png", label: "Download as PNG", icon: <FileImageOutlined /> },
        ],
        onClick: ({ key }) => {
            if (key === "pdf") handlePdf();
            if (key === "png") handlePng();
        },
    };

    const columns: ColumnsType<TableRow> = [
        {
            title: "Player",
            dataIndex: "playerName",
            key: "playerName",
            fixed: "left",
            width: 190,
            sorter: (a, b) => a.playerName.localeCompare(b.playerName),
            render: (name: string, row) => (
                <Space size={6}>
                    <b>{name}</b>
                    {!row.active && <Tag style={{ margin: 0, fontSize: 10 }}>inactive</Tag>}
                </Space>
            ),
        },
        ...months.map((month) => ({
            title: monthLabel(month),
            dataIndex: month,
            key: month,
            align: "center" as const,
            width: 78,
            sorter: (a: TableRow, b: TableRow) =>
                (a.monthlyAmounts[month] ?? 0) - (b.monthlyAmounts[month] ?? 0),
            render: (_: unknown, row: TableRow) => {
                const amount = row.monthlyAmounts[month];
                if (amount === undefined) {
                    return (
                        <span className="brfc-amount brfc-amount--neg" style={{ fontWeight: 700 }}>
                            Due
                        </span>
                    );
                }
                return <span className="brfc-amount" style={scoreNum}>{fmtMoney(amount)}</span>;
            },
        })),
        {
            title: "Paid",
            dataIndex: "paidMonthCount",
            key: "paidMonthCount",
            align: "center",
            width: 88,
            fixed: "right",
            sorter: (a, b) => a.paidMonthCount - b.paidMonthCount,
            render: (paid: number, row) => (
                <Tooltip
                    title={
                        row.unpaidMonths.length
                            ? `Due: ${row.unpaidMonths.map(monthLabel).join(", ")}`
                            : "Paid every month in range"
                    }
                >
                    <span className={`brfc-status brfc-status--${STATUS_TONE[row.status]}`}>
                        <span className="brfc-status__dot" />
                        {paid}/{months.length}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Total",
            dataIndex: "totalPaid",
            key: "totalPaid",
            align: "right",
            width: 110,
            fixed: "right",
            sorter: (a, b) => a.totalPaid - b.totalPaid,
            render: (total: number) => <span className="brfc-amount">{fmtMoney(total)}</span>,
        },
    ];

    // Counted from the filtered rows, not the server's whole-club summary: the tiles and the table
    // are exported as one image, so they have to agree with each other.
    const tiles = [
        { label: "Players", value: rows.length, tone: token.colorText },
        {
            label: "Fully paid",
            value: rows.filter((row) => row.status === "paid").length,
            tone: token.colorSuccess,
        },
        {
            label: "Partial",
            value: rows.filter((row) => row.status === "partial").length,
            tone: token.colorWarning,
        },
        {
            label: "Never paid",
            value: rows.filter((row) => row.status === "unpaid").length,
            tone: token.colorError,
        },
        {
            label: "Unpaid months",
            value: rows.reduce((sum, row) => sum + row.unpaidMonthCount, 0),
            tone: token.colorError,
        },
        { label: "Collected", value: fmtMoney(grandTotal), tone: club.gold },
    ];

    const fieldLabel: CSSProperties = {
        ...kicker,
        color: token.colorTextSecondary,
        display: "block",
        marginBottom: 6,
    };

    if (isError) {
        return (
            <div className="brfc-page" style={{ padding: "24px 0" }}>
                <Text type="danger">Failed to load the contribution report.</Text>{" "}
                <Button type="link" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="brfc-page" style={{ padding: "4px 0" }}>
            {messageContext}

            <div className="brfc-page-header" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>
                    Monthly Contribution Report
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
                        Refresh
                    </Button>
                    <Dropdown menu={downloadMenu} disabled={isFetching || !rows.length}>
                        <Button type="primary" icon={<DownloadOutlined />} loading={isExporting}>
                            Download
                        </Button>
                    </Dropdown>
                </Space>
            </div>

            <div className="brfc-gold-divider" />

            {/* Filters */}
            <Card
                size="small"
                style={{ marginBottom: 16, border: `1px solid ${club.panelBorder}`, borderRadius: 12 }}
            >
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={10} lg={8}>
                        <Text style={fieldLabel}>
                            Month range
                        </Text>
                        <RangePicker
                            picker="month"
                            value={range}
                            onChange={handleRangeChange}
                            disabledDate={isFutureMonth}
                            allowClear={false}
                            style={{ width: "100%" }}
                            presets={[
                                { label: "This month", value: [dayjs(), dayjs()] },
                                { label: "Last month", value: [dayjs().subtract(1, "month"), dayjs().subtract(1, "month")] },
                                { label: "This year", value: [dayjs().startOf("year"), dayjs()] },
                                { label: "Last 6 months", value: [dayjs().subtract(5, "month"), dayjs()] },
                                { label: "Last 12 months", value: [dayjs().subtract(11, "month"), dayjs()] },
                                {
                                    label: "Last year",
                                    value: [
                                        dayjs().subtract(1, "year").startOf("year"),
                                        dayjs().subtract(1, "year").endOf("year"),
                                    ],
                                },
                            ]}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={7} lg={5}>
                        <Text style={fieldLabel}>
                            Players
                        </Text>
                        <Segmented
                            block
                            value={activeOnly ? "active" : "all"}
                            onChange={(value) => setActiveOnly(value === "active")}
                            options={[
                                { label: "Active", value: "active" },
                                { label: "All", value: "all" },
                            ]}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={7} lg={6}>
                        <Text style={fieldLabel}>
                            Status
                        </Text>
                        <Segmented
                            block
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value as StatusFilter)}
                            options={[
                                { label: "All", value: "all" },
                                { label: "Paid", value: "paid" },
                                { label: "Partial", value: "partial" },
                                { label: "Unpaid", value: "unpaid" },
                            ]}
                        />
                    </Col>

                    <Col xs={24} lg={5}>
                        <Text style={fieldLabel}>
                            Find a player
                        </Text>
                        <Input
                            allowClear
                            placeholder="Player name"
                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </Col>
                </Row>
            </Card>

            {/* The document that gets downloaded. Rendered off-screen at a fixed width so the PNG is
                the same sheet whatever the reader's window size or theme, and never a screenshot of
                a half-scrolled table. The PDF mirrors it. */}
            <div
                ref={sheetRef}
                aria-hidden
                style={{ position: "absolute", left: -100000, top: 0, pointerEvents: "none" }}
            >
                <ContributionReportSheet
                    logo={clubLogo}
                    clubName={CLUB_NAME}
                    months={months}
                    monthLabel={monthLabel}
                    rows={rows}
                    period={period}
                    filterLine={filterLine}
                    generatedAt={generatedAt}
                />
            </div>

            <div
                style={{
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: 12,
                    padding: 16,
                }}
            >
                <div style={{ marginBottom: 12 }}>
                    <Text style={{ ...kicker, color: club.gold }}>Monthly Contribution Report</Text>
                    <div style={{ color: token.colorTextSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</div>
                </div>

                <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
                    {tiles.map((tile) => (
                        <Col xs={12} sm={8} lg={4} key={tile.label}>
                            <div
                                style={{
                                    background: token.colorFillQuaternary,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    borderRadius: 10,
                                    padding: "10px 12px",
                                }}
                            >
                                <div style={{ ...kicker, color: token.colorTextSecondary, fontSize: 10 }}>
                                    {tile.label}
                                </div>
                                <div style={{ ...scoreNum, color: tile.tone, fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
                                    {tile.value}
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                <Table
                    size="small"
                    bordered
                    rowKey="key"
                    className="brfc-club-table"
                    loading={isFetching}
                    columns={columns}
                    dataSource={rows}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    style={{ borderRadius: 10, overflow: "hidden" }}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row className="brfc-total-row">
                                <Table.Summary.Cell index={0}>
                                    <b>Total ({rows.length})</b>
                                </Table.Summary.Cell>
                                {monthlyTotals.map((total, index) => (
                                    <Table.Summary.Cell key={months[index]} index={index + 1} align="right">
                                        <span className="brfc-amount" style={scoreNum}>
                                            {total > 0 ? fmtMoney(total) : "—"}
                                        </span>
                                    </Table.Summary.Cell>
                                ))}
                                <Table.Summary.Cell index={months.length + 1} align="center">
                                    <b>
                                        {paidMonthTotal}/{rows.length * months.length}
                                    </b>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={months.length + 2} align="right">
                                    <span className="brfc-amount">{fmtMoney(grandTotal)}</span>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </div>
        </div>
    );
}

export default ContributionReport;
