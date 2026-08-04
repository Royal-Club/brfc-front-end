import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["Resources", "ResourceCategories"],
});

export type ResourceContentType =
    | "ARTICLE"
    | "FORMATION"
    | "VIDEO"
    | "DOCUMENT"
    | "LINK";

export type ResourceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ResourceAttachmentKind = "IMAGE" | "DOCUMENT" | "OTHER";

export interface IResourceCategory {
    id: number;
    name: string;
    nameBn?: string | null;
    slug: string;
    description?: string | null;
    icon?: string | null;
    sortOrder: number;
    active: boolean;
    resourceCount: number;
}

export interface IResourceAttachment {
    id?: number;
    storageKey: string;
    url?: string | null;
    fileName?: string | null;
    contentType?: string | null;
    sizeBytes?: number | null;
    kind?: ResourceAttachmentKind | null;
    caption?: string | null;
    captionBn?: string | null;
    sortOrder?: number | null;
}

export interface IResource {
    id: number;
    categoryId: number;
    categoryName?: string | null;
    categoryNameBn?: string | null;
    categorySlug?: string | null;
    categoryIcon?: string | null;

    title: string;
    titleBn?: string | null;
    slug: string;
    summary?: string | null;
    summaryBn?: string | null;
    /** Present on detail responses only — list responses omit the bodies. */
    body?: string | null;
    bodyBn?: string | null;

    contentType: ResourceContentType;
    status: ResourceStatus;
    coverImageKey?: string | null;
    coverImageUrl?: string | null;
    externalUrl?: string | null;
    metadata?: string | null;

    pinned: boolean;
    sortOrder: number;
    viewCount: number;
    publishedAt?: string | null;
    createdDate?: string | null;
    updatedDate?: string | null;
    /** True when a Bangla translation exists, so the language toggle is useful. */
    bilingual: boolean;

    attachments?: IResourceAttachment[];
}

export interface IResourceRequest {
    categoryId: number;
    title: string;
    titleBn?: string | null;
    summary?: string | null;
    summaryBn?: string | null;
    body?: string | null;
    bodyBn?: string | null;
    contentType: ResourceContentType;
    status?: ResourceStatus;
    coverImageKey?: string | null;
    externalUrl?: string | null;
    metadata?: string | null;
    pinned?: boolean;
    sortOrder?: number;
    attachments?: IResourceAttachment[];
}

export interface ResourceFilters {
    categoryId?: number;
    contentType?: ResourceContentType;
    status?: ResourceStatus;
    search?: string;
}

export interface ResourceListRes extends BasicResType {
    content: IResource[];
    numberOfElement?: number;
}

export interface SingleResourceRes extends BasicResType {
    content: IResource;
}

export interface ResourceCategoryListRes extends BasicResType {
    content: IResourceCategory[];
}

export interface ResourceFilePresignRes extends BasicResType {
    content: {
        key: string;
        url: string;
        uploadUrl: string;
        expiresInSeconds: number;
    };
}

const buildResourceQuery = (filters: ResourceFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.categoryId != null) params.append("categoryId", String(filters.categoryId));
    if (filters.contentType) params.append("contentType", filters.contentType);
    if (filters.status) params.append("status", filters.status);
    if (filters.search?.trim()) params.append("search", filters.search.trim());
    const query = params.toString();
    return query ? `resources?${query}` : "resources";
};

export const resourcesApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getResourceCategories: builder.query<ResourceCategoryListRes, void>({
            query: () => ({
                url: "resource-categories",
                method: "GET",
            }),
            providesTags: ["ResourceCategories"],
        }),
        getResources: builder.query<ResourceListRes, ResourceFilters | void>({
            query: (filters) => ({
                url: buildResourceQuery(filters ?? {}),
                method: "GET",
            }),
            providesTags: ["Resources"],
        }),
        getResourceBySlug: builder.query<SingleResourceRes, string>({
            query: (slug) => ({
                url: `resources/slug/${encodeURIComponent(slug)}`,
                method: "GET",
            }),
            providesTags: ["Resources"],
        }),
        createResource: builder.mutation<SingleResourceRes, IResourceRequest>({
            query: (data) => ({
                url: "resources",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Resources", "ResourceCategories"],
        }),
        updateResource: builder.mutation<
            SingleResourceRes,
            { id: number; data: IResourceRequest }
        >({
            query: ({ id, data }) => ({
                url: `resources/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Resources", "ResourceCategories"],
        }),
        updateResourceStatus: builder.mutation<
            SingleResourceRes,
            { id: number; status: ResourceStatus }
        >({
            query: ({ id, status }) => ({
                url: `resources/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["Resources", "ResourceCategories"],
        }),
        deleteResource: builder.mutation<BasicResType, number>({
            query: (id) => ({
                url: `resources/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Resources", "ResourceCategories"],
        }),
        // Read receipt. Deliberately does not invalidate anything — refetching
        // the library every time a player opens an item is not worth it.
        recordResourceView: builder.mutation<BasicResType, number>({
            query: (id) => ({
                url: `resources/${id}/view`,
                method: "POST",
            }),
        }),
        presignResourceFile: builder.mutation<
            ResourceFilePresignRes,
            { fileName: string; contentType: string }
        >({
            query: ({ fileName, contentType }) => ({
                url: `files/resources/presign?fileName=${encodeURIComponent(
                    fileName
                )}&contentType=${encodeURIComponent(contentType)}`,
                method: "POST",
            }),
        }),
    }),
});

export const {
    useGetResourceCategoriesQuery,
    useGetResourcesQuery,
    useGetResourceBySlugQuery,
    useCreateResourceMutation,
    useUpdateResourceMutation,
    useUpdateResourceStatusMutation,
    useDeleteResourceMutation,
    useRecordResourceViewMutation,
    usePresignResourceFileMutation,
} = resourcesApi;
