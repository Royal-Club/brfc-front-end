import {
    Alert,
    Button,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Switch,
    Tooltip,
    Typography,
    message,
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import ICostType from "../../../interfaces/ICostType";
import {
    useCreateCostTypeMutation,
    useDeleteCostTypeMutation,
    useGetAcChartListQuery,
    useGetCostTypeListQuery,
    useUpdateCostTypeMutation,
    useUpdateCostTypeStatusMutation,
} from "../../../state/features/account/accountSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import "../../../theme/clubTable.css";

const { Text } = Typography;

/** Form shape. `chartId` only holds a number once an account has actually been picked. */
interface CostTypeFormValues {
    name: string;
    description: string;
    chartId: number;
}

function CostType() {
    const { data, isLoading } = useGetCostTypeListQuery();
    const { data: chartData } = useGetAcChartListQuery();
    const [createCostType, { isLoading: isCreating }] = useCreateCostTypeMutation();
    const [updateCostType, { isLoading: isUpdating }] = useUpdateCostTypeMutation();
    const [updateCostTypeStatus] = useUpdateCostTypeStatusMutation();
    const [deleteCostType] = useDeleteCostTypeMutation();

    const [costTypes, setCostTypes] = useState<ICostType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    /** The row being edited, or null when the modal is adding a new type. */
    const [editing, setEditing] = useState<ICostType | null>(null);
    /** Id of the row whose status switch is mid-flight, so only that switch shows a spinner. */
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [form] = Form.useForm<CostTypeFormValues>();
    const [messageApi, messageContext] = message.useMessage();
    /** Watched so the rename warning appears as soon as the name actually differs. */
    const typedName = Form.useWatch("name", form);

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
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record: ICostType) => {
        setEditing(record);
        form.setFieldsValue({
            name: record.name,
            description: record.description,
            chartId: record.chartId,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        let values: CostTypeFormValues;
        try {
            values = await form.validateFields();
        } catch {
            return; // Field-level errors are already shown against the inputs.
        }

        // The server uppercases the name anyway; doing it here too means the success message and
        // the row that appears afterwards agree with each other.
        const body = {
            name: values.name.trim().toUpperCase(),
            description: values.description.trim(),
            chartId: values.chartId,
        };

        try {
            if (editing) {
                await updateCostType({ id: editing.id, data: body }).unwrap();
                messageApi.success(`Updated ${body.name}`);
            } else {
                await createCostType(body).unwrap();
                messageApi.success(`Created ${body.name}`);
            }
            closeModal();
        } catch (error) {
            // Keeps the modal open with the user's input intact so they can correct it rather
            // than retyping — a duplicate name comes back here as a conflict.
            messageApi.error(normalizeErrorMessage(error, "Could not save the cost type"));
        }
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

    // Compared against the normalised name the server would store, so merely retyping the same
    // name in a different case does not raise a warning about rewriting history.
    const isRenaming =
        editing !== null &&
        typeof typedName === "string" &&
        typedName.trim().length > 0 &&
        typedName.trim().toUpperCase() !== editing.name;

    // Spending is filed against expense accounts, so those are the only sensible options. Any
    // other nature is left out rather than offered and then rejected by the ledger later.
    //
    // Compared as an upper-cased string rather than against AcNatureType: the server sends the
    // enum's key ("EXPENSE") while the enum's value is the display label ("Expense"), so matching
    // the enum member directly never holds. This accepts either spelling.
    const chartOptions = (chartData?.content ?? [])
        .filter((chart) => String(chart.nature?.type).toUpperCase() === "EXPENSE")
        .map((chart) => ({
            value: chart.id,
            label: `${chart.code} — ${chart.name}`,
        }));

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

            <Modal
                title={editing ? `Edit ${editing.name}` : "Add Cost Type"}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={closeModal}
                okText={editing ? "Save" : "Create"}
                confirmLoading={isCreating || isUpdating}
                destroyOnClose
            >
                <Form form={form} layout="vertical" preserve={false}>
                    {/* Renaming is allowed for a type in use -- payments reference it by id, so
                        nothing orphans -- but it re-labels every record already filed under it.
                        That is right for fixing a wrong name and wrong for repurposing the
                        category, so the difference is spelled out before the save rather than
                        discovered in a report afterwards. */}
                    {editing?.inUse && (
                        <Alert
                            type={isRenaming ? "warning" : "info"}
                            showIcon
                            style={{ marginBottom: 16 }}
                            message={
                                isRenaming
                                    ? `Renaming will re-label ${usageSummary(editing)}`
                                    : `${usageSummary(editing)} are filed under this type`
                            }
                            description={
                                isRenaming
                                    ? "They reference this type by id, so they will all read as the new name, including in past reports. That is what you want for correcting a wrong name. If instead you want this category to mean something different from now on, cancel — deactivate this type and create a new one, so the old entries keep their original label."
                                    : undefined
                            }
                        />
                    )}

                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Name is required" }]}
                        extra="Stored in upper case, matching FIELD_RENT and FOOD. Must be unique."
                    >
                        <Input placeholder="e.g. TOURNAMENT_FEE" />
                    </Form.Item>

                    <Form.Item
                        label="Expense account"
                        name="chartId"
                        rules={[{ required: true, message: "Expense account is required" }]}
                        extra="The account spending under this type posts to."
                    >
                        <Select
                            placeholder="Select an expense account"
                            options={chartOptions}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: "Description is required" }]}
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="e.g. Entry fees paid to enter the club into a tournament."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default CostType;
