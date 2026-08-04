import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Tabs,
    Typography,
    Upload,
    message,
} from "antd";
import React, { useEffect, useState } from "react";
import {
    IResource,
    IResourceAttachment,
    IResourceCategory,
    IResourceRequest,
    ResourceContentType,
    useCreateResourceMutation,
    usePresignResourceFileMutation,
    useUpdateResourceMutation,
} from "../../state/features/resources/resourcesSlice";
import MarkdownEditor from "./MarkdownEditor";
import ResourceAttachmentsField from "./ResourceAttachmentsField";
import {
    ALLOWED_IMAGE_TYPES,
    RESOURCE_TYPE_META,
    toAbsoluteResourceUrl,
    uploadResourceFile,
} from "./resourceUtils";
import "./Resources.css";

const { Text } = Typography;

const TYPE_OPTIONS = (Object.keys(RESOURCE_TYPE_META) as ResourceContentType[]).map(
    (type) => ({ value: type, label: RESOURCE_TYPE_META[type].label })
);

interface ResourceFormModalProps {
    open: boolean;
    /** Null creates a new resource. */
    resource: IResource | null;
    categories: IResourceCategory[];
    onClose: () => void;
    onSaved?: (resource: IResource) => void;
}

export default function ResourceFormModal({
    open,
    resource,
    categories,
    onClose,
    onSaved,
}: ResourceFormModalProps) {
    const [form] = Form.useForm();
    const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
    const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();
    const [presignResourceFile] = usePresignResourceFileMutation();

    const [attachments, setAttachments] = useState<IResourceAttachment[]>([]);
    const [coverImageKey, setCoverImageKey] = useState<string | null>(null);
    const [coverUploading, setCoverUploading] = useState(false);
    const [contentType, setContentType] = useState<ResourceContentType>("ARTICLE");
    const [activeTab, setActiveTab] = useState("en");

    const isEdit = Boolean(resource);

    useEffect(() => {
        if (!open) return;

        if (resource) {
            form.setFieldsValue({
                categoryId: resource.categoryId,
                contentType: resource.contentType,
                status: resource.status,
                title: resource.title,
                titleBn: resource.titleBn ?? "",
                summary: resource.summary ?? "",
                summaryBn: resource.summaryBn ?? "",
                body: resource.body ?? "",
                bodyBn: resource.bodyBn ?? "",
                externalUrl: resource.externalUrl ?? "",
                pinned: resource.pinned,
                sortOrder: resource.sortOrder ?? 0,
            });
            setAttachments(resource.attachments ?? []);
            setCoverImageKey(resource.coverImageKey ?? null);
            setContentType(resource.contentType);
        } else {
            form.resetFields();
            form.setFieldsValue({
                contentType: "ARTICLE",
                status: "DRAFT",
                pinned: false,
                sortOrder: 0,
                categoryId: categories[0]?.id,
            });
            setAttachments([]);
            setCoverImageKey(null);
            setContentType("ARTICLE");
        }
        setActiveTab("en");
    }, [open, resource, categories, form]);

    // Each form field lives on exactly one tab; used to reveal the tab that
    // holds a validation error the user can't currently see.
    const FIELD_TAB: Record<string, string> = {
        title: "en",
        summary: "en",
        body: "en",
        titleBn: "bn",
        summaryBn: "bn",
        bodyBn: "bn",
        externalUrl: "media",
        pinned: "placement",
        sortOrder: "placement",
    };

    const handleCoverUpload = async (file: File) => {
        setCoverUploading(true);
        try {
            const uploaded = await uploadResourceFile(
                file,
                (params) => presignResourceFile(params).unwrap(),
                true
            );
            if (uploaded) setCoverImageKey(uploaded.storageKey);
        } finally {
            setCoverUploading(false);
        }
    };

    const handleSubmit = async () => {
        let values;
        try {
            values = await form.validateFields();
        } catch (error: any) {
            // The failing field may sit on a tab that isn't open, so the inline
            // error is invisible and the click looks dead. Jump to that tab and
            // say what's missing instead of silently returning.
            const firstErrorField = error?.errorFields?.[0]?.name?.[0] as
                | string
                | undefined;
            const targetTab = firstErrorField ? FIELD_TAB[firstErrorField] : undefined;
            if (targetTab) setActiveTab(targetTab);
            message.error(
                error?.errorFields?.[0]?.errors?.[0] ??
                    "Please complete the required fields."
            );
            return;
        }

        const needsExternalUrl =
            values.contentType === "VIDEO" || values.contentType === "LINK";
        if (needsExternalUrl && !values.externalUrl?.trim()) {
            setActiveTab("media");
            message.error("Video and link resources need an external URL.");
            return;
        }

        const payload: IResourceRequest = {
            categoryId: values.categoryId,
            title: values.title,
            titleBn: values.titleBn || null,
            summary: values.summary || null,
            summaryBn: values.summaryBn || null,
            body: values.body || null,
            bodyBn: values.bodyBn || null,
            contentType: values.contentType,
            status: values.status,
            coverImageKey,
            externalUrl: values.externalUrl || null,
            pinned: values.pinned,
            sortOrder: values.sortOrder ?? 0,
            attachments: attachments.map((attachment, index) => ({
                ...attachment,
                sortOrder: index,
            })),
        };

        try {
            const result = resource
                ? await updateResource({ id: resource.id, data: payload }).unwrap()
                : await createResource(payload).unwrap();

            message.success(isEdit ? "Resource updated" : "Resource created");
            onSaved?.(result.content);
            onClose();
        } catch {
            // The API layer already surfaces the server message.
        }
    };

    const coverUrl = toAbsoluteResourceUrl(
        coverImageKey ? `/files/resources/${coverImageKey}` : null
    );

    return (
        <Modal
            open={open}
            title={isEdit ? "Edit resource" : "Add resource"}
            onCancel={onClose}
            onOk={handleSubmit}
            okText={isEdit ? "Save changes" : "Create"}
            confirmLoading={isCreating || isUpdating}
            width={880}
            destroyOnClose
            maskClosable={false}
        >
            <Form form={form} layout="vertical" preserve={false}>
                <Row gutter={12}>
                    <Col xs={24} md={9}>
                        <Form.Item
                            name="categoryId"
                            label="Category"
                            rules={[{ required: true, message: "Pick a category" }]}
                        >
                            <Select
                                placeholder="Select a category"
                                options={categories.map((category) => ({
                                    value: category.id,
                                    label: category.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="contentType"
                            label="Type"
                            rules={[{ required: true, message: "Pick a type" }]}
                        >
                            <Select
                                options={TYPE_OPTIONS}
                                onChange={(value) => setContentType(value)}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={7}>
                        <Form.Item name="status" label="Status">
                            <Select
                                options={[
                                    { value: "DRAFT", label: "Draft" },
                                    { value: "PUBLISHED", label: "Published" },
                                    { value: "ARCHIVED", label: "Archived" },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: "en",
                            label: "English",
                            forceRender: true,
                            children: (
                                <>
                                    <Form.Item
                                        name="title"
                                        label="Title"
                                        rules={[
                                            { required: true, message: "Title is required" },
                                            { max: 200, message: "Keep the title under 200 characters" },
                                        ]}
                                    >
                                        <Input placeholder="e.g. 2-2-2 Formation Plan" />
                                    </Form.Item>

                                    <Form.Item
                                        name="summary"
                                        label="Summary"
                                        rules={[{ max: 500, message: "Keep the summary under 500 characters" }]}
                                    >
                                        <Input.TextArea
                                            rows={2}
                                            placeholder="One or two lines shown on the library card"
                                        />
                                    </Form.Item>

                                    <Form.Item name="body" label="Content">
                                        <MarkdownEditor placeholder="Write the guidance here…" />
                                    </Form.Item>
                                </>
                            ),
                        },
                        {
                            key: "bn",
                            label: "বাংলা",
                            forceRender: true,
                            children: (
                                <>
                                    <Text
                                        type="secondary"
                                        style={{ display: "block", marginBottom: 12, fontSize: 12 }}
                                    >
                                        Optional. Anything left blank falls back to the English text,
                                        so a partial translation is fine.
                                    </Text>

                                    <Form.Item name="titleBn" label="শিরোনাম">
                                        <Input placeholder="যেমন ২-২-২ ফরমেশন পরিকল্পনা" />
                                    </Form.Item>

                                    <Form.Item name="summaryBn" label="সংক্ষিপ্ত বিবরণ">
                                        <Input.TextArea rows={2} />
                                    </Form.Item>

                                    <Form.Item name="bodyBn" label="বিস্তারিত">
                                        <MarkdownEditor placeholder="বাংলায় নির্দেশনা লিখুন…" />
                                    </Form.Item>
                                </>
                            ),
                        },
                        {
                            key: "media",
                            label: "Media & links",
                            forceRender: true,
                            children: (
                                <>
                                    <Form.Item
                                        name="externalUrl"
                                        label="External URL"
                                        extra={
                                            contentType === "VIDEO"
                                                ? "YouTube links are embedded on the resource page."
                                                : "Optional for guides — required for video and link resources."
                                        }
                                        rules={[
                                            {
                                                type: "url",
                                                message: "Enter a valid URL",
                                                warningOnly: false,
                                            },
                                        ]}
                                    >
                                        <Input placeholder="https://…" />
                                    </Form.Item>

                                    <Form.Item label="Cover image">
                                        <Space align="start" size={14} wrap>
                                            {coverUrl && (
                                                <img
                                                    src={coverUrl}
                                                    alt="cover"
                                                    style={{
                                                        width: 132,
                                                        height: 78,
                                                        objectFit: "cover",
                                                        borderRadius: 8,
                                                    }}
                                                />
                                            )}
                                            <Space>
                                                <Upload
                                                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                                                    showUploadList={false}
                                                    beforeUpload={(file) => {
                                                        handleCoverUpload(file as File);
                                                        return false;
                                                    }}
                                                >
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        loading={coverUploading}
                                                    >
                                                        {coverImageKey ? "Replace" : "Upload cover"}
                                                    </Button>
                                                </Upload>
                                                {coverImageKey && (
                                                    <Button
                                                        danger
                                                        type="text"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => setCoverImageKey(null)}
                                                    />
                                                )}
                                            </Space>
                                        </Space>
                                    </Form.Item>

                                    <Form.Item
                                        label="Attachments"
                                        extra="Formation diagrams, drill sheets, PDFs."
                                    >
                                        <ResourceAttachmentsField
                                            value={attachments}
                                            onChange={setAttachments}
                                        />
                                    </Form.Item>
                                </>
                            ),
                        },
                        {
                            key: "placement",
                            label: "Placement",
                            forceRender: true,
                            children: (
                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="pinned"
                                            label="Pin to the top"
                                            valuePropName="checked"
                                            extra="Pinned resources appear above everything else."
                                        >
                                            <Switch />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="sortOrder"
                                            label="Sort order"
                                            extra="Lower numbers come first."
                                        >
                                            <InputNumber min={0} style={{ width: "100%" }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            ),
                        },
                    ]}
                />
            </Form>
        </Modal>
    );
}
