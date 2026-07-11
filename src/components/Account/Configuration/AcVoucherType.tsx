import { Typography } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAcVoucherType from "../../../interfaces/IAcVoucherType";
import { useGetAcVoucherTypeListQuery } from "../../../state/features/account/accountSlice";
import "../../../theme/clubTable.css";

const { Text } = Typography;

function AcVoucherType() {
    const { data, isLoading } = useGetAcVoucherTypeListQuery();

    const [acVoucherTypes, setAcVoucherTypes] = useState<IAcVoucherType[]>([]);

    useEffect(() => {
        if (data?.content) {
            const arr = data.content.map((item: IAcVoucherType) => ({
                ...item,
                key: item.id,
            }));
            setAcVoucherTypes(arr);
        }
    }, [data]);

    // table rendering settings
    const acVoucherTypeColumns: ColumnsType<IAcVoucherType> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Alias",
            dataIndex: "alias",
            key: "alias",
            render: (alias: string) =>
                alias ? <span className="brfc-chip">{alias}</span> : <Text type="secondary">—</Text>,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (description: string) => <Text type="secondary">{description || "—"}</Text>,
        },
        {
            title: "Default",
            dataIndex: "default",
            key: "default",
            align: "center",
            width: 120,
            render: (_: any, record: IAcVoucherType) =>
                record.default ? (
                    <span className="brfc-status brfc-status--gold">
                        <span className="brfc-status__dot" />
                        Default
                    </span>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
    ];

    return (
        <div className="brfc-page">
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>Voucher Types</Title>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size="small"
                rowKey="id"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                }}
                dataSource={acVoucherTypes}
                columns={acVoucherTypeColumns}
                scroll={{ x: "max-content" }}
            />
        </div>
    );
}

export default AcVoucherType;
