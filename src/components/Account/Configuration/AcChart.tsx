import { Button, Form, Input, Modal, Select, Typography, message } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import IAcChart from "../../../interfaces/IAcChart";
import { AcNatureType } from "../../Enum/AcNatureType";
import {
    useCreateAcChartMutation,
    useGetAcChartListQuery,
    useGetAcNatureListQuery,
    useUpdateAcChartMutation,
} from "../../../state/features/account/accountSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
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

/** Form shape. Kept separate from `AcChartRequest` because the form holds ids as numbers only
 *  once a selection is made, and parent stays undefined for a top-level account. */
interface ChartFormValues {
    name: string;
    code: string;
    description: string;
    natureId: number;
    parentId?: number;
}

function AcChart() {
    const { data, isLoading } = useGetAcChartListQuery();
    const { data: natureData } = useGetAcNatureListQuery();
    const [createAcChart, { isLoading: isCreating }] = useCreateAcChartMutation();
    const [updateAcChart, { isLoading: isUpdating }] = useUpdateAcChartMutation();

    const [acCharts, setAcCharts] = useState<IAcChart[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    /** The row being edited, or null when the modal is adding a new account. */
    const [editing, setEditing] = useState<IAcChart | null>(null);
    const [form] = Form.useForm<ChartFormValues>();
    const [messageApi, messageContext] = message.useMessage();

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

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record: IAcChart) => {
        setEditing(record);
        form.setFieldsValue({
            name: record.name,
            code: String(record.code),
            description: record.description,
            natureId: record.nature?.id ?? record.natureNo,
            // `parentNo` is the id the server round-trips; a top-level account has none.
            parentId: record.parent?.id ?? record.parentNo ?? undefined,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        let values: ChartFormValues;
        try {
            values = await form.validateFields();
        } catch {
            return; // Field-level errors are already shown against the inputs.
        }

        const body = {
            name: values.name.trim(),
            code: values.code.trim(),
            description: values.description?.trim(),
            natureId: values.natureId,
            // Send null rather than omitting, so clearing a parent actually detaches the account.
            parentId: values.parentId ?? null,
        };

        try {
            if (editing) {
                await updateAcChart({ id: editing.id, data: body }).unwrap();
                messageApi.success(`Updated ${body.name}`);
            } else {
                await createAcChart(body).unwrap();
                messageApi.success(`Created ${body.name}`);
            }
            closeModal();
        } catch (error) {
            // The API slice already raises a toast for the failure; this keeps the modal open with
            // the user's input intact so they can correct it rather than retyping.
            messageApi.error(normalizeErrorMessage(error, "Could not save the account"));
        }
    };

    // A chart cannot be its own parent, and the list is the only source of parent options.
    const parentOptions = acCharts
        .filter((chart) => chart.id !== editing?.id)
        .map((chart) => ({
            value: chart.id,
            label: `${chart.code} — ${chart.name}`,
        }));

    const natureOptions = (natureData?.content ?? []).map((nature) => ({
        value: nature.id,
        label: `${nature.name} (${getEnumValue(nature.type)})`,
    }));

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
        {
            title: "",
            key: "actions",
            align: "right",
            render: (_: any, record: IAcChart) => (
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                >
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <div className="brfc-page">
            {messageContext}

            {/* Page header */}
            <div
                className="brfc-page-header"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
            >
                <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>Chart of Accounts</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    Add Account
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
                dataSource={acCharts}
                columns={acChartColumns}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                }}
                scroll={{ x: "max-content" }}
            />

            <Modal
                title={editing ? `Edit ${editing.name}` : "Add Account"}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={closeModal}
                okText={editing ? "Save" : "Create"}
                confirmLoading={isCreating || isUpdating}
                destroyOnClose
            >
                <Form form={form} layout="vertical" preserve={false}>
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Name is required" }]}
                    >
                        <Input placeholder="e.g. Cash on Hand (Kasem)" />
                    </Form.Item>

                    <Form.Item
                        label="Code"
                        name="code"
                        rules={[{ required: true, message: "Code is required" }]}
                        extra="Follow the existing pattern, e.g. 1100-001-003 for another cash account."
                    >
                        <Input placeholder="e.g. 1100-001-003" />
                    </Form.Item>

                    <Form.Item
                        label="Nature"
                        name="natureId"
                        rules={[{ required: true, message: "Nature is required" }]}
                    >
                        <Select
                            placeholder="Select a nature"
                            options={natureOptions}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Parent account"
                        name="parentId"
                        extra="Leave empty for a top-level account. A cash account usually sits under Current Assets."
                    >
                        <Select
                            placeholder="Select a parent account"
                            options={parentOptions}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    {/* Required and unique in the database, though the API does not say so: a blank
                        or repeated description fails the insert rather than being rejected politely. */}
                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: "Description is required" }]}
                        extra="Must be unique — no two accounts can share the same description."
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="e.g. Cash physically available with Kasem for daily operations."
                        />
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
}

export default AcChart;
