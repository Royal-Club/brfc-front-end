import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAccountsReport from "../../../interfaces/IAccountsReport";
import { useGetAcReportListQuery } from "../../../state/features/account/accountSlice";

function AccountsReport() {
    const { data, isLoading, refetch } = useGetAcReportListQuery();
    const [accountsReport, setAccountsReport] = useState<IAccountsReport[]>([]);
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
            const arr = data.content.map((item: IAccountsReport) => ({
                ...item,
                key: item.accountId, // Setting a unique key for each item
            }));
            setAccountsReport(arr);
        }
    }, [data]);

    // table rendering settings
    const accountsReportColumns: ColumnsType<IAccountsReport> = [
        {
            title: "Account Code",
            dataIndex: "accountCode",
            key: "accountCode",
        },
        {
            title: "Account Name",
            dataIndex: "accountName",
            key: "accountName",
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.accountName.localeCompare(b.accountName),
        },
        {
            title: "Total Debit",
            dataIndex: "totalDebit",
            key: "totalDebit",
            render: (value: number) => value.toFixed(2), // Formatting the number
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.totalDebit - b.totalDebit,
        },
        {
            title: "Total Credit",
            dataIndex: "totalCredit",
            key: "totalCredit",
            render: (value: number) => value.toFixed(2), // Formatting the number
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.totalCredit - b.totalCredit,
        },
        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",
            render: (value: number) => value.toFixed(2), // Formatting the number
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.balance - b.balance,
        },
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', minHeight: '100vh' }}>
            <Row>
                <Col span={24}>
                    <div>
                        <Title level={3} style={{ fontSize: isMobile ? '18px' : '24px' }}>Accounts Report</Title>
                        <Table
                            loading={isLoading}
                            size={isMobile ? "small" : "middle"}
                            dataSource={accountsReport}
                            columns={accountsReportColumns}
                            scroll={{ 
                                x: isMobile ? 600 : "max-content",
                                y: isMobile ? "60vh" : undefined
                            }}
                            pagination={{
                                showSizeChanger: !isMobile,
                                showQuickJumper: !isMobile,
                                size: isMobile ? "small" : "default",
                            }}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default AccountsReport;
