import { useState } from "react";
import { Typography, Table, Empty, Spin, Row, Col, Button, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { WalletOutlined, ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AntTitle from "antd/es/typography/Title";
import { useGetMyCashInHandQuery } from "../../../state/features/account/myCashInHandSlice";
import CashTransferModal from "./CashTransferModal";
import { CashMovement } from "../../../interfaces/IMyCashInHand";
import AnalyticsCard from "../../Dashboard/AnalyticsCard";
import { fmtMoney } from "../../../utils/acFormat";
import useIsMobile from "../../../hooks/useIsMobile";
import { club, kicker } from "../../../theme/clubTheme";
import "../../../theme/clubTable.css";

const { Text } = Typography;

function MyCashInHand() {
    const { token } = theme.useToken();
    const isMobile = useIsMobile(768);

    const { data, isLoading, refetch } = useGetMyCashInHandQuery();
    const [isTransferOpen, setTransferOpen] = useState(false);
    const cash = data?.content;

    const movements = cash?.movements ?? [];
    const totalIn = movements.reduce((sum, m) => sum + (m.in ?? 0), 0);
    const totalOut = movements.reduce((sum, m) => sum + (m.out ?? 0), 0);

    const columns: ColumnsType<CashMovement> = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (date: string) => (date ? dayjs(date).format("DD MMM YYYY") : "—"),
            sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
            defaultSortOrder: "descend",
        },
        {
            title: "Voucher",
            dataIndex: "voucherCode",
            key: "voucherCode",
            responsive: ["md"],
            render: (code: string) => <Text type="secondary">{code}</Text>,
        },
        {
            title: "Details",
            dataIndex: "narration",
            key: "narration",
            render: (narration: string | null) => narration || <Text type="secondary">—</Text>,
        },
        {
            title: "Received",
            dataIndex: "in",
            key: "in",
            align: "right",
            render: (value: number) =>
                value > 0 ? (
                    <span className="brfc-amount brfc-amount--pos">{fmtMoney(value)}</span>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Paid out",
            dataIndex: "out",
            key: "out",
            align: "right",
            render: (value: number) =>
                value > 0 ? (
                    <span className="brfc-amount brfc-amount--neg">{fmtMoney(value)}</span>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
    ];

    if (isLoading) {
        return (
            <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
                <Spin />
            </div>
        );
    }

    // Most members hold no club cash, so this is the ordinary case rather than an error.
    if (!cash?.custodian) {
        return (
            <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
                <div className="brfc-page-header">
                    <AntTitle
                        level={2}
                        style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? 20 : undefined }}
                    >
                        My Cash in Hand
                    </AntTitle>
                </div>
                <div className="brfc-gold-divider" />
                <Empty
                    style={{ marginTop: 48 }}
                    description={
                        <span>
                            You are not holding club cash. This page shows a running balance for
                            members the club has made an accountant.
                        </span>
                    }
                />
            </div>
        );
    }

    return (
        <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
            <div className="brfc-page-header">
                <AntTitle
                    level={2}
                    style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? 20 : undefined }}
                >
                    My Cash in Hand
                </AntTitle>
                <Text type="secondary">
                    {cash.accountName} · {cash.accountCode}
                </Text>
                <Button
                    type="primary"
                    icon={<SwapOutlined />}
                    onClick={() => setTransferOpen(true)}
                    style={{ marginTop: isMobile ? 12 : 0 }}
                >
                    Hand over cash
                </Button>
            </div>
            <div className="brfc-gold-divider" />

            <div style={{ ...kicker, color: club.gold, margin: "18px 0 10px" }}>
                What you are holding
            </div>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <AnalyticsCard
                        title="Cash in Hand"
                        value={cash.balance || 0}
                        accentColor={token.colorPrimary}
                        icon={<WalletOutlined />}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <AnalyticsCard
                        title="Received (recent)"
                        value={totalIn}
                        accentColor={token.colorSuccess}
                        icon={<ArrowDownOutlined />}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <AnalyticsCard
                        title="Paid out (recent)"
                        value={totalOut}
                        accentColor={token.colorError}
                        icon={<ArrowUpOutlined />}
                    />
                </Col>
            </Row>

            <div style={{ ...kicker, color: club.gold, margin: "26px 0 10px" }}>
                Recent movements
            </div>
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                Every collection you took in and every bill you settled. The balance above is what
                you should be able to count.
            </Text>
            <Table
                className="brfc-table"
                rowKey={(row) => `${row.voucherId}-${row.date}-${row.in}-${row.out}`}
                columns={columns}
                dataSource={movements}
                size={isMobile ? "small" : "middle"}
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                scroll={{ x: "max-content" }}
                locale={{
                    emptyText: (
                        <Empty description="Nothing recorded against your account yet" />
                    ),
                }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={isMobile ? 2 : 3}>
                            <Text strong>Shown above</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                            <Text strong>{fmtMoney(totalIn)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                            <Text strong>{fmtMoney(totalOut)}</Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />

            <CashTransferModal
                open={isTransferOpen}
                onClose={() => setTransferOpen(false)}
                onDone={refetch}
            />
        </div>
    );
}

export default MyCashInHand;
