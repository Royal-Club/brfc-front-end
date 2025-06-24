import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IBalanceSheetReport from "../../../interfaces/IBalanceSheetReport";
import { useGetAcBalanceSheetListQuery } from "../../../state/features/account/accountSlice";

function AccountBalanceSheet() {
    const { data, isLoading, refetch } = useGetAcBalanceSheetListQuery();
    const [balanceSheet, setBalanceSheet] = useState<IBalanceSheetReport[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (data) {
            const arr = data.content.map((item: IBalanceSheetReport) => ({
                ...item,
                key: item.natureType, // Setting a unique key for each nature type
            }));
            setBalanceSheet(arr);
        }
    }, [data]);

    // Table rendering settings
    const balanceSheetColumns: ColumnsType<IBalanceSheetReport> = [
        {
            title: "Nature Type",
            dataIndex: "natureType",
            key: "natureType",
        },
        {
            title: "Total Debit",
            dataIndex: "totalDebit",
            key: "totalDebit",
            render: (value: number) => value.toFixed(2), // Formatting the number
        },
        {
            title: "Total Credit",
            dataIndex: "totalCredit",
            key: "totalCredit",
            render: (value: number) => value.toFixed(2), // Formatting the number
        },
        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",
            render: (value: number) => value.toFixed(2), // Formatting the number
        },
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', minHeight: '100vh' }}>
            <Row>
                <Col span={24}>
                    <div>
                        <Title level={3} style={{ fontSize: isMobile ? '18px' : '24px' }}>Balance Sheet</Title>
                        <Table
                            loading={isLoading}
                            size={isMobile ? "small" : "middle"}
                            dataSource={balanceSheet}
                            columns={balanceSheetColumns}
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                                showSizeChanger: !isMobile,
                                showQuickJumper: !isMobile,
                                size: isMobile ? "small" : "default",
                            }}
                            scroll={{ 
                                x: isMobile ? 600 : "max-content",
                                y: isMobile ? "60vh" : undefined
                            }}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default AccountBalanceSheet;
