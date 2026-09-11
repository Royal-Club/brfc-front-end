import { useEffect, useMemo } from "react";
import { Modal, Form, Select, InputNumber, DatePicker, Input, Typography, Alert } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
    useGetCashTransferOptionsQuery,
    useTransferCashMutation,
} from "../../../state/features/account/cashTransferSlice";
import { CashTransferAccount } from "../../../interfaces/ICashTransfer";
import { fmtMoney } from "../../../utils/acFormat";
import { notifyRequestError } from "../../../utils/errorNotification";

const { Text } = Typography;

interface CashTransferModalProps {
    open: boolean;
    onClose: () => void;
    onDone: () => void;
}

interface TransferFormValues {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    date: Dayjs;
    note?: string;
}

const accountLabel = (account: CashTransferAccount) =>
    account.holderName ? `${account.holderName} — ${account.name}` : account.name;

function CashTransferModal({ open, onClose, onDone }: CashTransferModalProps) {
    const [form] = Form.useForm<TransferFormValues>();

    const { data, isFetching } = useGetCashTransferOptionsQuery(undefined, { skip: !open });
    const [transferCash, { isLoading: isSaving }] = useTransferCashMutation();

    const options = data?.content;
    const sources = useMemo(() => options?.sources ?? [], [options]);
    const destinations = options?.destinations ?? [];
    const canChooseSource = options?.canChooseSource ?? false;

    const fromAccountId = Form.useWatch("fromAccountId", form);
    const source = sources.find((account) => account.id === fromAccountId);

    // A custodian has exactly one source, so it is filled in rather than asked for.
    useEffect(() => {
        if (open && sources.length === 1) {
            form.setFieldsValue({ fromAccountId: sources[0].id });
        }
    }, [open, sources, form]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        try {
            await transferCash({
                fromAccountId: canChooseSource ? values.fromAccountId : undefined,
                toAccountId: values.toAccountId,
                amount: values.amount,
                date: values.date.format("YYYY-MM-DD"),
                note: values.note?.trim() || undefined,
            }).unwrap();
            form.resetFields();
            onDone();
            onClose();
        } catch (err) {
            notifyRequestError(err, "Could not record the handover");
        }
    };

    return (
        <Modal
            title="Hand over cash"
            open={open}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            onOk={handleSubmit}
            okText="Record handover"
            confirmLoading={isSaving}
            destroyOnClose
            maskClosable={false}
        >
            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Record this when the money physically changes hands, so both balances move together."
            />

            <Form form={form} layout="vertical" initialValues={{ date: dayjs() }} preserve={false}>
                <Form.Item
                    label="From"
                    name="fromAccountId"
                    rules={[{ required: true, message: "Choose the account the money is leaving" }]}
                    extra={
                        source ? (
                            <Text type="secondary">Currently holds {fmtMoney(source.balance)}</Text>
                        ) : undefined
                    }
                >
                    <Select
                        loading={isFetching}
                        // Fixed for a custodian: you can only hand over what is in your own pocket.
                        disabled={!canChooseSource}
                        placeholder="Select the account"
                        optionFilterProp="label"
                        options={sources.map((account) => ({
                            value: account.id,
                            label: accountLabel(account),
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="To"
                    name="toAccountId"
                    rules={[{ required: true, message: "Choose who is receiving the money" }]}
                >
                    <Select
                        loading={isFetching}
                        showSearch
                        placeholder="Select who is receiving it"
                        optionFilterProp="label"
                        options={destinations
                            .filter((account) => account.id !== fromAccountId)
                            .map((account) => ({
                                value: account.id,
                                label: accountLabel(account),
                            }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Amount"
                    name="amount"
                    rules={[
                        { required: true, message: "Enter the amount handed over" },
                        {
                            type: "number",
                            min: 0.01,
                            message: "The amount must be more than zero",
                        },
                    ]}
                >
                    <InputNumber style={{ width: "100%" }} min={0.01} step={100} placeholder="0.00" />
                </Form.Item>

                <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: "Enter the date the money changed hands" }]}
                >
                    <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Note" name="note">
                    <Input placeholder="What this was for (optional)" maxLength={500} />
                </Form.Item>
            </Form>
        </Modal>
    );
}

export default CashTransferModal;
