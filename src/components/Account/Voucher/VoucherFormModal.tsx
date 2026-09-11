import { useMemo, useState } from "react";
import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Typography,
    message,
    theme,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import axiosApi from "../../../state/api/axiosBase";
import { API_URL } from "../../../settings";
import {
    useGetAcChartListQuery,
    useGetAcVoucherTypeListQuery,
} from "../../../state/features/account/accountSlice";
import { fmtMoney } from "../../../utils/acFormat";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import { postableLines, voucherBalance } from "../../../utils/voucherBalance";

const { Text } = Typography;

/** One side of the entry as the form holds it. A line carries either a debit or a credit. */
interface DetailLine {
    acChartId?: number;
    dr?: number;
    cr?: number;
    narration?: string;
}

interface VoucherFormValues {
    voucherDate: Dayjs;
    voucherTypeId: number;
    narration?: string;
    details: DetailLine[];
}

interface VoucherFormModalProps {
    open: boolean;
    onClose: () => void;
    /** Called after a successful save so the register can refresh itself. */
    onSaved: () => void;
}

/** Two empty lines, because the smallest real entry has one debit and one credit. */
const EMPTY_LINES: DetailLine[] = [{}, {}];

/**
 * Records a voucher as the API actually accepts it: a date, a type, and a list of debit/credit
 * lines that must balance.
 *
 * <p>The screen this replaces posted a player id and a single amount, which the endpoint has no
 * field for, so every submission failed validation and the error was swallowed. Entering both sides
 * explicitly is also what makes a cash handover recordable at all - it is an ordinary transfer
 * voucher, debiting the custodian who received the money and crediting the one who gave it up.
 */
function VoucherFormModal({ open, onClose, onSaved }: VoucherFormModalProps) {
    const { token } = theme.useToken();
    const [form] = Form.useForm<VoucherFormValues>();
    const [messageApi, messageContext] = message.useMessage();
    const [submitting, setSubmitting] = useState(false);

    const { data: chartData } = useGetAcChartListQuery();
    const { data: voucherTypeData } = useGetAcVoucherTypeListQuery();

    // Watched so the running totals below recompute as the user types.
    const details = Form.useWatch("details", form) as DetailLine[] | undefined;

    const chartOptions = useMemo(
        () =>
            (chartData?.content ?? []).map((chart) => ({
                value: chart.id,
                label: `${chart.code} — ${chart.name}`,
            })),
        [chartData]
    );

    const voucherTypeOptions = useMemo(
        () =>
            (voucherTypeData?.content ?? []).map((type) => ({
                value: type.id,
                label: `${type.name} (${type.alias})`,
            })),
        [voucherTypeData]
    );

    const totals = useMemo(() => voucherBalance(details), [details]);
    const isBalanced = totals.isBalanced;

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        let values: VoucherFormValues;
        try {
            values = await form.validateFields();
        } catch {
            return; // Field errors are already rendered against the inputs.
        }

        const lines = postableLines(values.details);

        if (lines.length < 2) {
            messageApi.error("A voucher needs at least one debit line and one credit line.");
            return;
        }
        if (!isBalanced) {
            messageApi.error(
                `Debits and credits must match. Currently off by ${fmtMoney(Math.abs(totals.difference))}.`
            );
            return;
        }

        const body = {
            voucherDate: values.voucherDate.format("YYYY-MM-DD"),
            voucherTypeId: values.voucherTypeId,
            narration: values.narration?.trim() || undefined,
            postFlag: true,
            details: lines.map((line) => ({
                acChartId: line.acChartId,
                dr: Number(line.dr) || 0,
                cr: Number(line.cr) || 0,
                narration: line.narration?.trim() || undefined,
            })),
        };

        setSubmitting(true);
        try {
            await axiosApi.post(`${API_URL}/ac/vouchers`, body);
            messageApi.success("Voucher saved");
            form.resetFields();
            onSaved();
            onClose();
        } catch (error) {
            // The old screen logged this to the console and left the user staring at a modal that
            // silently did nothing. Surface whatever the server said instead.
            messageApi.error(normalizeErrorMessage(error, "Could not save the voucher"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="New Voucher"
            open={open}
            onOk={handleSubmit}
            onCancel={handleClose}
            okText="Save"
            confirmLoading={submitting}
            okButtonProps={{ disabled: !isBalanced }}
            width={860}
            destroyOnClose
        >
            {messageContext}

            <Form
                form={form}
                layout="vertical"
                preserve={false}
                initialValues={{ voucherDate: dayjs(), details: EMPTY_LINES }}
            >
                <Row gutter={12}>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Date"
                            name="voucherDate"
                            rules={[{ required: true, message: "Date is required" }]}
                        >
                            <DatePicker style={{ width: "100%" }} format="DD-MMM-YYYY" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                        <Form.Item
                            label="Voucher type"
                            name="voucherTypeId"
                            rules={[{ required: true, message: "Voucher type is required" }]}
                        >
                            <Select
                                placeholder="Select a type"
                                options={voucherTypeOptions}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Narration" name="narration">
                    <Input placeholder="What this voucher records, e.g. Cash handover from Rakib to Kasem" />
                </Form.Item>

                <Form.List name="details">
                    {(fields, { add, remove }) => (
                        <>
                            <div style={{ marginBottom: 8 }}>
                                <Text strong>Entry lines</Text>
                            </div>

                            {fields.map(({ key, name, ...rest }) => (
                                <Row gutter={8} key={key} align="top" style={{ marginBottom: 4 }}>
                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            {...rest}
                                            name={[name, "acChartId"]}
                                            rules={[{ required: true, message: "Pick an account" }]}
                                        >
                                            <Select
                                                placeholder="Account"
                                                options={chartOptions}
                                                showSearch
                                                optionFilterProp="label"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={12} sm={4}>
                                        <Form.Item {...rest} name={[name, "dr"]}>
                                            <InputNumber
                                                placeholder="Debit"
                                                min={0}
                                                style={{ width: "100%" }}
                                                controls={false}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={12} sm={4}>
                                        <Form.Item {...rest} name={[name, "cr"]}>
                                            <InputNumber
                                                placeholder="Credit"
                                                min={0}
                                                style={{ width: "100%" }}
                                                controls={false}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={20} sm={7}>
                                        <Form.Item {...rest} name={[name, "narration"]}>
                                            <Input placeholder="Line note (optional)" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={4} sm={1}>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(name)}
                                            disabled={fields.length <= 2}
                                        />
                                    </Col>
                                </Row>
                            ))}

                            <Button
                                type="dashed"
                                onClick={() => add({})}
                                icon={<PlusOutlined />}
                                block
                                style={{ marginTop: 4 }}
                            >
                                Add line
                            </Button>
                        </>
                    )}
                </Form.List>

                {/* Running balance. An unbalanced voucher is rejected by the server, so say so here
                    rather than letting the user find out on submit. */}
                <div
                    style={{
                        marginTop: 16,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${isBalanced ? token.colorSuccessBorder : token.colorWarningBorder}`,
                        background: isBalanced ? token.colorSuccessBg : token.colorWarningBg,
                    }}
                >
                    <Space size="large" wrap>
                        <Text>
                            Debit: <Text strong>{fmtMoney(totals.dr)}</Text>
                        </Text>
                        <Text>
                            Credit: <Text strong>{fmtMoney(totals.cr)}</Text>
                        </Text>
                        <Text type={isBalanced ? "success" : "warning"}>
                            {totals.dr === 0 && totals.cr === 0
                                ? "Enter the two sides of the entry"
                                : isBalanced
                                ? "Balanced"
                                : `Off by ${fmtMoney(Math.abs(totals.difference))}`}
                        </Text>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
}

export default VoucherFormModal;
