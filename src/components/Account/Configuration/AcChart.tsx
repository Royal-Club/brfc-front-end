import { Typography } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAcChart from "../../../interfaces/IAcChart";
import { AcNatureType } from "../../Enum/AcNatureType";
import { useGetAcChartListQuery } from "../../../state/features/account/accountSlice";
import "../../../theme/clubTable.css";

const { Text } = Typography;

// Accounting natures mapped to pill tones: income = green, expense = red,
// asset = gold, liability = neutral.
const NATURE_TONE: Record<string, string> = {
    INCOME: "active",
    EXPENSE: "inactive",
    ASSET: "gold",
    LIABILITY: "neutral",
};

function AcChart() {
    const { data, isLoading } = useGetAcChartListQuery();
    const [acCharts, setAcCharts] = useState<IAcChart[]>([]);

    useEffect(() => {
        if (data?.content) {
            const arr = data.content.map((item: IAcChart) => ({
                ...item,
                key: item.id,
            }));
            setAcCharts(arr);
        }
    }, [data]);

    const getEnumValue = (type: string): string => {
        switch (type) {
            case "ASSET":
                return AcNatureType.ASSET;
            case "LIABILITY":
                return AcNatureType.LIABILITY;
            case "INCOME":
                return AcNatureType.INCOME;
            case "EXPENSE":
                return AcNatureType.EXPENSE;
            default:
                return type; // Fallback to the original type if not found in enum
        }
    };

    // table rendering settings
    const acChartColumns: ColumnsType<IAcChart> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            render: (code: number | string) => <span className="brfc-chip">{code}</span>,
        },
        {
            title: "Nature",
            dataIndex: "nature.name",
            key: "nature.name",
            render: (_: any, record: IAcChart) => <Text type="secondary">{record.nature.name}</Text>,
            sorter: (a, b) => a.nature.name.localeCompare(b.nature.name),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (_: any, record: IAcChart) => (
                <span className={`brfc-status brfc-status--${NATURE_TONE[record.nature.type] || "neutral"}`}>
                    <span className="brfc-status__dot" />
                    {getEnumValue(record.nature.type)}
                </span>
            ),
            sorter: (a, b) =>
                getEnumValue(a.nature.type).localeCompare(
                    getEnumValue(b.nature.type)
                ),
        },
    ];

    return (
        <div className="brfc-page">
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>Chart of Accounts</Title>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size="small"
                rowKey="id"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                dataSource={acCharts}
                columns={acChartColumns}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                }}
                scroll={{ x: "max-content" }}
            />
        </div>
    );
}

export default AcChart;
