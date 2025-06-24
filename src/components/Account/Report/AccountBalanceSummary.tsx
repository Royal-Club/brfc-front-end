import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import { useGetAcBalanceSummaryListQuery } from "../../../state/features/account/accountSlice";
import IAccountBalanceSummary from "../../../interfaces/IAccountBalanceSummary";

function AccountBalanceSummary() {
    const { data, error, isLoading, refetch } = useGetAcBalanceSummaryListQuery();
    const [accountSummary, setAccountSummary] = useState<IAccountBalanceSummary[]>([]);
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
        refetch();
    }, []);

    // useEffect to handle side effects and data transformations
    useEffect(() => {
        if (data?.content) {
            const transformedData = data.content.map(
                (item: IAccountBalanceSummary) => ({
                    ...item,
                    key: item.accountType, // Adding key for each record, if necessary
                })
            );
            setAccountSummary(transformedData);
        }
    }, [data]); // Trigger when data changes

    // Table columns for the account balances summary
    const accountSummaryColumns: ColumnsType<IAccountBalanceSummary> = [
        {
            title: "Account Type",
            dataIndex: "accountType",
            key: "accountType",
        },
        {
            title: "Total Debit",
            dataIndex: "totalDebit",
            key: "totalDebit",
            render: (value: number) => value.toFixed(2), // Formatting the number
            sorter: (a: IAccountBalanceSummary, b: IAccountBalanceSummary) =>
                a.totalDebit - b.totalDebit,
        },
        {
            title: "Total Credit",
            dataIndex: "totalCredit",
            key: "totalCredit",
            render: (value: number) => value.toFixed(2), // Formatting the number
            sorter: (a: IAccountBalanceSummary, b: IAccountBalanceSummary) =>
                a.totalCredit - b.totalCredit,
        },
        {
            title: "Net Balance",
            dataIndex: "netBalance",
            key: "netBalance",
            render: (value: number) => value.toFixed(2), // Formatting the number
            sorter: (a: IAccountBalanceSummary, b: IAccountBalanceSummary) =>
                a.netBalance - b.netBalance,
        },
    ];

    // Return loading or error state
    if (isLoading) {
        return <div style={{ padding: isMobile ? '16px' : '24px' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ padding: isMobile ? '16px' : '24px' }}>Failed to load account summary</div>;
    }

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', minHeight: '100vh' }}>
            <Row>
                <Col span={24}>
                    <div>
                        <Title level={3} style={{ fontSize: isMobile ? '18px' : '24px' }}>Account Balances Summary</Title>
                        <Table
                            loading={isLoading}
                            size={isMobile ? "small" : "middle"}
                            dataSource={accountSummary}
                            columns={accountSummaryColumns}
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
                            rowKey={(record) => record.accountType}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default AccountBalanceSummary;
