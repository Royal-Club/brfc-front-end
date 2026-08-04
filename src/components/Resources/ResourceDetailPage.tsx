import {
    ArrowLeftOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    FilePdfOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Divider,
    Empty,
    Image,
    Modal,
    Segmented,
    Skeleton,
    Space,
    Tag,
    Typography,
    message,
    theme,
} from "antd";
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
    useDeleteResourceMutation,
    useGetResourceBySlugQuery,
    useGetResourceCategoriesQuery,
    useRecordResourceViewMutation,
    useUpdateResourceStatusMutation,
} from "../../state/features/resources/resourcesSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { club } from "../../theme/clubTheme";
import { showBdLocalTime } from "../../utils/utils";
import { canManageResources } from "../../utils/roleUtils";
import MarkdownView from "./MarkdownView";
import ResourceFormModal from "./ResourceFormModal";
import ResourceTypeIcon from "./ResourceTypeIcon";
import {
    ContentLanguage,
    formatFileSize,
    pickLocalized,
    RESOURCE_STATUS_META,
    RESOURCE_TYPE_META,
    toAbsoluteResourceUrl,
    youTubeVideoId,
} from "./resourceUtils";
import "./Resources.css";

const { Title, Text } = Typography;

const LANGUAGE_STORAGE_KEY = "resourceLanguage";

export default function ResourceDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const loginInfo = useSelector(selectLoginInfo);
    const { token } = theme.useToken();

    const canManage = canManageResources(loginInfo.roles ?? []);

    const { data, isLoading, isError } = useGetResourceBySlugQuery(slug ?? "", {
        skip: !slug,
    });
    const { data: categoriesData } = useGetResourceCategoriesQuery();
    const [recordResourceView] = useRecordResourceViewMutation();
    const [updateResourceStatus, { isLoading: isUpdatingStatus }] =
        useUpdateResourceStatusMutation();
    const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceMutation();

    const [language, setLanguage] = useState<ContentLanguage>(
        () => (localStorage.getItem(LANGUAGE_STORAGE_KEY) as ContentLanguage) || "en"
    );
    const [editorOpen, setEditorOpen] = useState(false);

    const resource = data?.content;
    // One receipt per mounted resource, not one per re-render.
    const viewedIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!resource || viewedIdRef.current === resource.id) return;
        viewedIdRef.current = resource.id;
        recordResourceView(resource.id);
    }, [resource, recordResourceView]);

    const handleLanguageChange = (value: ContentLanguage) => {
        setLanguage(value);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    };

    const themeVars = {
        "--rs-surface": token.colorBgElevated,
        "--rs-surface-hover": token.colorFillQuaternary,
        "--rs-border": token.colorBorderSecondary,
        "--rs-primary": club.gold,
        "--rs-primary-bg": "rgba(198, 161, 91, 0.15)",
        "--rs-panel": club.panel,
        "--rs-panel-border": club.panelBorder,
        "--rs-text": token.colorText,
        "--rs-text-secondary": token.colorTextSecondary,
        "--rs-radius": `${token.borderRadiusLG}px`,
    } as CSSProperties;

    if (isLoading) {
        return (
            <div style={{ padding: 8 }}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    if (isError || !resource) {
        return (
            <Empty style={{ padding: 64 }} description="This resource is not available">
                <Button type="primary" onClick={() => navigate("/resources")}>
                    Back to Resources
                </Button>
            </Empty>
        );
    }

    const typeMeta = RESOURCE_TYPE_META[resource.contentType];
    const title = pickLocalized(resource.title, resource.titleBn, language);
    const summary = pickLocalized(resource.summary, resource.summaryBn, language);
    const body = pickLocalized(resource.body, resource.bodyBn, language);

    const images = (resource.attachments ?? []).filter(
        (attachment) => attachment.kind === "IMAGE"
    );
    const documents = (resource.attachments ?? []).filter(
        (attachment) => attachment.kind !== "IMAGE"
    );
    const videoId = youTubeVideoId(resource.externalUrl);

    const handleStatusToggle = async () => {
        const nextStatus = resource.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
        try {
            await updateResourceStatus({ id: resource.id, status: nextStatus }).unwrap();
            message.success(
                nextStatus === "PUBLISHED" ? "Resource published" : "Resource unpublished"
            );
        } catch {
            // The API layer already surfaces the server message.
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Delete this resource?",
            content:
                "The resource and its uploaded files will be removed permanently. Unpublish it instead if you only want to hide it.",
            okText: "Delete",
            okButtonProps: { danger: true },
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await deleteResource(resource.id).unwrap();
                    message.success("Resource deleted");
                    navigate("/resources");
                } catch {
                    // The API layer already surfaces the server message.
                }
            },
        });
    };

    return (
        <div style={themeVars}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/resources")}
                style={{ marginBottom: 12, paddingLeft: 0 }}
            >
                All resources
            </Button>

            <div className="resource-detail-header">
                <Space size={8} wrap>
                    <Tag color={typeMeta.color} style={{ marginInlineEnd: 0 }}>
                        <ResourceTypeIcon type={resource.contentType} /> {typeMeta.label}
                    </Tag>
                    <Tag style={{ marginInlineEnd: 0 }}>
                        {pickLocalized(
                            resource.categoryName,
                            resource.categoryNameBn,
                            language
                        )}
                    </Tag>
                    {resource.status !== "PUBLISHED" && (
                        <Tag
                            color={RESOURCE_STATUS_META[resource.status].color}
                            style={{ marginInlineEnd: 0 }}
                        >
                            {RESOURCE_STATUS_META[resource.status].label}
                        </Tag>
                    )}
                </Space>

                <Title level={2} className="resource-detail-title">
                    {title}
                </Title>

                {summary && <div className="resource-detail-summary">{summary}</div>}

                <div className="resource-detail-meta">
                    {resource.publishedAt && (
                        <span>Published {showBdLocalTime(resource.publishedAt)}</span>
                    )}
                    <span>
                        <EyeOutlined /> {resource.viewCount ?? 0} views
                    </span>
                </div>
            </div>

            <Space
                style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
                wrap
            >
                {resource.bilingual ? (
                    <Segmented
                        value={language}
                        onChange={(value) => handleLanguageChange(value as ContentLanguage)}
                        options={[
                            { value: "en", label: "English" },
                            { value: "bn", label: "বাংলা" },
                        ]}
                    />
                ) : (
                    <span />
                )}

                {canManage && (
                    <Space wrap>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => setEditorOpen(true)}
                        >
                            Edit
                        </Button>
                        <Button loading={isUpdatingStatus} onClick={handleStatusToggle}>
                            {resource.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={isDeleting}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </Space>
                )}
            </Space>

            {videoId && (
                <div style={{ marginBottom: 20 }}>
                    <div className="resource-video-frame">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {body && (
                <Card
                    bordered
                    style={{ borderRadius: token.borderRadiusLG, marginBottom: 20 }}
                >
                    <MarkdownView>{body}</MarkdownView>
                </Card>
            )}

            {images.length > 0 && (
                <>
                    <Divider orientation="left" orientationMargin={0}>
                        {resource.contentType === "FORMATION" ? "Formation plans" : "Images"}
                    </Divider>
                    <Image.PreviewGroup>
                        <div className="resource-gallery">
                            {images.map((attachment) => {
                                const caption = pickLocalized(
                                    attachment.caption,
                                    attachment.captionBn,
                                    language
                                );
                                return (
                                    <div
                                        className="resource-gallery-item"
                                        key={attachment.storageKey}
                                    >
                                        <Image
                                            src={toAbsoluteResourceUrl(
                                                attachment.url ??
                                                    `/files/resources/${attachment.storageKey}`
                                            )}
                                            alt={caption || attachment.fileName || "diagram"}
                                        />
                                        {caption && (
                                            <div className="resource-gallery-caption">
                                                {caption}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Image.PreviewGroup>
                </>
            )}

            {documents.length > 0 && (
                <>
                    <Divider orientation="left" orientationMargin={0}>
                        Files
                    </Divider>
                    <Space direction="vertical" style={{ width: "100%" }} size={8}>
                        {documents.map((attachment) => (
                            <Card
                                key={attachment.storageKey}
                                size="small"
                                style={{ borderRadius: token.borderRadius }}
                            >
                                <Space
                                    style={{ width: "100%", justifyContent: "space-between" }}
                                    wrap
                                >
                                    <Space>
                                        <FilePdfOutlined style={{ fontSize: 18 }} />
                                        <div>
                                            <Text style={{ display: "block" }}>
                                                {pickLocalized(
                                                    attachment.caption,
                                                    attachment.captionBn,
                                                    language
                                                ) || attachment.fileName}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {formatFileSize(attachment.sizeBytes)}
                                            </Text>
                                        </div>
                                    </Space>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        href={toAbsoluteResourceUrl(
                                            attachment.url ??
                                                `/files/resources/${attachment.storageKey}`
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open
                                    </Button>
                                </Space>
                            </Card>
                        ))}
                    </Space>
                </>
            )}

            {resource.externalUrl && !videoId && (
                <Button
                    type="link"
                    icon={<LinkOutlined />}
                    href={resource.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ paddingLeft: 0, marginTop: 12 }}
                >
                    {resource.externalUrl}
                </Button>
            )}

            {canManage && (
                <ResourceFormModal
                    open={editorOpen}
                    resource={resource}
                    categories={categoriesData?.content ?? []}
                    onClose={() => setEditorOpen(false)}
                />
            )}
        </div>
    );
}
