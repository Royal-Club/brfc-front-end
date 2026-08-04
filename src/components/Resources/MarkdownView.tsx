import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Resources.css";

interface MarkdownViewProps {
    children?: string | null;
    className?: string;
}

/**
 * Renders admin-authored markdown. Raw HTML is intentionally not enabled
 * (no rehype-raw), so authored content cannot inject markup.
 */
export default function MarkdownView({ children, className }: MarkdownViewProps) {
    if (!children || !children.trim()) return null;

    return (
        <div className={`resource-markdown ${className ?? ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
        </div>
    );
}
