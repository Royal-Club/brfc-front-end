import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
    Button,
    Col,
    Empty,
    Input,
    Row,
    Segmented,
    Select,
    Skeleton,
    Typography,
    theme,
} from "antd";
import React, { CSSProperties, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    IResource,
    ResourceContentType,
    ResourceStatus,
    useGetResourceCategoriesQuery,
    useGetResourcesQuery,
} from "../../state/features/resources/resourcesSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { club } from "../../theme/clubTheme";
import { canManageResources } from "../../utils/roleUtils";
import ResourceCard from "./ResourceCard";
import ResourceFormModal from "./ResourceFormModal";
import "./Resources.css";
import { ContentLanguage, RESOURCE_TYPE_META } from "./resourceUtils";

const { Title, Text } = Typography;

const LANGUAGE_STORAGE_KEY = "resourceLanguage";

const TYPE_OPTIONS = (Object.keys(RESOURCE_TYPE_META) as ResourceContentType[]).map(
    (type) => ({ value: type, label: RESOURCE_TYPE_META[type].label })
);

export default function ResourcesPage() {
    const navigate = useNavigate();
    const loginInfo = useSelector(selectLoginInfo);
    const { token } = theme.useToken();

    const canManage = canManageResources(loginInfo.roles ?? []);

    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState<number | undefined>();
    const [contentType, setContentType] = useState<ResourceContentType | undefined>();
    const [status, setStatus] = useState<ResourceStatus | undefined>();
    const [language, setLanguage] = useState<ContentLanguage>(
        () => (localStorage.getItem(LANGUAGE_STORAGE_KEY) as ContentLanguage) || "en"
    );
    const [editorOpen, setEditorOpen] = useState(false);

    const { data: categoriesData } = useGetResourceCategoriesQuery();
    const { data: resourcesData, isLoading, isFetching } = useGetResourcesQuery({
        categoryId,
        contentType,
        status: canManage ? status : undefined,
        search,
    });

    const categories = categoriesData?.content ?? [];
    const resources = useMemo(() => resourcesData?.content ?? [], [resourcesData]);

    const handleLanguageChange = (value: ContentLanguage) => {
        setLanguage(value);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    };

    const openResource = (resource: IResource) => {
        navigate(`/resources/${resource.slug}`);
    };

    // Theme tokens exposed to CSS so the page is correct in dark & light mode.
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

    const pinned = resources.filter((resource) => resource.pinned);
    const rest = resources.filter((resource) => !resource.pinned);

    const renderGrid = (items: IResource[]) => (
        <Row gutter={[16, 16]}>
            {items.map((resource) => (
                <Col key={resource.id} xs={24} sm={12} lg={8} xxl={6}>
                    <ResourceCard
                        resource={resource}
                        language={language}
                        onOpen={openResource}
                    />
                </Col>
            ))}
        </Row>
    );

    return (
        <div className="resources-page" style={themeVars}>
            <div className="resources-hero">
                <Title level={2} className="resources-hero-title">
                    Resources
                </Title>
                <div className="resources-hero-subtitle">
                    Playing principles, formation plans, drills and club documents —
                    everything the squad needs before stepping on the pitch.
                </div>
            </div>

            <div className="resources-divider" />

            <div className="resources-toolbar">
                <Input
                    className="resources-toolbar-search"
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Search resources"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <Select
                    allowClear
                    style={{ minWidth: 150 }}
                    placeholder="All types"
                    value={contentType}
                    onChange={setContentType}
                    options={TYPE_OPTIONS}
                />

                {canManage && (
                    <Select
                        allowClear
                        style={{ minWidth: 150 }}
                        placeholder="All statuses"
                        value={status}
                        onChange={setStatus}
                        options={[
                            { value: "DRAFT", label: "Draft" },
                            { value: "PUBLISHED", label: "Published" },
                            { value: "ARCHIVED", label: "Archived" },
                        ]}
                    />
                )}

                <Segmented
                    value={language}
                    onChange={(value) => handleLanguageChange(value as ContentLanguage)}
                    options={[
                        { value: "en", label: "EN" },
                        { value: "bn", label: "বাংলা" },
                    ]}
                />

                <div style={{ flex: 1 }} />

                {canManage && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setEditorOpen(true)}
                    >
                        Add Resource
                    </Button>
                )}
            </div>

            <div className="resources-category-rail">
                <div
                    className={`resources-category-chip ${
                        categoryId === undefined ? "is-active" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCategoryId(undefined)}
                    onKeyDown={(event) => event.key === "Enter" && setCategoryId(undefined)}
                >
                    All
                </div>
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className={`resources-category-chip ${
                            categoryId === category.id ? "is-active" : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setCategoryId(category.id)}
                        onKeyDown={(event) =>
                            event.key === "Enter" && setCategoryId(category.id)
                        }
                    >
                        {language === "bn" && category.nameBn
                            ? category.nameBn
                            : category.name}
                        <span className="resources-category-chip-count">
                            {category.resourceCount}
                        </span>
                    </div>
                ))}
            </div>

            {isLoading || isFetching ? (
                <Row gutter={[16, 16]}>
                    {[0, 1, 2, 3, 4, 5].map((key) => (
                        <Col key={key} xs={24} sm={12} lg={8} xxl={6}>
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </Col>
                    ))}
                </Row>
            ) : resources.length === 0 ? (
                <Empty
                    style={{ padding: 48 }}
                    description={
                        search || categoryId || contentType
                            ? "No resources match these filters"
                            : "No resources have been added yet"
                    }
                />
            ) : (
                <>
                    {pinned.length > 0 && (
                        <>
                            <Text
                                type="secondary"
                                style={{
                                    display: "block",
                                    marginBottom: 10,
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2,
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}
                            >
                                Pinned
                            </Text>
                            {renderGrid(pinned)}
                            {rest.length > 0 && <div style={{ height: 26 }} />}
                        </>
                    )}
                    {rest.length > 0 && renderGrid(rest)}
                </>
            )}

            {canManage && (
                <ResourceFormModal
                    open={editorOpen}
                    resource={null}
                    categories={categories}
                    onClose={() => setEditorOpen(false)}
                />
            )}
        </div>
    );
}
