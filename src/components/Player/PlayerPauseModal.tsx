import { useState } from "react";
import {
    Alert,
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import IPlayerPause, { PAUSE_REASON_LABEL, PauseReason } from "../../interfaces/IPlayerPause";
import {
    useDeletePauseMutation,
    useGetPlayerPausesQuery,
    usePausePlayerMutation,
    useResumePlayerMutation,
} from "../../state/features/player/playerPauseSlice";

const { Text, Paragraph } = Typography;

interface PlayerPauseModalProps {
    open: boolean;
    playerId: number | null;
    playerName: string;
    onClose: () => void;
}

const monthLabel = (isoDate: string | null): string =>
    isoDate ? dayjs(isoDate).format("MMM YYYY") : "—";

/** Pulls a readable message out of an RTK Query error, falling back to a generic line. */
const errorText = (error: unknown, fallback: string): string => {
    const message = (error as { data?: { message?: string } })?.data?.message;
    return message || fallback;
};

/**
 * Puts a player on hold for their monthly contributions, or takes them off hold.
 *
 * <p>A hold is not a deactivation: the player keeps their login and uses the app as normal. It only
 * says the club is not charging them for the months covered, so those months read "On hold" rather
 * than "Due" in the reports and on the dashboard.
 */
function PlayerPauseModal({ open, playerId, playerName, onClose }: PlayerPauseModalProps) {
    const [pauseForm] = Form.useForm();
    const [resumeMonth, setResumeMonth] = useState<Dayjs | null>(null);
    const [messageApi, messageContext] = message.useMessage();

    const { data, isFetching } = useGetPlayerPausesQuery(playerId as number, { skip: !open || !playerId });
    const [pausePlayer, { isLoading: isPausing }] = usePausePlayerMutation();
    const [resumePlayer, { isLoading: isResuming }] = useResumePlayerMutation();
    const [deletePause, { isLoading: isDeleting }] = useDeletePauseMutation();

    const pauses: IPlayerPause[] = data?.content ?? [];
    const runningPause = pauses.find((pause) => pause.openEnded);

    const handlePause = async () => {
        if (!playerId) return;
        try {
            const values = await pauseForm.validateFields();
            await pausePlayer({
                playerId,
                fromMonth: (values.fromMonth as Dayjs).startOf("month").format("YYYY-MM-DD"),
                reason: values.reason as PauseReason,
                note: values.note || undefined,
            }).unwrap();
            messageApi.success(`${playerName} is on hold.`);
            pauseForm.resetFields();
        } catch (error) {
            // A failed validateFields rejects too; only surface real API failures.
            if ((error as { errorFields?: unknown }).errorFields) return;
            messageApi.error(errorText(error, "Could not put this player on hold."));
        }
    };

    const handleResume = async () => {
        if (!playerId || !resumeMonth) return;
        try {
            await resumePlayer({
                playerId,
                resumeFromMonth: resumeMonth.startOf("month").format("YYYY-MM-DD"),
            }).unwrap();
            messageApi.success(`${playerName} owes contributions again from ${resumeMonth.format("MMM YYYY")}.`);
            setResumeMonth(null);
        } catch (error) {
            messageApi.error(errorText(error, "Could not resume this player."));
        }
    };

    const handleDelete = async (pauseId: number) => {
        try {
            await deletePause(pauseId).unwrap();
            messageApi.success("Hold removed.");
        } catch (error) {
            messageApi.error(errorText(error, "Could not remove this hold."));
        }
    };

    const historyColumns: ColumnsType<IPlayerPause> = [
        {
            title: "Months",
            key: "months",
            render: (_, pause) => (
                <Space size={4}>
                    <b>{monthLabel(pause.fromMonth)}</b>
                    <span>→</span>
                    {pause.openEnded ? <Tag color="processing">ongoing</Tag> : <b>{monthLabel(pause.toMonth)}</b>}
                </Space>
            ),
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            render: (reason: PauseReason) => PAUSE_REASON_LABEL[reason] ?? reason,
        },
        {
            title: "Note",
            dataIndex: "note",
            key: "note",
            render: (note: string | null) => note || <Text type="secondary">—</Text>,
        },
        {
            title: "",
            key: "action",
            width: 90,
            render: (_, pause) => (
                <Popconfirm
                    title="Remove this hold?"
                    description="Use this only for a hold recorded by mistake — those months become due again."
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(pause.id)}
                >
                    <Button size="small" danger type="link" loading={isDeleting}>
                        Remove
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={`Contribution hold — ${playerName}`}
            footer={<Button onClick={onClose}>Close</Button>}
            width={720}
            destroyOnClose
        >
            {messageContext}

            <Paragraph type="secondary" style={{ marginTop: 0 }}>
                A hold excuses this player from monthly contributions. They keep their login and use the app
                normally; the months covered read <b>On hold</b> instead of <b>Due</b>, and they are left out
                of dues reminders and match invitations while it runs.
            </Paragraph>

            {runningPause ? (
                <>
                    <Alert
                        type="info"
                        showIcon
                        icon={<PauseCircleOutlined />}
                        message={`On hold since ${monthLabel(runningPause.fromMonth)}`}
                        description={
                            <>
                                {PAUSE_REASON_LABEL[runningPause.reason] ?? runningPause.reason}
                                {runningPause.note ? ` — ${runningPause.note}` : ""}
                            </>
                        }
                        style={{ marginBottom: 16 }}
                    />

                    <Space align="end" wrap style={{ marginBottom: 8 }}>
                        <div>
                            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                                Owes again from
                            </Text>
                            <DatePicker
                                picker="month"
                                value={resumeMonth}
                                onChange={setResumeMonth}
                                // The hold is closed off at the month before this one, so it must start
                                // after the month the hold began.
                                disabledDate={(month) => !month.isAfter(dayjs(runningPause.fromMonth), "month")}
                                placeholder="Resume month"
                            />
                        </div>
                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            disabled={!resumeMonth}
                            loading={isResuming}
                            onClick={handleResume}
                        >
                            Resume
                        </Button>
                    </Space>
                    <Paragraph type="secondary" style={{ fontSize: 12 }}>
                        The months already excused stay excused — resuming never makes them due again.
                    </Paragraph>
                </>
            ) : (
                <Form form={pauseForm} layout="vertical" requiredMark={false}>
                    <Space align="start" wrap size={12}>
                        <Form.Item
                            name="fromMonth"
                            label="On hold from"
                            rules={[{ required: true, message: "Pick the first excused month" }]}
                            style={{ marginBottom: 12 }}
                        >
                            <DatePicker picker="month" placeholder="Month" />
                        </Form.Item>
                        <Form.Item
                            name="reason"
                            label="Reason"
                            rules={[{ required: true, message: "Pick a reason" }]}
                            style={{ marginBottom: 12, minWidth: 160 }}
                        >
                            <Select
                                placeholder="Reason"
                                options={(Object.keys(PAUSE_REASON_LABEL) as PauseReason[]).map((reason) => ({
                                    value: reason,
                                    label: PAUSE_REASON_LABEL[reason],
                                }))}
                            />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="note"
                        label="Note (optional)"
                        rules={[{ max: 255, message: "At most 255 characters" }]}
                    >
                        <Input.TextArea rows={2} placeholder="e.g. ACL tear, out for the season" />
                    </Form.Item>

                    <Button type="primary" icon={<PauseCircleOutlined />} loading={isPausing} onClick={handlePause}>
                        Put on hold
                    </Button>
                </Form>
            )}

            <Text strong style={{ display: "block", margin: "20px 0 8px" }}>
                Hold history
            </Text>
            <Table
                size="small"
                rowKey="id"
                loading={isFetching}
                columns={historyColumns}
                dataSource={pauses}
                pagination={false}
                locale={{ emptyText: "This player has never been put on hold." }}
            />
        </Modal>
    );
}

export default PlayerPauseModal;
