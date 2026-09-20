import { Alert, Form, Input, Modal, Select, message } from "antd";
import ICostType from "../../../interfaces/ICostType";
import {
    useCreateCostTypeMutation,
    useGetAcChartListQuery,
    useUpdateCostTypeMutation,
} from "../../../state/features/account/accountSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";

/** Form shape. `chartId` only holds a number once an account has actually been picked. */
interface CostTypeFormValues {
    name: string;
    description: string;
    chartId: number;
}

interface CostTypeFormModalProps {
    open: boolean;
    /** The type being edited, or null to create a new one. */
    editing: ICostType | null;
    onClose: () => void;
    /**
     * Called with the saved type once the server has accepted it. The bill payment screen uses
     * this to select the type it just created; the configuration screen ignores it and lets the
     * invalidated `costType` tag refresh its table.
     */
    onSaved?: (costType: ICostType) => void;
}

/**
 * The add/edit form for a cost type, shared by the Cost Types screen and by the bill payment
 * form, which opens it when the type a payment needs does not exist yet.
 *
 * <p>Kept in one place so the name normalising, the expense account filter and the warning about
 * renaming a type that history is already filed under cannot drift apart between the two.
 */
function CostTypeFormModal({
    open,
    editing,
    onClose,
    onSaved,
}: CostTypeFormModalProps) {
    const { data: chartData } = useGetAcChartListQuery();
    const [createCostType, { isLoading: isCreating }] = useCreateCostTypeMutation();
    const [updateCostType, { isLoading: isUpdating }] = useUpdateCostTypeMutation();

    const [form] = Form.useForm<CostTypeFormValues>();
    const [messageApi, messageContext] = message.useMessage();
    /** Watched so the rename warning appears as soon as the name actually differs. */
    const typedName = Form.useWatch("name", form);

    // Compared against the normalised name the server would store, so merely retyping the same
    // name in a different case does not raise a warning about rewriting history.
    const isRenaming =
        editing !== null &&
        typeof typedName === "string" &&
        typedName.trim().length > 0 &&
        typedName.trim().toUpperCase() !== editing.name;

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
                const updated = await updateCostType({
                    id: editing.id,
                    data: body,
                }).unwrap();
                messageApi.success(`Updated ${body.name}`);
                onSaved?.(updated.content);
            } else {
                const created = await createCostType(body).unwrap();
                messageApi.success(`Created ${body.name}`);
                onSaved?.(created.content);
            }
            form.resetFields();
            onClose();
        } catch (error) {
            // Keeps the modal open with the user's input intact so they can correct it rather
            // than retyping — a duplicate name comes back here as a conflict.
            messageApi.error(normalizeErrorMessage(error, "Could not save the cost type"));
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <>
            {messageContext}
            <Modal
                title={editing ? `Edit ${editing.name}` : "Add Cost Type"}
                open={open}
                onOk={handleSubmit}
                onCancel={handleCancel}
                okText={editing ? "Save" : "Create"}
                confirmLoading={isCreating || isUpdating}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    preserve={false}
                    initialValues={
                        editing
                            ? {
                                  name: editing.name,
                                  description: editing.description,
                                  chartId: editing.chartId,
                              }
                            : undefined
                    }
                >
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
        </>
    );
}

export default CostTypeFormModal;
