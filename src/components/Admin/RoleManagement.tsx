import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Skeleton,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    SafetyCertificateOutlined,
    SearchOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import {
    useAssignRolesMutation,
    useGetAssignableCashAccountsQuery,
    useGetRolesQuery,
} from "../../state/features/roles/rolesSlice";
import IPlayer from "../../interfaces/IPlayer";
import PlayerAvatar from "../Util/PlayerAvatar";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import useIsMobile from "../../hooks/useIsMobile";

const { Title, Text } = Typography;

/** Roles the server actually checks. Anything else is a label the club uses for its own bookkeeping. */
const ROLE_HINTS: Record<string, string> = {
    SUPERADMIN: "Full access, including this page and club cash accounts.",
    ADMIN: "Club management: players, finance, tournaments, venues.",
    COORDINATOR: "Runs tournaments and matchday: fixtures, teams, resources.",
    ACCOUNTANT: "Holds club cash in a named account and records money in and out.",
    PLAYER: "Baseline membership. Everyone keeps this one.",
    TEAM_OWNER: "Bids for players in the auction.",
};

/** Colour per role so the same role reads the same everywhere on the page. */
const ROLE_COLOR: Record<string, string> = {
    SUPERADMIN: "red",
    ADMIN: "volcano",
    COORDINATOR: "geekblue",
    ACCOUNTANT: "green",
    TEAM_OWNER: "purple",
    PLAYER: "default",
};

const roleColor = (name: string) => ROLE_COLOR[name] ?? "blue";

const initials = (name?: string) =>
    (name ?? "")
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

export default function RoleManagement() {
    const loginInfo = useSelector(selectLoginInfo);
    const isSuperAdmin = loginInfo.roles.includes("SUPERADMIN");
    const isMobile = useIsMobile(768);

    // Who holds what comes from the players list rather than /roles/players/all-with-roles:
    // both carry the roles, but that one is superadmin-only and this one is readable by any
    // signed-in member — and it brings the photos with it.
    const { data: playersData, isLoading } = useGetPlayersQuery();
    const { data: rolesData } = useGetRolesQuery();
    // The cash accounts and the assignment itself are superadmin-only on the server, so a
    // read-only viewer never fires them.
    const { data: cashAccountsData } = useGetAssignableCashAccountsQuery(undefined, {
        skip: !isSuperAdmin,
    });
    const [assignRoles, { isLoading: isSaving }] = useAssignRolesMutation();

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("ALL");
    const [editing, setEditing] = useState<IPlayer | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    // undefined means "open a new account", matching what the server does with an absent selection.
    const [selectedCashAccount, setSelectedCashAccount] = useState<number | undefined>(undefined);

    const members = useMemo(() => playersData?.content ?? [], [playersData]);
    const roles = useMemo(() => rolesData?.content ?? [], [rolesData]);

    const roleByName = (name: string) => roles.find(r => r.name === name);
    const playerRoleId = roleByName("PLAYER")?.id;
    const superAdminRoleId = roleByName("SUPERADMIN")?.id;

    /** Holder count per role name, including roles nobody holds yet. */
    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        roles.forEach(role => {
            counts[role.name] = 0;
        });
        members.forEach(member => {
            member.roles?.forEach(role => {
                counts[role.name] = (counts[role.name] ?? 0) + 1;
            });
        });
        return counts;
    }, [members, roles]);

    const visibleMembers = useMemo(() => {
        const term = search.trim().toLowerCase();
        return members.filter(member => {
            const matchesRole =
                roleFilter === "ALL" || member.roles?.some(role => role.name === roleFilter);
            if (!matchesRole) return false;
            if (!term) return true;
            return (
                member.name?.toLowerCase().includes(term) ||
                member.email?.toLowerCase().includes(term) ||
                member.employeeId?.toLowerCase().includes(term)
            );
        });
    }, [members, roleFilter, search]);

    const isEditingSelf = editing?.id === Number(loginInfo.userId);
    const isAccountantSelected = selectedRoles.some(
        id => roles.find(role => role.id === id)?.name === "ACCOUNTANT"
    );

    const openEditor = (member: IPlayer) => {
        setEditing(member);
        // Seed PLAYER when older data is missing it. The option is locked once selected, so
        // without this a member with no PLAYER role could never be given one, and every save
        // for them would fail the server's "must have at least PLAYER role" check.
        const current = member.roles?.map(role => role.id) ?? [];
        setSelectedRoles(
            playerRoleId !== undefined && !current.includes(playerRoleId)
                ? [...current, playerRoleId]
                : current
        );
        // Show the account they already hold, so re-saving does not look like a change.
        const held = cashAccountsData?.content?.find(account => account.holderId === member.id);
        setSelectedCashAccount(held?.id);
    };

    const closeEditor = () => {
        setEditing(null);
        setSelectedRoles([]);
        setSelectedCashAccount(undefined);
    };

    // The server rejects a save that drops PLAYER, so put it back instead of letting the
    // request fail. The option is disabled too; this covers the keyboard paths into the Select.
    const handleRoleChange = (values: number[]) => {
        const next =
            playerRoleId !== undefined && !values.includes(playerRoleId)
                ? [...values, playerRoleId]
                : values;
        setSelectedRoles(next);
    };

    const originalRoleIds = editing?.roles?.map(role => role.id) ?? [];
    const added = selectedRoles.filter(id => !originalRoleIds.includes(id));
    const removed = originalRoleIds.filter(id => !selectedRoles.includes(id));
    const hasChanges = added.length > 0 || removed.length > 0;
    const grantsSuperAdmin = superAdminRoleId !== undefined && added.includes(superAdminRoleId);

    const save = () => {
        if (!editing) return;
        Modal.confirm({
            title: `Update roles for ${editing.name}?`,
            content: grantsSuperAdmin
                ? "This grants SUPERADMIN — full access to the club, including role management."
                : "They will see this change the next time they sign in.",
            okText: "Update roles",
            onOk: () =>
                assignRoles({
                    playerRoleMappings: { [editing.id.toString()]: selectedRoles },
                    ...(isAccountantSelected && selectedCashAccount !== undefined
                        ? { cashAccountSelections: { [editing.id.toString()]: selectedCashAccount } }
                        : {}),
                })
                    .unwrap()
                    .then(() => {
                        message.success(`Roles updated for ${editing.name}`);
                        closeEditor();
                    })
                    .catch(err => {
                        message.error(err?.data?.message || "Failed to update roles");
                    }),
        });
    };

    const memberCell = (member: IPlayer) => (
        <Space size={10}>
            <PlayerAvatar
                src={toAbsolutePlayerPhotoUrl(member.photoUrl) || undefined}
                name={member.name}
                size={38}
                style={{
                    flexShrink: 0,
                    backgroundColor: club.navySoft,
                    color: club.goldSoft,
                    border: `2px solid ${member.active ? club.gold : "rgba(128,128,128,0.35)"}`,
                    fontWeight: 600,
                }}
            >
                {initials(member.name)}
            </PlayerAvatar>
            <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: "block", lineHeight: 1.3 }} ellipsis>
                    {member.name}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                    {member.email}
                </Text>
            </div>
        </Space>
    );

    const roleTags = (member: IPlayer) => (
        <Space size={[4, 4]} wrap>
            {[...(member.roles ?? [])]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(role => (
                    <Tag key={role.id} color={roleColor(role.name)} style={{ margin: 0 }}>
                        {role.name}
                    </Tag>
                ))}
        </Space>
    );

    const columns: ColumnsType<IPlayer> = [
        {
            title: "Member",
            key: "member",
            render: (_, member) => memberCell(member),
            sorter: (a, b) => (a.name ?? "").localeCompare(b.name ?? ""),
        },
        {
            title: "ID",
            dataIndex: "employeeId",
            key: "employeeId",
            width: 110,
            render: (employeeId: string) => (
                <Text type="secondary" style={{ fontSize: 12, ...scoreNum }}>
                    {employeeId || "—"}
                </Text>
            ),
        },
        {
            title: "Roles",
            key: "roles",
            render: (_, member) => roleTags(member),
        },
        ...(isSuperAdmin
            ? [
                  {
                      title: "",
                      key: "action",
                      width: 120,
                      render: (_: unknown, member: IPlayer) => (
                          <Button size="small" onClick={() => openEditor(member)}>
                              Edit roles
                          </Button>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card
                style={{
                    background: club.panel,
                    border: `1px solid ${club.panelBorder}`,
                }}
                styles={{ body: { padding: isMobile ? 16 : 20 } }}
            >
                <Space align="start" size={12}>
                    <SafetyCertificateOutlined style={{ fontSize: 26, color: club.gold }} />
                    <div>
                        <Title level={4} style={{ margin: 0, color: club.textPrimary }}>
                            Role Management
                        </Title>
                        <Text style={{ color: club.textMuted }}>
                            {isSuperAdmin
                                ? "Who holds which role across the club, and where to change it."
                                : "Who holds which role across the club. Only a superadmin can change them."}
                        </Text>
                    </div>
                </Space>
            </Card>

            {/* Role overview — each tile filters the list below to that role's holders. */}
            <Row gutter={[12, 12]}>
                <Col xs={12} sm={8} md={6} lg={4}>
                    <RoleTile
                        label="All members"
                        count={members.length}
                        icon
                        selected={roleFilter === "ALL"}
                        onClick={() => setRoleFilter("ALL")}
                    />
                </Col>
                {[...roles]
                    .sort((a, b) => (roleCounts[b.name] ?? 0) - (roleCounts[a.name] ?? 0))
                    .map(role => (
                        <Col xs={12} sm={8} md={6} lg={4} key={role.id}>
                            <RoleTile
                                label={role.name}
                                count={roleCounts[role.name] ?? 0}
                                hint={ROLE_HINTS[role.name]}
                                selected={roleFilter === role.name}
                                onClick={() => setRoleFilter(role.name)}
                            />
                        </Col>
                    ))}
            </Row>

            <Card styles={{ body: { padding: isMobile ? 12 : 20 } }}>
                <Space
                    style={{ width: "100%", marginBottom: 14, justifyContent: "space-between" }}
                    wrap
                >
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Search by name, email or ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: isMobile ? "100%" : 320 }}
                    />
                    <Text type="secondary">
                        {visibleMembers.length}
                        {roleFilter === "ALL" ? " members" : ` with ${roleFilter}`}
                    </Text>
                </Space>

                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                ) : visibleMembers.length === 0 ? (
                    <Empty description="No members match this filter" />
                ) : isMobile ? (
                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        {visibleMembers.map(member => (
                            <div
                                key={member.id}
                                style={{
                                    border: "1px solid rgba(128,128,128,0.22)",
                                    borderRadius: 10,
                                    padding: 12,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                    }}
                                >
                                    {memberCell(member)}
                                    {isSuperAdmin && (
                                        <Button size="small" onClick={() => openEditor(member)}>
                                            Edit
                                        </Button>
                                    )}
                                </div>
                                <div style={{ marginTop: 10 }}>{roleTags(member)}</div>
                            </div>
                        ))}
                    </Space>
                ) : (
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={visibleMembers}
                        pagination={{ pageSize: 12, showSizeChanger: false }}
                        size="middle"
                    />
                )}
            </Card>

            <Modal
                open={isSuperAdmin && editing !== null}
                title={`Roles for ${editing?.name ?? ""}`}
                onCancel={closeEditor}
                width={520}
                maskClosable={false}
                destroyOnClose
                footer={[
                    <Button key="cancel" onClick={closeEditor}>
                        Cancel
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={isSaving}
                        disabled={!hasChanges || selectedRoles.length === 0}
                        onClick={save}
                    >
                        Update roles
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Roles"
                        extra="PLAYER is club membership itself, so it cannot be taken away here."
                    >
                        <Select
                            mode="multiple"
                            value={selectedRoles}
                            onChange={handleRoleChange}
                            style={{ width: "100%" }}
                            optionFilterProp="label"
                            options={roles.map(role => ({
                                value: role.id,
                                label: role.name,
                                // A disabled option keeps its tag non-closable, which is how these
                                // two rules stay enforced in the UI as well as on the server.
                                disabled:
                                    role.id === playerRoleId ||
                                    (isEditingSelf && role.id === superAdminRoleId),
                            }))}
                        />
                    </Form.Item>

                    {isEditingSelf && (
                        <Alert
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message="This is your own account"
                            description="You cannot remove your own SUPERADMIN role — that would lock you out of this page. Ask another superadmin to do it."
                        />
                    )}

                    {grantsSuperAdmin && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message="Granting SUPERADMIN"
                            description="They get full access to the club, including role management and cash accounts."
                        />
                    )}

                    {isAccountantSelected && (
                        <Form.Item
                            label="Cash account they hold"
                            extra="Club money this member collects or pays out moves through this account. Leave it on 'Create a new account' unless they already have one."
                        >
                            <Select
                                allowClear
                                placeholder="Create a new account"
                                value={selectedCashAccount}
                                onChange={value => setSelectedCashAccount(value)}
                                style={{ width: "100%" }}
                                optionLabelProp="label"
                            >
                                {cashAccountsData?.content?.map(account => {
                                    const heldByAnother =
                                        account.holderId !== null && account.holderId !== editing?.id;
                                    return (
                                        <Select.Option
                                            key={account.id}
                                            value={account.id}
                                            label={account.name}
                                            disabled={heldByAnother}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 8,
                                                }}
                                            >
                                                <span>
                                                    {account.name}{" "}
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {account.code}
                                                    </Text>
                                                </span>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {heldByAnother
                                                        ? `held by ${account.holderName}`
                                                        : `balance ${account.balance?.toFixed(2)}`}
                                                </Text>
                                            </div>
                                        </Select.Option>
                                    );
                                })}
                            </Select>
                        </Form.Item>
                    )}
                </Form>

                {hasChanges && (
                    <div style={{ borderTop: "1px solid rgba(128,128,128,0.2)", paddingTop: 12 }}>
                        <Text strong style={{ fontSize: 13 }}>
                            Pending changes
                        </Text>
                        <div style={{ marginTop: 8 }}>
                            <Space size={[4, 4]} wrap>
                                {added.map(id => (
                                    <Tag key={`add-${id}`} color="success">
                                        + {roles.find(r => r.id === id)?.name}
                                    </Tag>
                                ))}
                                {removed.map(id => (
                                    <Tag key={`remove-${id}`} color="error">
                                        − {roles.find(r => r.id === id)?.name}
                                    </Tag>
                                ))}
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </Space>
    );
}

interface RoleTileProps {
    label: string;
    count: number;
    hint?: string;
    icon?: boolean;
    selected: boolean;
    onClick: () => void;
}

function RoleTile({ label, count, hint, icon, selected, onClick }: RoleTileProps) {
    const tile = (
        <Card
            hoverable
            onClick={onClick}
            styles={{ body: { padding: 14 } }}
            style={{
                height: "100%",
                cursor: "pointer",
                borderColor: selected ? club.gold : undefined,
                borderWidth: selected ? 2 : 1,
                background: selected ? club.panel : undefined,
            }}
        >
            <Text
                style={{
                    ...kicker,
                    display: "block",
                    color: selected ? club.goldSoft : undefined,
                }}
                ellipsis
            >
                {icon ? <TeamOutlined /> : null} {label}
            </Text>
            <Text
                strong
                style={{
                    ...scoreNum,
                    fontSize: 22,
                    color: selected ? club.textPrimary : undefined,
                }}
            >
                {count}
            </Text>
        </Card>
    );

    return hint ? <Tooltip title={hint}>{tile}</Tooltip> : tile;
}
