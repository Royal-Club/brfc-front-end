import { Typography } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAcNature from "../../../interfaces/IAcNature";
import { AcNatureType } from "../../Enum/AcNatureType";
import { useGetAcNatureListQuery } from "../../../state/features/account/accountSlice";
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

function AcNature() {
    const { data, isLoading } = useGetAcNatureListQuery();
    const [acNatures, setAcNatures] = useState<IAcNature[]>([]);

    useEffect(() => {
        if (data?.content) {
            const arr = data.content.map((item: IAcNature) => ({
                ...item,
                key: item.id,
            }));
            setAcNatures(arr);
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
    const acNatureColumns: ColumnsType<IAcNature> = [
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
            sorter: (a, b) => a.code - b.code,
            render: (code: number) => <span className="brfc-chip">{code}</span>,
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (_: any, record: IAcNature) => (
                <span className={`brfc-status brfc-status--${NATURE_TONE[record.type] || "neutral"}`}>
                    <span className="brfc-status__dot" />
                    {getEnumValue(record.type)}
                </span>
            ),
            sorter: (a, b) => a.type.localeCompare(b.type),
        },
    ];

    return (
        <div className="brfc-page">
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>Account Natures</Title>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size="small"
                rowKey="id"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                dataSource={acNatures}
                columns={acNatureColumns}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                }}
                scroll={{ x: "max-content" }}
            />
        </div>
    );
}

export default AcNature;
