import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IBalanceSheetReport from "../../../interfaces/IBalanceSheetReport";
import { useGetAcBalanceSheetListQuery } from "../../../state/features/account/accountSlice";
import { amountCell, natureTone } from "../../../utils/acFormat";
import "../../../theme/clubTable.css";

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
        },
        {
            title: "Total Credit",
            dataIndex: "totalCredit",
            key: "totalCredit",
            align: "right",
            render: (value: number) => amountCell(value),
        },
        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",
            align: "right",
            render: (value: number) => amountCell(value, true),
        },
    ];

    return (
        <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? "20px" : undefined }}>
                    Balance Sheet
                </Title>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size={isMobile ? "small" : "middle"}
                rowKey="natureType"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
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
                    y: isMobile ? "60vh" : undefined,
                }}
            />
        </div>
    );
}

export default AccountBalanceSheet;
