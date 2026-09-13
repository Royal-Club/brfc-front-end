import { Typography, List, Button, Popconfirm, Tag, Space, message } from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CheckOutlined,
    CloseOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    useGetPendingCashTransfersQuery,
    useAcceptCashTransferMutation,
    useRejectCashTransferMutation,
    useCancelCashTransferMutation,
} from "../../../state/features/account/cashTransferSlice";
import { PendingCashTransfer } from "../../../interfaces/ICashTransfer";
import { fmtMoney } from "../../../utils/acFormat";
import { notifyRequestError } from "../../../utils/errorNotification";
import { club, kicker } from "../../../theme/clubTheme";

const { Text } = Typography;

const partyLabel = (holder: string | null, account: string) =>
    holder ? `${holder} — ${account}` : account;

const subtitle = (transfer: PendingCashTransfer) => {
    const when = transfer.date ? dayjs(transfer.date).format("DD MMM YYYY") : "—";
    return transfer.note ? `${when} · ${transfer.note}` : when;
};

/**
 * The handovers waiting on the signed-in custodian: money offered to them, which they accept or
 * turn down, and money they have offered, which stays theirs until the other side accepts.
 *
 * <p>Renders nothing when there is nothing pending, so it stays out of the way for the common case.
 */
function PendingHandovers() {
    const { data } = useGetPendingCashTransfersQuery();
    const [acceptTransfer, { isLoading: isAccepting }] = useAcceptCashTransferMutation();
    const [rejectTransfer, { isLoading: isRejecting }] = useRejectCashTransferMutation();
    const [cancelTransfer, { isLoading: isCancelling }] = useCancelCashTransferMutation();

    const incoming = data?.content?.incoming ?? [];
    const outgoing = data?.content?.outgoing ?? [];

    if (incoming.length === 0 && outgoing.length === 0) {
        return null;
    }

    const onAccept = async (transfer: PendingCashTransfer) => {
        try {
            await acceptTransfer(transfer.id).unwrap();
            message.success(`Accepted ${fmtMoney(transfer.amount)} into your cash in hand`);
        } catch (err) {
            notifyRequestError(err, "Could not accept the handover");
        }
    };

    const onReject = async (transfer: PendingCashTransfer) => {
        try {
            await rejectTransfer({ id: transfer.id }).unwrap();
            message.success("Handover turned down");
        } catch (err) {
            notifyRequestError(err, "Could not reject the handover");
        }
    };

    const onCancel = async (transfer: PendingCashTransfer) => {
        try {
            await cancelTransfer(transfer.id).unwrap();
            message.success("Handover cancelled");
        } catch (err) {
            notifyRequestError(err, "Could not cancel the handover");
        }
    };

    return (
        <>
            {incoming.length > 0 && (
                <>
                    <div style={{ ...kicker, color: club.gold, margin: "26px 0 10px" }}>
                        Waiting for you to accept
                    </div>
                    <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                        Nothing is added to your cash in hand until you accept it.
                    </Text>
                    <List
                        itemLayout="horizontal"
                        dataSource={incoming}
                        renderItem={(transfer) => (
                            <List.Item
                                actions={[
                                    <Popconfirm
                                        key="accept"
                                        title="Accept this money?"
                                        description={`${fmtMoney(transfer.amount)} will be added to your cash in hand.`}
                                        okText="Accept"
                                        onConfirm={() => onAccept(transfer)}
                                    >
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<CheckOutlined />}
                                            loading={isAccepting}
                                        >
                                            Accept
                                        </Button>
                                    </Popconfirm>,
                                    <Popconfirm
                                        key="reject"
                                        title="Turn this down?"
                                        description="Use this if the money never reached you."
                                        okText="Reject"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => onReject(transfer)}
                                    >
                                        <Button
                                            danger
                                            size="small"
                                            icon={<CloseOutlined />}
                                            loading={isRejecting}
                                        >
                                            Reject
                                        </Button>
                                    </Popconfirm>,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<ArrowDownOutlined style={{ color: club.gold }} />}
                                    title={
                                        <Space>
                                            <span className="brfc-amount brfc-amount--pos">
                                                {fmtMoney(transfer.amount)}
                                            </span>
                                            <Text type="secondary">from</Text>
                                            <Text>
                                                {partyLabel(transfer.fromHolderName, transfer.fromAccountName)}
                                            </Text>
                                        </Space>
                                    }
                                    description={subtitle(transfer)}
                                />
                            </List.Item>
                        )}
                    />
                </>
            )}

            {outgoing.length > 0 && (
                <>
                    <div style={{ ...kicker, color: club.gold, margin: "26px 0 10px" }}>
                        Waiting to be accepted
                    </div>
                    <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                        Still counted as your cash in hand until the other person accepts it.
                    </Text>
                    <List
                        itemLayout="horizontal"
                        dataSource={outgoing}
                        renderItem={(transfer) => (
                            <List.Item
                                actions={[
                                    <Popconfirm
                                        key="cancel"
                                        title="Cancel this handover?"
                                        okText="Cancel it"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => onCancel(transfer)}
                                    >
                                        <Button size="small" loading={isCancelling}>
                                            Cancel
                                        </Button>
                                    </Popconfirm>,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<ArrowUpOutlined style={{ color: club.gold }} />}
                                    title={
                                        <Space>
                                            <span className="brfc-amount brfc-amount--neg">
                                                {fmtMoney(transfer.amount)}
                                            </span>
                                            <Text type="secondary">to</Text>
                                            <Text>
                                                {partyLabel(transfer.toHolderName, transfer.toAccountName)}
                                            </Text>
                                            <Tag icon={<ClockCircleOutlined />} color="gold">
                                                Pending
                                            </Tag>
                                        </Space>
                                    }
                                    description={subtitle(transfer)}
                                />
                            </List.Item>
                        )}
                    />
                </>
            )}
        </>
    );
}

export default PendingHandovers;
