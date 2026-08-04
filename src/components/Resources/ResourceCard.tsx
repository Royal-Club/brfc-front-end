import { EyeOutlined, PushpinFilled } from "@ant-design/icons";
import { Tag, Typography } from "antd";
import React from "react";
import type { IResource } from "../../state/features/resources/resourcesSlice";
import ResourceTypeIcon from "./ResourceTypeIcon";
import {
    ContentLanguage,
    pickLocalized,
    RESOURCE_STATUS_META,
    RESOURCE_TYPE_META,
    toAbsoluteResourceUrl,
} from "./resourceUtils";

const { Text } = Typography;

interface ResourceCardProps {
    resource: IResource;
    language: ContentLanguage;
    onOpen: (resource: IResource) => void;
}

export default function ResourceCard({ resource, language, onOpen }: ResourceCardProps) {
    const typeMeta = RESOURCE_TYPE_META[resource.contentType];
    const coverUrl = toAbsoluteResourceUrl(resource.coverImageUrl);
    const title = pickLocalized(resource.title, resource.titleBn, language);
    const summary = pickLocalized(resource.summary, resource.summaryBn, language);

    return (
        <div
            className="resource-card"
            role="button"
            tabIndex={0}
            onClick={() => onOpen(resource)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(resource);
                }
            }}
        >
            <div className="resource-card-cover">
                {coverUrl ? (
                    <img src={coverUrl} alt={title} loading="lazy" />
                ) : (
                    <ResourceTypeIcon
                        type={resource.contentType}
                        style={{ fontSize: 38, color: "rgba(198, 161, 91, 0.75)" }}
                    />
                )}

                <div className="resource-card-badges">
                    <Tag color={typeMeta.color} style={{ marginInlineEnd: 0 }}>
                        {typeMeta.label}
                    </Tag>
                    {resource.status !== "PUBLISHED" && (
                        <Tag
                            color={RESOURCE_STATUS_META[resource.status].color}
                            style={{ marginInlineEnd: 0 }}
                        >
                            {RESOURCE_STATUS_META[resource.status].label}
                        </Tag>
                    )}
                </div>

                {resource.pinned && <PushpinFilled className="resource-card-pin" />}
            </div>

            <div className="resource-card-body">
                <Text className="resource-card-title">{title}</Text>
                <div className="resource-card-summary">{summary}</div>

                <div className="resource-card-meta">
                    <span>
                        {pickLocalized(
                            resource.categoryName,
                            resource.categoryNameBn,
                            language
                        )}
                    </span>
                    <span>
                        <EyeOutlined /> {resource.viewCount ?? 0}
                    </span>
                </div>
            </div>
        </div>
    );
}
