import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Empty,
    Input,
    Skeleton,
    Tag,
    Tooltip,
    Typography,
    Upload,
} from "antd";
import {
    FileOutlined,
    LoadingOutlined,
    PaperClipOutlined,
    SendOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { API_URL } from "../../settings";
import { club } from "../../theme/clubTheme";
import { showBdLocalTime } from "../../utils/utils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { useTeamChatWebSocket } from "../../hooks/useTeamChatWebSocket";
import {
    ITeamChatMessage,
    ITeamChatRoom,
    useGetTeamChatMessagesQuery,
    usePresignTeamChatAttachmentMutation,
    useSendTeamChatMessageMutation,
} from "../../state/features/teamChat/teamChatSlice";
import {
    UploadedTeamChatFile,
    formatBytes,
    uploadTeamChatFile,
} from "../../utils/teamChatUpload";
import "./teamChat.css";

const { Text, Title } = Typography;

interface TeamChatRoomProps {
    room: ITeamChatRoom;
    /** Called when the server says the room has been purged mid-session. */
    onRoomClosed?: () => void;
}

const PAGE_SIZE = 50;

/**
 * One team's private room.
 *
 * <p>History comes from REST and live messages from the socket, and the two are merged into a single
 * local list keyed by id. Merging by id rather than appending blindly is what makes the sender's own
 * message safe: they receive it back over their own subscription as well as in the POST response,
 * and without the key it would appear twice.
 */
export default function TeamChatRoom({ room, onRoomClosed }: TeamChatRoomProps) {
    const loginInfo = useSelector(selectLoginInfo);
    // The store keeps the signed-in player's id as a string, the same way every other screen reads it.
    const myPlayerId = Number(loginInfo.userId);

    const [messages, setMessages] = useState<ITeamChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [pending, setPending] = useState<UploadedTeamChatFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const listRef = useRef<HTMLDivElement | null>(null);

    const { data: history, isLoading } = useGetTeamChatMessagesQuery(
        { teamId: room.teamId, limit: PAGE_SIZE },
        { skip: !room.open }
    );

    const [sendMessage, { isLoading: sending }] = useSendTeamChatMessageMutation();
    const [presign] = usePresignTeamChatAttachmentMutation();

    /** Adds or replaces by id, keeping the list in chronological order. */
    const mergeMessage = useCallback((incoming: ITeamChatMessage) => {
        setMessages((current) => {
            const next = current.filter((message) => message.id !== incoming.id);
            next.push(incoming);
            return next.sort((a, b) => a.id - b.id);
        });
    }, []);

    useEffect(() => {
        if (history) {
            setMessages(history);
        }
    }, [history]);

    const { connected } = useTeamChatWebSocket({
        teamId: room.open ? room.teamId : undefined,
        onMessage: mergeMessage,
        onRoomClosed,
        enabled: room.open,
    });

    // Pinned to the newest message. A chat that opens halfway up its own history reads as broken.
    useEffect(() => {
        const node = listRef.current;
        if (node) {
            node.scrollTop = node.scrollHeight;
        }
    }, [messages.length]);

    const memberNames = useMemo(
        () => room.members.map((member) => member.playerName).join(", "),
        [room.members]
    );

    /**
     * Space left in the room's shared budget.
     *
     * <p>Files staged in the composer are already in storage but have no row yet, so the server does
     * not count them. Subtracting them here stops someone queueing five files that individually fit
     * and collectively do not, only to have the send rejected after every upload has finished.
     */
    const pendingBytes = pending.reduce((total, file) => total + file.sizeBytes, 0);
    const remainingBytes = Math.max(
        0,
        room.storageLimitBytes - room.storageUsedBytes - pendingBytes
    );

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const uploaded = await uploadTeamChatFile(
                file,
                (params) => presign({ teamId: room.teamId, ...params }).unwrap(),
                remainingBytes
            );
            setPending((current) => [...current, uploaded]);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Could not upload that file"
            );
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async () => {
        const body = draft.trim();
        if (!body && pending.length === 0) {
            return;
        }
        try {
            const sent = await sendMessage({
                teamId: room.teamId,
                body: body || undefined,
                attachments: pending.length ? pending : undefined,
            }).unwrap();

            // Merged rather than appended: the socket usually delivers this same message first.
            mergeMessage(sent);
            setDraft("");
            setPending([]);
        } catch {
            // The shared API error handler already surfaces the message.
        }
    };

    if (!room.open) {
        return (
            <Alert
                type="info"
                showIcon
                message="Team chat unavailable"
                description={room.closedReason ?? "This chat is not open."}
            />
        );
    }

    return (
        <div className="team-chat">
            <div className="team-chat__header">
                <div>
                    <Title level={5} style={{ margin: 0, color: club.textPrimary }}>
                        <TeamOutlined style={{ color: club.gold, marginRight: 8 }} />
                        {room.teamName}
                    </Title>
                    <Tooltip title={memberNames}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {room.members.length} member
                            {room.members.length === 1 ? "" : "s"} · private to this team
                        </Text>
                    </Tooltip>
                </div>
                <div className="team-chat__header-meta">
                    <Tooltip
                        title={`Files: ${formatBytes(room.storageUsedBytes)} of ${formatBytes(
                            room.storageLimitBytes
                        )} used by this team`}
                    >
                        <Text
                            type={remainingBytes === 0 ? "danger" : "secondary"}
                            style={{ fontSize: 12 }}
                        >
                            {formatBytes(remainingBytes)} free
                        </Text>
                    </Tooltip>
                    <Badge
                        status={connected ? "success" : "default"}
                        text={connected ? "Live" : "Reconnecting…"}
                    />
                </div>
            </div>

            <Alert
                type="warning"
                showIcon
                banner
                className="team-chat__notice"
                message="This chat and every file shared in it are deleted when the tournament concludes."
            />

            <div className="team-chat__messages" ref={listRef}>
                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                ) : messages.length === 0 ? (
                    <Empty description="No messages yet. Say hello to your team." />
                ) : (
                    messages.map((message) => {
                        const mine = message.senderId === myPlayerId;
                        return (
                            <div
                                key={message.id}
                                className={`team-chat__row ${mine ? "team-chat__row--mine" : ""}`}
                            >
                                {!mine && (
                                    <Avatar
                                        size={32}
                                        src={toAbsolutePlayerPhotoUrl(message.senderPhotoUrl)}
                                    >
                                        {message.senderName?.charAt(0)}
                                    </Avatar>
                                )}
                                <div className="team-chat__bubble">
                                    {!mine && (
                                        <Text strong style={{ fontSize: 12, color: club.goldSoft }}>
                                            {message.senderName}
                                        </Text>
                                    )}
                                    {message.body && (
                                        <div className="team-chat__body">{message.body}</div>
                                    )}
                                    {message.attachments?.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            className="team-chat__file"
                                            href={`${API_URL}${attachment.downloadUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FileOutlined />
                                            <span className="team-chat__file-name">
                                                {attachment.fileName}
                                            </span>
                                            <span className="team-chat__file-size">
                                                {formatBytes(attachment.sizeBytes)}
                                            </span>
                                        </a>
                                    ))}
                                    <div className="team-chat__time">
                                        {showBdLocalTime(message.sentAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {pending.length > 0 && (
                <div className="team-chat__pending">
                    {pending.map((file) => (
                        <Tag
                            key={file.key}
                            closable
                            onClose={() =>
                                setPending((current) =>
                                    current.filter((item) => item.key !== file.key)
                                )
                            }
                        >
                            {file.fileName} ({formatBytes(file.sizeBytes)})
                        </Tag>
                    ))}
                </div>
            )}

            <div className="team-chat__composer">
                <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleUpload(file as File);
                        // Handled by hand above, so antd must not also try to upload it.
                        return false;
                    }}
                >
                    <Tooltip
                        title={
                            remainingBytes === 0
                                ? "No file space left in this chat"
                                : `Attach a file — ${formatBytes(remainingBytes)} left, ${formatBytes(
                                      room.maxFileBytes
                                  )} max per file`
                        }
                    >
                        <Button
                            icon={uploading ? <LoadingOutlined /> : <PaperClipOutlined />}
                            disabled={uploading || remainingBytes === 0}
                        />
                    </Tooltip>
                </Upload>
                <Input.TextArea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Message your team…"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={4000}
                    onPressEnter={(event) => {
                        // Enter sends, Shift+Enter starts a new line - what people expect of a chat.
                        if (!event.shiftKey) {
                            event.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    onClick={handleSend}
                    disabled={!draft.trim() && pending.length === 0}
                >
                    Send
                </Button>
            </div>
        </div>
    );
}
