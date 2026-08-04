import {
    DeleteOutlined,
    DownOutlined,
    FilePdfOutlined,
    UpOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { Button, Input, Space, Typography, Upload } from "antd";
import React, { useState } from "react";
import {
    IResourceAttachment,
    usePresignResourceFileMutation,
} from "../../state/features/resources/resourcesSlice";
import {
    ALLOWED_FILE_TYPES,
    formatFileSize,
    toAbsoluteResourceUrl,
    uploadResourceFile,
} from "./resourceUtils";
import "./Resources.css";

const { Text } = Typography;

interface ResourceAttachmentsFieldProps {
    value: IResourceAttachment[];
    onChange: (value: IResourceAttachment[]) => void;
}

/**
 * Formation diagrams and documents attached to a resource. Files upload
 * immediately so the editor always holds real storage keys; the resource save
 * then just persists the list.
 */
export default function ResourceAttachmentsField({
    value,
    onChange,
}: ResourceAttachmentsFieldProps) {
    const [presignResourceFile] = usePresignResourceFileMutation();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const uploaded = await uploadResourceFile(
                file,
                (params) => presignResourceFile(params).unwrap(),
                false
            );
            if (uploaded) {
                onChange([...value, { ...uploaded, sortOrder: value.length }]);
            }
        } finally {
            setUploading(false);
        }
    };

    const updateAt = (index: number, patch: Partial<IResourceAttachment>) => {
        onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const removeAt = (index: number) => {
        onChange(
            value
                .filter((_, i) => i !== index)
                .map((item, i) => ({ ...item, sortOrder: i }))
        );
    };

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next.map((item, i) => ({ ...item, sortOrder: i })));
    };

    return (
        <div>
            {value.map((attachment, index) => {
                const isImage = attachment.kind === "IMAGE";
                const url = toAbsoluteResourceUrl(
                    attachment.url ?? `/files/resources/${attachment.storageKey}`
                );

                return (
                    <div className="resource-attachment-row" key={attachment.storageKey}>
                        {isImage ? (
                            <img
                                className="resource-attachment-thumb"
                                src={url}
                                alt={attachment.fileName ?? "attachment"}
                            />
                        ) : (
                            <div
                                className="resource-attachment-thumb"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <FilePdfOutlined style={{ fontSize: 22 }} />
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text ellipsis style={{ display: "block", fontSize: 13 }}>
                                {attachment.fileName}{" "}
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {formatFileSize(attachment.sizeBytes)}
                                </Text>
                            </Text>
                            <Space.Compact style={{ width: "100%", marginTop: 6 }}>
                                <Input
                                    size="small"
                                    placeholder="Caption (English)"
                                    value={attachment.caption ?? ""}
                                    onChange={(event) =>
                                        updateAt(index, { caption: event.target.value })
                                    }
                                />
                                <Input
                                    size="small"
                                    placeholder="ক্যাপশন (বাংলা)"
                                    value={attachment.captionBn ?? ""}
                                    onChange={(event) =>
                                        updateAt(index, { captionBn: event.target.value })
                                    }
                                />
                            </Space.Compact>
                        </div>

                        <Space direction="vertical" size={2}>
                            <Button
                                size="small"
                                type="text"
                                icon={<UpOutlined />}
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                            />
                            <Button
                                size="small"
                                type="text"
                                icon={<DownOutlined />}
                                disabled={index === value.length - 1}
                                onClick={() => move(index, 1)}
                            />
                        </Space>

                        <Button
                            size="small"
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeAt(index)}
                        />
                    </div>
                );
            })}

            <Upload
                accept={ALLOWED_FILE_TYPES.join(",")}
                showUploadList={false}
                beforeUpload={(file) => {
                    handleUpload(file as File);
                    return false;
                }}
            >
                <Button icon={<UploadOutlined />} loading={uploading}>
                    Add image or PDF
                </Button>
            </Upload>
        </div>
    );
}
