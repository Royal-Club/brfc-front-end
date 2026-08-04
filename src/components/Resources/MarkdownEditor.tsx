import { Input, Segmented, Space, Typography } from "antd";
import React, { useState } from "react";
import MarkdownView from "./MarkdownView";
import "./Resources.css";

const { Text } = Typography;

interface MarkdownEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

/**
 * Plain markdown textarea with a live preview. Deliberately not a WYSIWYG —
 * the stored text stays diffable and searchable, and the preview uses the very
 * same renderer players see.
 */
export default function MarkdownEditor({
    value,
    onChange,
    placeholder,
    rows = 12,
}: MarkdownEditorProps) {
    const [mode, setMode] = useState<"write" | "preview">("write");

    return (
        <div>
            <Space
                style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 8,
                }}
            >
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Markdown supported — ## headings, - lists, **bold**, tables
                </Text>
                <Segmented
                    size="small"
                    value={mode}
                    onChange={(next) => setMode(next as "write" | "preview")}
                    options={[
                        { value: "write", label: "Write" },
                        { value: "preview", label: "Preview" },
                    ]}
                />
            </Space>

            {mode === "write" ? (
                <Input.TextArea
                    rows={rows}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => onChange?.(event.target.value)}
                />
            ) : (
                <div className="resource-editor-preview">
                    {value?.trim() ? (
                        <MarkdownView>{value}</MarkdownView>
                    ) : (
                        <Text type="secondary">Nothing to preview yet.</Text>
                    )}
                </div>
            )}
        </div>
    );
}
