import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { flushSync } from "react-dom";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Dropdown,
    Input,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
    Typography,
    message,
    theme,
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
import moment from "moment";
import {
    useGetTransactionLogQuery,
    useLazyGetTransactionLogQuery,
} from "../../../state/features/account/transactionLogSlice";
import type {
    TransactionLogEntry,
    TransactionLogSource,
} from "../../../interfaces/ITransactionLog";
import { fmtMoney } from "../../../utils/acFormat";
import {
    exportNodeToPng,
    exportTableToPdf,
    loadImageAsDataUrl,
    PdfCell,
} from "../../../utils/reportExport";
import TransactionLogSheet from "./TransactionLogSheet";
import { club, kicker, scoreNum } from "../../../theme/clubTheme";
import clubLogo from "../../../assets/logo.png";
import "../../../theme/clubTable.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/** How the four sources read on screen, and the pill tone each one wears. */
const SOURCE_META: Record<TransactionLogSource, { label: string; tone: string }> = {
    COLLECTION: { label: "Collection", tone: "active" },
    BILL_PAYMENT: { label: "Bill Payment", tone: "inactive" },
    VOUCHER: { label: "Voucher", tone: "neutral" },
    CASH_TRANSFER: { label: "Handover", tone: "gold" },
};

const SOURCE_OPTIONS = (Object.keys(SOURCE_META) as TransactionLogSource[]).map((source) => ({
    label: SOURCE_META[source].label,
    value: source,
}));

/** Posting and handover states share one column, so they share one tone map. */
const STATUS_TONE: Record<string, string> = {
    POSTED: "active",
    ACCEPTED: "active",
    UNPOSTED: "gold",
    PENDING: "gold",
    REJECTED: "inactive",
    CANCELLED: "inactive",
};

/** The log is read by date, and no movement can be recorded in the future. */
const isFutureDay = (day: Dayjs): boolean => day.isAfter(dayjs(), "day");

/** Server-side timestamps are UTC; the reader wants their own clock. */
const localStamp = (value: string | null): string =>
    value ? moment.utc(value).local().format("YYYY-MMM-DD h:mm A") : "";

const CLUB_NAME = "BJIT Royal Football Club";

const DOWNLOAD_PAGE_SIZE = 500;

/**
 * The most rows one document carries.
 *
 * <p>Past this a PNG stops being readable and a PDF stops being a document, so a download says what
 * it left out rather than running away with the whole ledger.
 */
const DOWNLOAD_MAX_ROWS = 2000;

const statusPill = (status: string | null) => {
    if (!status) return <Text type="secondary">—</Text>;
    const tone = STATUS_TONE[status] ?? "neutral";
    return (
        <span className={`brfc-status brfc-status--${tone}`}>
            <span className="brfc-status__dot" />
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
};

function TransactionLog() {
    const { token } = theme.useToken();

    // The current month so far, matching the endpoint's own default — the month being reconciled is
    // what this screen gets opened for. Wider ranges are one click away in the presets.
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf("month"), dayjs()]);
    const [sources, setSources] = useState<TransactionLogSource[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [isExporting, setIsExporting] = useState(false);
    const [messageApi, messageContext] = message.useMessage();

    // What the downloaded document shows. The table on screen holds one server page, but a download
    // is expected to carry the whole filtered period, so it is fetched and staged here first.
    const [sheetEntries, setSheetEntries] = useState<TransactionLogEntry[]>([]);
    const [omittedCount, setOmittedCount] = useState(0);
    const [generatedAt, setGeneratedAt] = useState(() => dayjs().format("D MMM YYYY, h:mm A"));
    const sheetRef = useRef<HTMLDivElement>(null);

    // Typing shouldn't fire a request per keystroke — the server re-merges four tables each time.
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Any change to what is being asked for puts the reader back on the first page; staying on
    // page 7 of a result that now has two pages would just show them an empty table.
    useEffect(() => {
        setPage(0);
    }, [range, sources, search, pageSize]);

    const params = useMemo(
        () => ({
            from: range[0].format("YYYY-MM-DD"),
            to: range[1].format("YYYY-MM-DD"),
            ...(sources.length ? { sources } : {}),
            ...(search ? { search } : {}),
            page,
            size: pageSize,
        }),
        [range, sources, search, page, pageSize]
    );

    const { data, isFetching, isError, refetch } = useGetTransactionLogQuery(params);
    const [fetchLog] = useLazyGetTransactionLogQuery();

    const log = data?.content;
    const entries = useMemo(() => log?.entries ?? [], [log]);
    const summary = log?.summary;

    const fieldLabel: CSSProperties = {
        ...kicker,
        color: token.colorTextSecondary,
        display: "block",
        marginBottom: 6,
    };

    const period = `${range[0].format("D MMM YYYY")} — ${range[1].format("D MMM YYYY")}`;
    const filename = `transaction-log-${params.from}-to-${params.to}`;

    /**
     * Pulls every page the current filters match, not just the one on screen, and stages it into
     * the off-screen sheet.
     *
     * <p>Downloading the visible page would quietly hand someone a 50-row document when they asked
     * for the year, which is worse than no download at all.
     *
     * <p>The write is flushed synchronously so the PNG capture below reads the rows this call just
     * fetched rather than the previous download's.
     */
    const stageDocument = async (): Promise<TransactionLogEntry[]> => {
        const collected: TransactionLogEntry[] = [];
        let logPage = 0;
        let totalPages = 1;
        let totalEntries = 0;

        while (logPage < totalPages && collected.length < DOWNLOAD_MAX_ROWS) {
            const result = await fetchLog(
                { ...params, page: logPage, size: DOWNLOAD_PAGE_SIZE },
                true
            ).unwrap();
            collected.push(...(result.content?.entries ?? []));
            totalPages = result.content?.totalPages ?? 0;
            totalEntries = result.content?.totalEntries ?? collected.length;
            logPage += 1;
        }

        const kept = collected.slice(0, DOWNLOAD_MAX_ROWS);
        flushSync(() => {
            setSheetEntries(kept);
            setOmittedCount(Math.max(0, totalEntries - kept.length));
            setGeneratedAt(dayjs().format("D MMM YYYY, h:mm A"));
        });
        return kept;
    };

    const handlePdf = async () => {
        setIsExporting(true);
        try {
            const rows = await stageDocument();
            if (!rows.length) {
                messageApi.info("Nothing to download for these filters.");
                return;
            }

            const right = { halign: "right" };
            const centre = { halign: "center" };
            const MUTED = [122, 128, 140];

            const body: PdfCell[][] = rows.map((entry, index) => [
                { content: index + 1, styles: { ...centre, textColor: MUTED } },
                { content: entry.date, styles: centre },
                { content: SOURCE_META[entry.source]?.label ?? entry.source, styles: { fontStyle: "bold" } },
                entry.reference ?? "—",
                entry.party ?? "—",
                { content: entry.description ?? "—", styles: { textColor: MUTED } },
                {
                    // A plain hyphen, not the minus sign the screen uses: jsPDF's built-in
                    // Helvetica cannot render U+2212 and would print junk in its place.
                    content:
                        (entry.direction === "IN" ? "+" : entry.direction === "OUT" ? "-" : "") +
                        fmtMoney(entry.amount),
                    styles: { ...right, fontStyle: "bold" },
                },
                { content: entry.status ?? "—", styles: { ...centre, textColor: MUTED } },
                `${entry.enteredBy ?? "—"}\n${localStamp(entry.enteredAt)}`,
                entry.modifiedAt
                    ? `${entry.modifiedBy ?? "Unknown"}\n${localStamp(entry.modifiedAt)}`
                    : { content: "Never edited", styles: { textColor: MUTED } },
            ]);

            await exportTableToPdf({
                brandName: CLUB_NAME,
                brandLogo: await loadImageAsDataUrl(clubLogo),
                title: "Transaction Log",
                meta: [
                    { label: "Period", value: period },
                    { label: "Generated", value: dayjs().format("D MMM YYYY, h:mm A") },
                ],
                summaryLine:
                    `In ${fmtMoney(summary?.totalIn ?? 0)}  ·  Out ${fmtMoney(summary?.totalOut ?? 0)}  ·  ` +
                    `Net ${fmtMoney(summary?.net ?? 0)}  ·  ` +
                    `Handed over ${fmtMoney(summary?.totalTransferred ?? 0)}  ·  ` +
                    `${summary?.entryCount ?? rows.length} transactions`,
                head: [
                    "#",
                    "Date",
                    "Type",
                    "Reference",
                    "Party",
                    "Description",
                    "Amount",
                    "Status",
                    "Entered by",
                    "Last changed",
                ],
                body,
                filename,
                orientation: "landscape",
                columnStyles: {
                    0: { cellWidth: 24, halign: "center" },
                    1: { cellWidth: 58 },
                    2: { cellWidth: 62 },
                    3: { cellWidth: 74 },
                    6: { cellWidth: 66 },
                    7: { cellWidth: 52 },
                    8: { cellWidth: 84 },
                    9: { cellWidth: 84 },
                },
                note:
                    "A handover moves cash between custodians without changing what the club holds, so it " +
                    "is shown unsigned and left out of Net. Never edited means the row has not been " +
                    "touched since it was entered." +
                    (omittedCount > 0
                        ? ` This document covers the first ${rows.length} transactions of the period; narrow the date range to see the rest.`
                        : ""),
            });
            messageApi.success("PDF downloaded.");
        } catch {
            // The API layer already reports a failed fetch; this covers building the document.
            messageApi.error("Could not build the PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePng = async () => {
        setIsExporting(true);
        try {
            const rows = await stageDocument();
            if (!rows.length) {
                messageApi.info("Nothing to download for these filters.");
                return;
            }
            if (!sheetRef.current) return;
            await exportNodeToPng(sheetRef.current, filename, "#FFFFFF");
            messageApi.success("Image downloaded.");
        } catch {
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

    const columns: ColumnsType<TransactionLogEntry> = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            width: 120,
            render: (date: string) => (
                <Text type="secondary" style={scoreNum}>
                    {dayjs(date).format("YYYY-MMM-DD")}
                </Text>
            ),
        },
        {
            title: "Type",
            dataIndex: "source",
            key: "source",
            width: 130,
            render: (source: TransactionLogSource) => (
                <span className={`brfc-status brfc-status--${SOURCE_META[source]?.tone ?? "neutral"}`}>
                    <span className="brfc-status__dot" />
                    {SOURCE_META[source]?.label ?? source}
                </span>
            ),
        },
        {
            title: "Reference",
            dataIndex: "reference",
            key: "reference",
            width: 150,
            render: (reference: string | null) =>
                reference ? <span className="brfc-chip">{reference}</span> : <Text type="secondary">—</Text>,
        },
        {
            title: "Party",
            dataIndex: "party",
            key: "party",
            ellipsis: true,
            render: (party: string | null) =>
                party ? (
                    <Tooltip title={party}>
                        <span>{party}</span>
                    </Tooltip>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
            render: (description: string | null) =>
                description ? (
                    <Tooltip title={description}>
                        <Text type="secondary">{description}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            align: "right",
            width: 140,
            render: (amount: number, entry) => {
                // The sign carries the direction: a handover is neither in nor out, so it stays
                // unsigned rather than pretending to be one of them.
                const tone =
                    entry.direction === "IN"
                        ? "brfc-amount--pos"
                        : entry.direction === "OUT"
                        ? "brfc-amount--neg"
                        : "brfc-amount--muted";
                const sign = entry.direction === "IN" ? "+" : entry.direction === "OUT" ? "−" : "";
                return (
                    <span className={`brfc-amount ${tone}`} style={scoreNum}>
                        {sign}
                        {fmtMoney(amount)}
                    </span>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: string | null) => statusPill(status),
        },
        {
            title: "Entered by",
            dataIndex: "enteredBy",
            key: "enteredBy",
            width: 160,
            render: (enteredBy: string | null, entry) =>
                enteredBy ? (
                    <Tooltip title={localStamp(entry.enteredAt)}>
                        <span>{enteredBy}</span>
                    </Tooltip>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Entered at",
            dataIndex: "enteredAt",
            key: "enteredAt",
            width: 175,
            render: (enteredAt: string | null) =>
                enteredAt ? (
                    <Text type="secondary" style={scoreNum}>
                        {localStamp(enteredAt)}
                    </Text>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Last changed",
            dataIndex: "modifiedBy",
            key: "modifiedBy",
            width: 190,
            // The column that makes this screen worth having: a row edited after the fact says so,
            // and says who did it.
            render: (modifiedBy: string | null, entry) =>
                modifiedBy || entry.modifiedAt ? (
                    <Space direction="vertical" size={0}>
                        <span>{modifiedBy ?? "Unknown"}</span>
                        <Text type="secondary" style={{ ...scoreNum, fontSize: 12 }}>
                            {localStamp(entry.modifiedAt)}
                        </Text>
                    </Space>
                ) : (
                    <Text type="secondary">Never edited</Text>
                ),
        },
    ];

    const tiles = [
        { label: "Money in", value: fmtMoney(summary?.totalIn ?? 0), tone: token.colorSuccess },
        { label: "Money out", value: fmtMoney(summary?.totalOut ?? 0), tone: token.colorError },
        {
            label: "Net",
            value: fmtMoney(summary?.net ?? 0),
            tone: (summary?.net ?? 0) < 0 ? token.colorError : token.colorSuccess,
        },
        { label: "Handed over", value: fmtMoney(summary?.totalTransferred ?? 0), tone: club.gold },
        { label: "Entries", value: summary?.entryCount ?? 0, tone: club.gold },
    ];

    if (isError) {
        return (
            <div className="brfc-page" style={{ padding: "24px 0" }}>
                <Text type="danger">Failed to load the transaction log.</Text>{" "}
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
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div>
                    <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>
                        Transaction Log
                    </Title>
                    <Text type="secondary">
                        Every collection, bill payment, voucher and cash handover — with who recorded it.
                    </Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
                        Refresh
                    </Button>
                    <Dropdown menu={downloadMenu} disabled={isFetching || !entries.length}>
                        <Button type="primary" icon={<DownloadOutlined />} loading={isExporting}>
                            Download
                        </Button>
                    </Dropdown>
                </Space>
            </div>

            <div className="brfc-gold-divider" />

            {/* The document that gets downloaded, rendered off-screen at a fixed width. */}
            <div
                ref={sheetRef}
                aria-hidden
                style={{ position: "absolute", left: -100000, top: 0, pointerEvents: "none" }}
            >
                <TransactionLogSheet
                    logo={clubLogo}
                    clubName={CLUB_NAME}
                    entries={sheetEntries}
                    summary={summary}
                    sourceLabel={(entry) => SOURCE_META[entry.source]?.label ?? entry.source}
                    stamp={localStamp}
                    period={period}
                    generatedAt={generatedAt}
                    omittedCount={omittedCount}
                />
            </div>

            <Card
                size="small"
                style={{ marginBottom: 16, border: `1px solid ${club.panelBorder}`, borderRadius: 12 }}
            >
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={12} lg={9}>
                        <Text style={fieldLabel}>Date range</Text>
                        <RangePicker
                            value={range}
                            onChange={(picked) => {
                                const value = picked as [Dayjs | null, Dayjs | null] | null;
                                if (value?.[0] && value?.[1]) {
                                    setRange([value[0], value[1]]);
                                }
                            }}
                            disabledDate={isFutureDay}
                            allowClear={false}
                            style={{ width: "100%" }}
                            presets={[
                                { label: "This month", value: [dayjs().startOf("month"), dayjs()] },
                                { label: "Last 3 months", value: [dayjs().subtract(3, "month"), dayjs()] },
                                { label: "This year", value: [dayjs().startOf("year"), dayjs()] },
                                { label: "Last 12 months", value: [dayjs().subtract(12, "month"), dayjs()] },
                            ]}
                        />
                    </Col>

                    <Col xs={24} md={12} lg={7}>
                        <Text style={fieldLabel}>Transaction type</Text>
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder="All types"
                            value={sources}
                            onChange={(value) => setSources(value as TransactionLogSource[])}
                            options={SOURCE_OPTIONS}
                            style={{ width: "100%" }}
                        />
                    </Col>

                    <Col xs={24} lg={8}>
                        <Text style={fieldLabel}>Search</Text>
                        <Input
                            allowClear
                            placeholder="Reference, player, cost type or who entered it"
                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                        />
                    </Col>
                </Row>
            </Card>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
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
                            <div
                                style={{
                                    ...scoreNum,
                                    color: tile.tone,
                                    fontSize: 20,
                                    fontWeight: 800,
                                    lineHeight: 1.3,
                                }}
                            >
                                {tile.value}
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <Table
                size="small"
                bordered
                className="brfc-club-table"
                rowKey={(entry) => `${entry.source}-${entry.sourceId}`}
                loading={isFetching}
                columns={columns}
                dataSource={entries}
                scroll={{ x: "max-content" }}
                style={{ borderRadius: 10, overflow: "hidden" }}
                pagination={{
                    // The server pages this, so the table is told where it is rather than working
                    // it out from a dataSource that only ever holds one page.
                    current: page + 1,
                    pageSize,
                    total: log?.totalEntries ?? 0,
                    showSizeChanger: true,
                    pageSizeOptions: ["25", "50", "100", "200"],
                    showTotal: (total) => `Total ${total} transactions`,
                    onChange: (nextPage, nextSize) => {
                        setPage(nextPage - 1);
                        setPageSize(nextSize);
                    },
                }}
            />
        </div>
    );
}

export default TransactionLog;
