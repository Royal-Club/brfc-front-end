import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import { useGetAcBalanceSummaryListQuery } from "../../../state/features/account/accountSlice";
import IAccountBalanceSummary from "../../../interfaces/IAccountBalanceSummary";
import { amountCell, natureTone } from "../../../utils/acFormat";
import "../../../theme/clubTable.css";

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
            render: (type: string) => (
                <span className={`brfc-status brfc-status--${natureTone(type)}`}>
                    <span className="brfc-status__dot" />
                    {type}
                </span>
            ),
        },
        {
            title: "Total Debit",
            dataIndex: "totalDebit",
            key: "totalDebit",
            align: "right",
            render: (value: number) => amountCell(value),
            sorter: (a: IAccountBalanceSummary, b: IAccountBalanceSummary) =>
                a.totalDebit - b.totalDebit,
        },
        {
            title: "Total Credit",
            dataIndex: "totalCredit",
            key: "totalCredit",
            align: "right",
            render: (value: number) => amountCell(value),
            sorter: (a: IAccountBalanceSummary, b: IAccountBalanceSummary) =>
                a.totalCredit - b.totalCredit,
        },
        {
            title: "Net Balance",
            dataIndex: "netBalance",
            key: "netBalance",
            align: "right",
            render: (value: number) => amountCell(value, true),
            sorter: (a: IAccountBalanceSummary, b: IAccountBalanceSummary) =>
                a.netBalance - b.netBalance,
        },
    ];

    if (error) {
        return <div style={{ padding: isMobile ? '16px' : '24px' }}>Failed to load account summary</div>;
    }

    return (
        <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? "20px" : undefined }}>
                    Account Balances Summary
                </Title>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size={isMobile ? "small" : "middle"}
                rowKey={(record) => record.accountType}
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
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
                    y: isMobile ? "60vh" : undefined,
                }}
            />
        </div>
    );
}

export default AccountBalanceSummary;
