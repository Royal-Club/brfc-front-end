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
    Space,
    Table,
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
import { useGetBillPaymentReportQuery } from "../../../state/features/account/billPaymentReportSlice";
import { BillPaymentReportRow } from "../../../interfaces/IBillPaymentReport";
import { fmtMoney } from "../../../utils/acFormat";
import { exportNodeToPng, exportTableToPdf, loadImageAsDataUrl, PdfCell } from "../../../utils/reportExport";
import BillPaymentReportSheet from "./BillPaymentReportSheet";
import { club, kicker, scoreNum } from "../../../theme/clubTheme";
import clubLogo from "../../../assets/logo.png";
import type { CSSProperties } from "react";
import "../../../theme/clubTable.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CLUB_NAME = "BJIT Royal Football Club";

/** Months that have not happened yet hold no payments; the picker stops at the current month. */
const isFutureMonth = (month: Dayjs): boolean => month.isAfter(dayjs(), "month");

interface TableRow extends BillPaymentReportRow {
    key: number;
}

function BillPaymentReport() {
    const { token } = theme.useToken();

    // Default to the current month, matching the contribution report — the two are read side by
    // side, so they should open on the same period. Wider ranges are one click away in the presets.
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs(), dayjs()]);
    const [search, setSearch] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [generatedAt, setGeneratedAt] = useState(() => dayjs().format("D MMM YYYY, h:mm A"));

    const sheetRef = useRef<HTMLDivElement>(null);
    const [messageApi, messageContext] = message.useMessage();

    /** Stamps the sheet with the current time and forces that render to land before capture. */
    const stampGeneratedAt = (): string => {
        const now = dayjs().format("D MMM YYYY, h:mm A");
        flushSync(() => setGeneratedAt(now));
        return now;
    };

    const { data, isFetching, isError, refetch } = useGetBillPaymentReportQuery({
        from: range[0].startOf("month").format("YYYY-MM-DD"),
        to: range[1].startOf("month").format("YYYY-MM-DD"),
    });

    const report = data?.content;
    const months = useMemo(() => report?.months ?? [], [report]);
    const summary = report?.summary;

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
            .map((row) => ({ ...row, key: row.costTypeId }))
            .filter((row) => !term || row.costTypeName.toLowerCase().includes(term));
    }, [report, search]);

    const monthlyTotals = useMemo(
        () => months.map((month) => rows.reduce((sum, row) => sum + (row.monthlyAmounts[month] ?? 0), 0)),
        [months, rows]
    );
    const totalSpent = useMemo(() => rows.reduce((sum, row) => sum + row.total, 0), [rows]);

    const period = useMemo(() => {
        if (!months.length) return "";
        const first = dayjs(`${months[0]}-01`);
        if (months.length === 1) return first.format("MMMM YYYY");
        return `${first.format("MMM YYYY")} — ${dayjs(`${months[months.length - 1]}-01`).format("MMM YYYY")}`;
    }, [months]);

    const filename = `bill-payment-report-${range[0].format("YYYY-MM")}-to-${range[1].format("YYYY-MM")}`;

    const collected = summary?.totalCollected ?? 0;
    const net = collected - totalSpent;

    const handleRangeChange = (value: unknown) => {
        const picked = value as [Dayjs | null, Dayjs | null] | null;
        if (picked?.[0] && picked?.[1]) {
            setRange([picked[0], picked[1]]);
        }
    };

    const handlePdf = async () => {
        setIsExporting(true);
        try {
            const stamped = stampGeneratedAt();
            const right = { halign: "right" };
            const centre = { halign: "center" };
            const MUTED = [122, 128, 140];

            const body: PdfCell[][] = rows.map((row, index) => [
                { content: index + 1, styles: { ...centre, textColor: MUTED } },
                { content: row.costTypeName, styles: { fontStyle: "bold" } },
                ...months.map((month) => {
                    const amount = row.monthlyAmounts[month];
                    if (amount === undefined) {
                        return { content: "—", styles: { ...centre, textColor: MUTED } };
                    }
                    const count = row.monthlyPaymentCounts?.[month] ?? 1;
                    // Parenthesised rather than a superscript: jsPDF's built-in Helvetica only
                    // carries superscript two and three, so a fourth payment would render as junk.
                    return {
                        content: count > 1 ? `${fmtMoney(amount)} (${count})` : fmtMoney(amount),
                        styles: right,
                    };
                }),
                { content: fmtMoney(row.total), styles: { ...right, fontStyle: "bold" } },
                { content: `${row.sharePercent.toFixed(1)}%`, styles: { ...right, textColor: MUTED } },
            ]);

            await exportTableToPdf({
                brandName: CLUB_NAME,
                brandLogo: await loadImageAsDataUrl(clubLogo),
                title: "Bill Payment Report",
                meta: [
                    { label: "Period", value: period },
                    { label: "Generated", value: stamped },
                ],
                summaryLine:
                    `Collected ${fmtMoney(collected)}  ·  Spent ${fmtMoney(totalSpent)}  ·  ` +
                    `Net ${fmtMoney(net)}  ·  ${rows.length} cost types  ·  ${summary?.paymentCount ?? 0} payments`,
                head: ["#", "Cost type", ...months.map(monthLabel), "Total", "Share"],
                body,
                foot: rows.length
                    ? [
                          [
                              { content: `Total (${rows.length} cost types)`, colSpan: 2 },
                              ...monthlyTotals.map((total) => ({
                                  content: total > 0 ? fmtMoney(total) : "—",
                                  styles: right,
                              })),
                              { content: fmtMoney(totalSpent), styles: right },
                              { content: "100%", styles: right },
                          ],
                      ]
                    : undefined,
                filename,
                orientation: "landscape",
                columnStyles: {
                    0: { cellWidth: 28, halign: "center" },
                    1: { cellWidth: 140, halign: "left" },
                },
                note:
                    "A figure followed by (n) is made up of n separate payments. " +
                    "Payments are grouped by the month they were paid; collections by the month they were for.",
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
            title: "Cost type",
            dataIndex: "costTypeName",
            key: "costTypeName",
            fixed: "left",
            width: 200,
            sorter: (a, b) => a.costTypeName.localeCompare(b.costTypeName),
            render: (name: string) => <b>{name}</b>,
        },
        ...months.map((month) => ({
            title: monthLabel(month),
            dataIndex: month,
            key: month,
            align: "right" as const,
            width: 90,
            sorter: (a: TableRow, b: TableRow) =>
                (a.monthlyAmounts[month] ?? 0) - (b.monthlyAmounts[month] ?? 0),
            render: (_: unknown, row: TableRow) => {
                const amount = row.monthlyAmounts[month];
                if (amount === undefined) {
                    return <span className="brfc-amount brfc-amount--muted">—</span>;
                }
                const count = row.monthlyPaymentCounts?.[month] ?? 1;
                const cell = <span className="brfc-amount" style={scoreNum}>{fmtMoney(amount)}</span>;

                // Silence means one payment. The marker is the only hint a reader gets that a
                // figure is several payments added together.
                if (count < 2) {
                    return cell;
                }
                return (
                    <Tooltip title={`${count} payments this month`}>
                        <span>
                            {cell}
                            <sup style={{ color: club.gold, fontWeight: 700, marginLeft: 2 }}>{count}</sup>
                        </span>
                    </Tooltip>
                );
            },
        })),
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            align: "right",
            width: 120,
            fixed: "right",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.total - b.total,
            render: (total: number) => <span className="brfc-amount">{fmtMoney(total)}</span>,
        },
        {
            title: "Share",
            dataIndex: "sharePercent",
            key: "sharePercent",
            align: "right",
            width: 80,
            fixed: "right",
            sorter: (a, b) => a.sharePercent - b.sharePercent,
            render: (share: number) => (
                <span className="brfc-amount brfc-amount--muted" style={scoreNum}>
                    {share.toFixed(1)}%
                </span>
            ),
        },
    ];

    const tiles = [
        { label: "Collected", value: fmtMoney(collected), tone: token.colorText },
        { label: "Spent", value: fmtMoney(totalSpent), tone: token.colorText },
        { label: "Net", value: fmtMoney(net), tone: net < 0 ? token.colorError : token.colorSuccess },
        { label: "Cost types", value: rows.length, tone: club.gold },
        { label: "Payments", value: summary?.paymentCount ?? 0, tone: club.gold },
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
                <Text type="danger">Failed to load the bill payment report.</Text>{" "}
                <Button type="link" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="brfc-page" style={{ padding: "4px 0" }}>
            {messageContext}

            <div
                className="brfc-page-header"
                style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}
            >
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>
                    Bill Payment Report
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

            <Card
                size="small"
                style={{ marginBottom: 16, border: `1px solid ${club.panelBorder}`, borderRadius: 12 }}
            >
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={14} lg={10}>
                        <Text style={fieldLabel}>Month range</Text>
                        <RangePicker
                            picker="month"
                            value={range}
                            onChange={handleRangeChange}
                            disabledDate={isFutureMonth}
                            allowClear={false}
                            style={{ width: "100%" }}
                            presets={[
                                { label: "This month", value: [dayjs(), dayjs()] },
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

                    <Col xs={24} md={10} lg={8}>
                        <Text style={fieldLabel}>Find a cost type</Text>
                        <Input
                            allowClear
                            placeholder="Cost type"
                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </Col>
                </Row>
            </Card>

            {/* The document that gets downloaded, rendered off-screen at a fixed width. */}
            <div
                ref={sheetRef}
                aria-hidden
                style={{ position: "absolute", left: -100000, top: 0, pointerEvents: "none" }}
            >
                <BillPaymentReportSheet
                    logo={clubLogo}
                    clubName={CLUB_NAME}
                    months={months}
                    monthLabel={monthLabel}
                    rows={rows}
                    summary={summary}
                    period={period}
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
                    <Text style={{ ...kicker, color: club.gold }}>Bill Payment Report</Text>
                    <div style={{ color: token.colorTextSecondary, fontSize: 12, marginTop: 2 }}>{period}</div>
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
                                <Table.Summary.Cell index={months.length + 1} align="right">
                                    <span className="brfc-amount">{fmtMoney(totalSpent)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={months.length + 2} align="right">
                                    <b>100%</b>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </div>
        </div>
    );
}

export default BillPaymentReport;
