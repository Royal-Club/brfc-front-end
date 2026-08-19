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
    BoldOutlined,
    CodeOutlined,
    ItalicOutlined,
    LoadingOutlined,
    PaperClipOutlined,
    SendOutlined,
    StrikethroughOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { club } from "../../theme/clubTheme";
import { showBdLocalTime } from "../../utils/utils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { useTeamChatWebSocket } from "../../hooks/useTeamChatWebSocket";
import {
    ITeamChatAttachment,
    ITeamChatMessage,
    ITeamChatRoom,
    useGetTeamChatMessagesQuery,
    useLazyGetTeamChatMessagesQuery,
    usePresignTeamChatAttachmentMutation,
    useSendTeamChatMessageMutation,
} from "../../state/features/teamChat/teamChatSlice";
import {
    UploadedTeamChatFile,
    downloadTeamChatAttachment,
    formatBytes,
    uploadTeamChatFile,
} from "../../utils/teamChatUpload";
import TeamChatAttachment from "./TeamChatAttachment";
import { renderMessageBody } from "./messageFormatting";
import "./teamChat.css";

const { Text, Title } = Typography;

interface TeamChatRoomProps {
    room: ITeamChatRoom;
    /** Called when the server says the room has been purged mid-session. */
    onRoomClosed?: () => void;
    /**
     * Trims the room for the dock's narrow column.
     *
     * <p>A prop rather than more CSS overrides because the savings that matter are structural - an
     * avatar that is not rendered gives its 40px back to the text, where one hidden with
     * `display: none` still costs the layout its gap.
     */
    compact?: boolean;
}

const PAGE_SIZE = 50;

/** The markers the composer can insert, in the order they appear on the toolbar. */
const FORMAT_BUTTONS = [
    { marker: "*", label: "Bold", icon: <BoldOutlined />, shortcut: "Ctrl+B" },
    { marker: "_", label: "Italic", icon: <ItalicOutlined />, shortcut: "Ctrl+I" },
    { marker: "~", label: "Strikethrough", icon: <StrikethroughOutlined />, shortcut: null },
    { marker: "`", label: "Code", icon: <CodeOutlined />, shortcut: null },
];

/**
 * Gives a pasted screenshot a name of its own.
 *
 * <p>Browsers hand every clipboard image over as "image.png", so a room where three people paste a
 * screenshot ends up with three attachments of the same name - in the composer, in the file list and
 * in whatever folder they are later downloaded to. A file pasted from a folder keeps its real name;
 * only the placeholder is replaced.
 */
function withPastedName(file: File): File {
    if (file.name && file.name !== "image.png") {
        return file;
    }
    const extension = file.type.split("/")[1] || "png";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return new File([file], `pasted-${stamp}.${extension}`, { type: file.type });
}

/** Keyed by the letter pressed with Ctrl/Cmd; only the two that are universal. */
const SHORTCUT_MARKERS: Record<string, string> = {
    b: "*",
    i: "_",
};

/**
 * One team's private room.
 *
 * <p>History comes from REST and live messages from the socket, and the two are merged into a single
 * local list keyed by id. Merging by id rather than appending blindly is what makes the sender's own
 * message safe: they receive it back over their own subscription as well as in the POST response,
 * and without the key it would appear twice.
 */
export default function TeamChatRoom({
    room,
    onRoomClosed,
    compact = false,
}: TeamChatRoomProps) {
    const loginInfo = useSelector(selectLoginInfo);
    // The store keeps the signed-in player's id as a string, the same way every other screen reads it.
    const myPlayerId = Number(loginInfo.userId);

    const [messages, setMessages] = useState<ITeamChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [pending, setPending] = useState<UploadedTeamChatFile[]>([]);
    const [uploading, setUploading] = useState(false);
    /** False once a page comes back short, meaning there is nothing older to fetch. */
    const [hasOlder, setHasOlder] = useState(true);

    const listRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<TextAreaRef | null>(null);
    /**
     * Whether the reader was at the bottom before this render's messages arrived.
     *
     * <p>Kept in a ref rather than state: it is read during the post-render scroll effect and must
     * not itself cause a render, or every scroll event would re-render the whole conversation.
     */
    const wasAtBottomRef = useRef(true);

    // Refetched on every mount, not served from cache alone. Nothing invalidates this query while
    // the room is open - sent messages come back in the POST response and everyone else's arrive
    // over the socket, both of which are merged into local state rather than into the cache. That
    // local state dies with the component, so leaving the room and returning inside RTK Query's
    // 60s cache window would otherwise restore the page exactly as the server first sent it, with
    // every message since missing. A room that was empty on first open comes back empty.
    const { data: history, isLoading } = useGetTeamChatMessagesQuery(
        { teamId: room.teamId, limit: PAGE_SIZE },
        { skip: !room.open, refetchOnMountOrArgChange: true }
    );

    const [fetchOlder, { isFetching: loadingOlder }] = useLazyGetTeamChatMessagesQuery();
    const [sendMessage, { isLoading: sending }] = useSendTeamChatMessageMutation();
    const [presign] = usePresignTeamChatAttachmentMutation();

    /** Adds or replaces by id, keeping the list in chronological order. */
    const mergeMessages = useCallback((incoming: ITeamChatMessage[]) => {
        setMessages((current) => {
            const byId = new Map(current.map((message) => [message.id, message]));
            incoming.forEach((message) => byId.set(message.id, message));
            return Array.from(byId.values()).sort((a, b) => a.id - b.id);
        });
    }, []);

    const mergeMessage = useCallback(
        (incoming: ITeamChatMessage) => mergeMessages([incoming]),
        [mergeMessages]
    );

    // Merged rather than assigned. Replacing the list would discard every message the socket
    // delivered since this page was fetched, and would wipe older pages the reader had scrolled
    // back through, on any refetch of the latest page.
    useEffect(() => {
        if (history) {
            mergeMessages(history);
            // Assigned rather than only ever cleared: with the refetch above, a stale empty page can
            // arrive before the real one, and a one-way latch would hide "load older" for good.
            setHasOlder(history.length >= PAGE_SIZE);
        }
    }, [history, mergeMessages]);

    /** Fetches the page before the oldest message currently held, and prepends it. */
    const handleLoadOlder = async () => {
        if (!messages.length) {
            return;
        }
        const node = listRef.current;
        const heightBefore = node?.scrollHeight ?? 0;

        try {
            const older = await fetchOlder({
                teamId: room.teamId,
                before: messages[0].id,
                limit: PAGE_SIZE,
            }).unwrap();

            if (older.length < PAGE_SIZE) {
                setHasOlder(false);
            }
            if (older.length) {
                mergeMessages(older);
                // Hold the reader's place. Prepending grows the list upward, so without this the
                // content they were reading jumps down by the height of everything just added.
                requestAnimationFrame(() => {
                    if (listRef.current) {
                        listRef.current.scrollTop =
                            listRef.current.scrollHeight - heightBefore;
                    }
                });
            }
        } catch {
            // The shared API error handler already surfaces the message.
        }
    };

    const { connected } = useTeamChatWebSocket({
        teamId: room.open ? room.teamId : undefined,
        onMessage: mergeMessage,
        onRoomClosed,
        enabled: room.open,
    });

    /**
     * Follows the conversation only for a reader who is already at the bottom of it.
     *
     * <p>Unconditionally scrolling down is what makes a chat impossible to read back through:
     * someone catching up on this morning's messages gets yanked to the newest one every time
     * anybody types. The room still opens pinned to the bottom, because the ref starts true.
     */
    useEffect(() => {
        const node = listRef.current;
        if (node && wasAtBottomRef.current) {
            node.scrollTop = node.scrollHeight;
        }
    }, [messages.length]);

    /** Within this many pixels of the bottom still counts as "following along". */
    const handleScroll = () => {
        const node = listRef.current;
        if (node) {
            wasAtBottomRef.current =
                node.scrollHeight - node.scrollTop - node.clientHeight < 80;
        }
    };

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

    /**
     * Files pasted into the composer, which for most people means a screenshot.
     *
     * <p>The attach button reaches the same upload path, but nobody saves a screenshot to disk first
     * just to attach it - Ctrl+V is how a screenshot gets shared, so it has to work here.
     *
     * <p>Uploaded one at a time rather than in parallel: each upload is budgeted against the space
     * left in the room, and firing them together would have every one of them measured against the
     * same starting figure.
     */
    const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(event.clipboardData?.items ?? [])
            .filter((item) => item.kind === "file")
            .map((item) => item.getAsFile())
            .filter((file): file is File => file !== null);

        if (!files.length) {
            return;
        }

        // Only once there is actually a file to take. Copying an image from a web page puts markup
        // and a caption on the clipboard alongside it, and letting that through would drop a stray
        // line of text into the message next to the picture.
        event.preventDefault();

        for (const file of files) {
            await handleUpload(withPastedName(file));
        }
    };

    // Attachments cannot be plain links: the route needs the bearer token, which only a fetch can
    // carry. Errors are surfaced here because this path has no RTK Query wrapper to do it.
    const handleDownload = async (attachment: ITeamChatAttachment) => {
        try {
            await downloadTeamChatAttachment(attachment.downloadUrl, attachment.fileName);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Could not download that file"
            );
        }
    };

    /**
     * Wraps the selected text in a marker, or opens an empty pair for the writer to type into.
     *
     * <p>Editing the draft through the textarea's own selection rather than appending to the end is
     * what makes the toolbar worth having: someone who has already typed a sentence can select one
     * word of it and embolden that, which is the only reason anyone reaches for the button.
     */
    const wrapSelection = (marker: string) => {
        const node = inputRef.current?.resizableTextArea?.textArea;
        if (!node) {
            return;
        }

        const { selectionStart: start, selectionEnd: end } = node;
        const selected = draft.slice(start, end);
        setDraft(draft.slice(0, start) + marker + selected + marker + draft.slice(end));

        // After the state lands, so the caret is placed in the textarea React has re-rendered:
        // setting it now would put it back where it was before the markers were inserted.
        requestAnimationFrame(() => {
            node.focus();
            node.setSelectionRange(start + marker.length, end + marker.length);
        });
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

            <div className="team-chat__messages" ref={listRef} onScroll={handleScroll}>
                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                ) : messages.length === 0 ? (
                    <Empty description="No messages yet. Say hello to your team." />
                ) : (
                    <>
                    {hasOlder && (
                        <div className="team-chat__load-older">
                            <Button
                                size="small"
                                type="text"
                                loading={loadingOlder}
                                onClick={handleLoadOlder}
                            >
                                Load earlier messages
                            </Button>
                        </div>
                    )}
                    {messages.map((message) => {
                        const mine = message.senderId === myPlayerId;
                        return (
                            <div
                                key={message.id}
                                className={`team-chat__row ${mine ? "team-chat__row--mine" : ""}`}
                            >
                                {/* Only for other people. Your own messages are already marked as
                                    yours by the side they sit on and their colour, and a column of
                                    your own face down the right is what every chat app leaves out.
                                    Falls back to the initial when a player has uploaded no photo. */}
                                {!mine && (
                                    <Avatar
                                        size={compact ? 24 : 32}
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
                                        <div className="team-chat__body">
                                            {renderMessageBody(message.body)}
                                        </div>
                                    )}
                                    {message.attachments?.map((attachment) => (
                                        <TeamChatAttachment
                                            key={attachment.id}
                                            attachment={attachment}
                                            onDownload={handleDownload}
                                        />
                                    ))}
                                    <div className="team-chat__time">
                                        {showBdLocalTime(message.sentAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </>
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
                <div className="team-chat__composer-field">
                    <div className="team-chat__format-bar">
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
                                        : `Attach a file — ${formatBytes(
                                              remainingBytes
                                          )} left, ${formatBytes(room.maxFileBytes)} max per file`
                                }
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={
                                        uploading ? <LoadingOutlined /> : <PaperClipOutlined />
                                    }
                                    disabled={uploading || remainingBytes === 0}
                                />
                            </Tooltip>
                        </Upload>
                        {/* Attaching and formatting are the same kind of act - things you add to a
                            message before sending it - so they belong on one row rather than on
                            opposite sides of the composer. */}
                        <span className="team-chat__format-divider" />
                        {FORMAT_BUTTONS.map(({ marker, label, icon, shortcut }) => (
                            <Tooltip
                                key={marker}
                                title={`${label} — ${
                                    shortcut ? `${shortcut}, or ` : ""
                                }type ${marker}text${marker}`}
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={icon}
                                    onClick={() => wrapSelection(marker)}
                                />
                            </Tooltip>
                        ))}
                    </div>
                    <Input.TextArea
                        ref={inputRef}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Message your team…"
                        autoSize={{ minRows: 1, maxRows: compact ? 4 : 6 }}
                        maxLength={4000}
                        onPaste={handlePaste}
                        onKeyDown={(event) => {
                            // Only the two every editor has. Ctrl+S and Ctrl+E are left alone
                            // deliberately - taking "save page" off someone is not worth a marker
                            // the toolbar button already inserts.
                            if (!event.ctrlKey && !event.metaKey) {
                                return;
                            }
                            const marker = SHORTCUT_MARKERS[event.key.toLowerCase()];
                            if (marker) {
                                event.preventDefault();
                                wrapSelection(marker);
                            }
                        }}
                        onPressEnter={(event) => {
                            // Enter sends, Shift+Enter starts a new line - what people expect of a chat.
                            if (!event.shiftKey) {
                                event.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                </div>
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    onClick={handleSend}
                    disabled={!draft.trim() && pending.length === 0}
                >
                    {/* The word costs about a fifth of the dock's width, and the paper plane is
                        unambiguous next to a message box. */}
                    {compact ? null : "Send"}
                </Button>
            </div>
        </div>
    );
}
