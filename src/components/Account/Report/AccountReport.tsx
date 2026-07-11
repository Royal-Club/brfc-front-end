import { Typography } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAccountsReport from "../../../interfaces/IAccountsReport";
import { useGetAcReportListQuery } from "../../../state/features/account/accountSlice";
import { amountCell } from "../../../utils/acFormat";
import "../../../theme/clubTable.css";

const { Text } = Typography;

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
            render: (code: string | number) => <span className="brfc-chip">{code}</span>,
        },
        {
            title: "Account Name",
            dataIndex: "accountName",
            key: "accountName",
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.accountName.localeCompare(b.accountName),
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Total Debit",
            dataIndex: "totalDebit",
            key: "totalDebit",
            align: "right",
            render: (value: number) => amountCell(value),
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.totalDebit - b.totalDebit,
        },
        {
            title: "Total Credit",
            dataIndex: "totalCredit",
            key: "totalCredit",
            align: "right",
            render: (value: number) => amountCell(value),
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.totalCredit - b.totalCredit,
        },
        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",
            align: "right",
            render: (value: number) => amountCell(value, true),
            sorter: (a: IAccountsReport, b: IAccountsReport) =>
                a.balance - b.balance,
        },
    ];

    return (
        <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? "20px" : undefined }}>
                    Accounts Report
                </Title>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size={isMobile ? "small" : "middle"}
                rowKey="accountId"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                dataSource={accountsReport}
                columns={accountsReportColumns}
                scroll={{
                    x: isMobile ? 600 : "max-content",
                    y: isMobile ? "60vh" : undefined,
                }}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                    showSizeChanger: !isMobile,
                    showQuickJumper: !isMobile,
                    size: isMobile ? "small" : "default",
                }}
            />
        </div>
    );
}

export default AccountsReport;
