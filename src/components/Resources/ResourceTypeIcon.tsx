import {
    DeploymentUnitOutlined,
    FilePdfOutlined,
    LinkOutlined,
    PlayCircleOutlined,
    ReadOutlined,
} from "@ant-design/icons";
import React from "react";
import type { ResourceContentType } from "../../state/features/resources/resourcesSlice";

const ICONS: Record<ResourceContentType, React.ComponentType<any>> = {
    ARTICLE: ReadOutlined,
    FORMATION: DeploymentUnitOutlined,
    VIDEO: PlayCircleOutlined,
    DOCUMENT: FilePdfOutlined,
    LINK: LinkOutlined,
};

interface ResourceTypeIconProps {
    type: ResourceContentType;
    style?: React.CSSProperties;
}

export default function ResourceTypeIcon({ type, style }: ResourceTypeIconProps) {
    const Icon = ICONS[type] ?? ReadOutlined;
    return <Icon style={style} />;
}
