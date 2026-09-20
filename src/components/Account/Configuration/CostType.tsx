import { Button, Popconfirm, Switch, Tooltip, Typography, message } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import ICostType from "../../../interfaces/ICostType";
import {
    useDeleteCostTypeMutation,
    useGetCostTypeListQuery,
    useUpdateCostTypeStatusMutation,
} from "../../../state/features/account/accountSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import CostTypeFormModal from "./CostTypeFormModal";
import "../../../theme/clubTable.css";

const { Text } = Typography;

function CostType() {
    const { data, isLoading } = useGetCostTypeListQuery();
    const [updateCostTypeStatus] = useUpdateCostTypeStatusMutation();
    const [deleteCostType] = useDeleteCostTypeMutation();

    const [costTypes, setCostTypes] = useState<ICostType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    /** The row being edited, or null when the modal is adding a new type. */
    const [editing, setEditing] = useState<ICostType | null>(null);
    /** Id of the row whose status switch is mid-flight, so only that switch shows a spinner. */
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [messageApi, messageContext] = message.useMessage();

    useEffect(() => {
        if (data?.content) {
            const arr = data.content.map((item: ICostType) => ({
                ...item,
                key: item.id,
            }));
            setCostTypes(arr);
        }
    }, [data]);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (record: ICostType) => {
        setEditing(record);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const handleToggleStatus = async (record: ICostType, isActive: boolean) => {
        setTogglingId(record.id);
        try {
            await updateCostTypeStatus({ id: record.id, isActive }).unwrap();
            messageApi.success(
                `${record.name} is now ${isActive ? "active" : "inactive"}`
            );
        } catch (error) {
            messageApi.error(normalizeErrorMessage(error, "Could not change the status"));
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (record: ICostType) => {
        try {
            await deleteCostType(record.id).unwrap();
            messageApi.success(`Deleted ${record.name}`);
        } catch (error) {
            messageApi.error(normalizeErrorMessage(error, "Could not delete the cost type"));
        }
    };

    /** "12 bill payments and 3 monthly costs", leaving out whichever side is zero. */
    const usageSummary = (record: ICostType): string => {
        const parts: string[] = [];
        if (record.billPaymentCount > 0) {
            parts.push(
                `${record.billPaymentCount} bill payment${record.billPaymentCount === 1 ? "" : "s"}`
            );
        }
        if (record.monthlyCostCount > 0) {
            parts.push(
                `${record.monthlyCostCount} monthly cost${record.monthlyCostCount === 1 ? "" : "s"}`
            );
        }
        return parts.join(" and ");
    };

    const costTypeColumns: ColumnsType<ICostType> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (description: string) => (
                <Text type="secondary">{description}</Text>
            ),
        },
        {
            title: "Expense Account",
            dataIndex: "chartName",
            key: "chartName",
            render: (chartName: string) =>
                chartName ? (
                    <span className="brfc-chip">{chartName}</span>
                ) : (
                    <Text type="secondary">—</Text>
                ),
            sorter: (a, b) => (a.chartName ?? "").localeCompare(b.chartName ?? ""),
        },
        {
            title: "In Use",
            dataIndex: "inUse",
            key: "inUse",
            render: (_: any, record: ICostType) => (
                <span
                    className={`brfc-status brfc-status--${record.inUse ? "gold" : "neutral"}`}
                >
                    <span className="brfc-status__dot" />
                    {record.inUse ? usageSummary(record) : "Unused"}
                </span>
            ),
            sorter: (a, b) => Number(a.inUse) - Number(b.inUse),
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            render: (_: any, record: ICostType) => (
                <Switch
                    size="small"
                    checked={record.isActive}
                    loading={togglingId === record.id}
                    onChange={(checked) => handleToggleStatus(record, checked)}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                />
            ),
            sorter: (a, b) => Number(a.isActive) - Number(b.isActive),
        },
        {
            title: "",
            key: "actions",
            align: "right",
            render: (_: any, record: ICostType) => (
                <>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(record)}
                    >
                        Edit
                    </Button>
                    {/* A type already recorded against cannot be removed without orphaning that
                        spending, so the button explains the switch above is the way to retire it
                        rather than letting the user find out from a server error. */}
                    <Tooltip
                        title={
                            record.inUse
                                ? "Already used by a payment or a monthly cost. Switch it to inactive to keep it off new entries."
                                : undefined
                        }
                    >
                        {/* The span is what the tooltip hangs off: a disabled antd button swallows
                            mouse events, so hovering the button itself shows nothing. */}
                        <span style={{ display: "inline-block" }}>
                            <Popconfirm
                                title={`Delete ${record.name}?`}
                                description="This cannot be undone."
                                okText="Delete"
                                okButtonProps={{ danger: true }}
                                cancelText="Cancel"
                                disabled={record.inUse}
                                onConfirm={() => handleDelete(record)}
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    disabled={record.inUse}
                                    icon={<DeleteOutlined />}
                                >
                                    Delete
                                </Button>
                            </Popconfirm>
                        </span>
                    </Tooltip>
                </>
            ),
        },
    ];

    return (
        <div className="brfc-page">
            {messageContext}

            {/* Page header */}
            <div
                className="brfc-page-header"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>
                    Cost Types
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    Add Cost Type
                </Button>
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={isLoading}
                size="small"
                rowKey="id"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                dataSource={costTypes}
                columns={costTypeColumns}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                }}
                scroll={{ x: "max-content" }}
            />

            {/* The table refreshes itself: saving invalidates the `costType` tag. */}
            <CostTypeFormModal
                open={modalOpen}
                editing={editing}
                onClose={closeModal}
            />
        </div>
    );
}

export default CostType;
