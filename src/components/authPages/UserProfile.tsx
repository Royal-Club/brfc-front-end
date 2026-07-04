import { useEffect, useMemo } from "react";
import {
    Card,
    Col,
    Row,
    Avatar,
    Typography,
    Skeleton,
    Tabs,
    Form,
    Input,
    Button,
    Select,
    Timeline,
    Empty,
    Spin,
    Tag,
    Space,
    message,
    theme,
} from "antd";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import {
    UserOutlined,
    PhoneOutlined,
    IdcardOutlined,
    MailOutlined,
    MessageOutlined,
    LockOutlined,
    EditOutlined,
    TrophyOutlined,
} from "@ant-design/icons";
import "./authStyles.css";
import companyLogo from "../../assets/logo.png";
import {
    useGetUserProfileQuery,
    useChangePasswordMutation,
    useUpdatePlayerDataMutation,
} from "../../state/features/auth/authSlice";
import {
    useGetPlayerPositionsQuery,
    useGetMyGoalkeepingHistoryQuery,
} from "../../state/features/player/playerSlice";
import { useGetPlayerStatisticsQuery } from "../../state/features/statistics/statisticsSlice";
import { showBdLocalTime } from "../../utils/utils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import useIsMobile from "../../hooks/useIsMobile";
import { club } from "../../theme/clubTheme";

const { Title, Text } = Typography;
const { Option } = Select;

export default function UserProfile() {
    const loginInfo = useSelector(selectLoginInfo);
    const isMobile = useIsMobile(576);
    const {
        token: {
            colorTextSecondary,
            colorBorderSecondary,
            colorFillTertiary,
            colorBgContainer,
            colorPrimary,
            colorWarning,
            colorError,
        },
    } = theme.useToken();

    const {
        data: playerProfileData,
        isLoading,
        refetch,
    } = useGetUserProfileQuery({ id: loginInfo?.userId }, { skip: !loginInfo?.userId });

    const profile = playerProfileData?.content;

    // Resolve the player's photo: prefer the profile's own photoUrl, fall back
    // to the synced store image. Coerce empty strings to undefined so the
    // Avatar shows the icon instead of trying to load an empty src.
    const avatarSrc =
        toAbsolutePlayerPhotoUrl(profile?.photoUrl) || loginInfo.image || undefined;

    const { data: playerPositions } = useGetPlayerPositionsQuery();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
    const [updatePlayerData, { isLoading: isUpdating }] = useUpdatePlayerDataMutation();

    const {
        data: goalkeepingHistoryData,
        isLoading: isLoadingGoalkeeping,
    } = useGetMyGoalkeepingHistoryQuery();

    // Real aggregate stats for this player (across all tournaments).
    const { data: statsData } = useGetPlayerStatisticsQuery({ limit: 300 });
    const myStats = useMemo(
        () =>
            statsData?.content?.find((s) => s.playerId === Number(loginInfo?.userId))
                ?.statistics,
        [statsData, loginInfo?.userId]
    );

    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // Prefill the edit form once the profile loads.
    useEffect(() => {
        if (profile) {
            profileForm.setFieldsValue({
                name: profile.name,
                email: profile.email,
                employeeId: profile.employeeId,
                skypeId: profile.skypeId,
                mobileNo: profile.mobileNo,
                playingPosition: profile.playingPosition,
            });
        }
    }, [profile, profileForm]);

    const handleUpdateProfile = (values: any) => {
        updatePlayerData({ id: Number(loginInfo.userId), data: values })
            .unwrap()
            .then(() => {
                message.success("Profile updated successfully");
                refetch();
            })
            .catch((err: any) => {
                message.error(err?.data?.message || "Failed to update profile");
            });
    };

    const handleChangePassword = (values: any) => {
        changePassword({
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
        })
            .unwrap()
            .then(() => {
                message.success("Password updated successfully");
                passwordForm.resetFields();
            })
            .catch((err: any) => {
                message.error(err?.data?.message || "Failed to update password");
            });
    };

    // Glassmorphic stat tile with a colored accent bar — reads clearly on the
    // dark hero banner.
    const heroStat = (label: string, value: number, accent: string) => (
        <div
            style={{
                position: "relative",
                minWidth: 84,
                textAlign: "center",
                padding: "13px 16px 11px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: accent,
                }}
            />
            <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", lineHeight: 1.1 }}>
                {value}
            </div>
            <div
                style={{
                    fontSize: 10.5,
                    color: "rgba(255, 255, 255, 0.75)",
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                }}
            >
                {label}
            </div>
        </div>
    );

    const infoRow = (icon: React.ReactNode, label: string, value?: string) => (
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
            <div
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: colorFillTertiary,
                    color: colorPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Text
                    type="secondary"
                    style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                    {label}
                </Text>
                <Text
                    style={{ fontSize: 14 }}
                    type={value ? undefined : "secondary"}
                    ellipsis={value ? { tooltip: value } : undefined}
                >
                    {value || "—"}
                </Text>
            </div>
        </div>
    );

    const disciplineTile = (label: string, value: number, color: string) => (
        <div
            style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: colorBgContainer,
                border: `1px solid ${colorBorderSecondary}`,
                borderLeft: `3px solid ${color}`,
            }}
        >
            <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
            <span style={{ fontSize: 12, color: colorTextSecondary }}>{label}</span>
        </div>
    );

    const tabItems = [
        {
            key: "edit",
            label: (
                <span>
                    <EditOutlined /> Edit Profile
                </span>
            ),
            children: (
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    style={{ maxWidth: 560 }}
                >
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: "Name is required" }]}
                            >
                                <Input placeholder="Full name" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: "Email is required" },
                                    { type: "email", message: "Enter a valid email" },
                                ]}
                            >
                                <Input placeholder="Email" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Employee ID" name="employeeId">
                                <Input placeholder="Employee ID" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Mobile No" name="mobileNo">
                                <Input placeholder="Mobile number" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Skype ID" name="skypeId">
                                <Input placeholder="Skype ID" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Playing Position" name="playingPosition">
                                <Select placeholder="Select position" allowClear>
                                    {playerPositions?.content?.map((position) => (
                                        <Option key={position.name} value={position.name}>
                                            {position.description}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Button type="primary" htmlType="submit" loading={isUpdating}>
                        Save Changes
                    </Button>
                </Form>
            ),
        },
        {
            key: "password",
            label: (
                <span>
                    <LockOutlined /> Change Password
                </span>
            ),
            children: (
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    style={{ maxWidth: 400 }}
                >
                    <Form.Item
                        label="Current Password"
                        name="oldPassword"
                        rules={[{ required: true, message: "Enter your current password" }]}
                    >
                        <Input.Password placeholder="Current password" />
                    </Form.Item>
                    <Form.Item
                        label="New Password"
                        name="newPassword"
                        rules={[
                            { required: true, message: "Enter a new password" },
                            { min: 6, message: "Password must be at least 6 characters" },
                        ]}
                    >
                        <Input.Password placeholder="New password" />
                    </Form.Item>
                    <Form.Item
                        label="Confirm New Password"
                        name="confirmPassword"
                        dependencies={["newPassword"]}
                        rules={[
                            { required: true, message: "Confirm your new password" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("newPassword") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Passwords do not match"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Confirm new password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={isChangingPassword}>
                        Update Password
                    </Button>
                </Form>
            ),
        },
        {
            key: "goalkeeping",
            label: (
                <span>
                    <TrophyOutlined /> Goalkeeping History
                </span>
            ),
            children: isLoadingGoalkeeping ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin />
                </div>
            ) : goalkeepingHistoryData?.content && goalkeepingHistoryData.content.length > 0 ? (
                <div>
                    <Text type="secondary">
                        You have played as goalkeeper{" "}
                        <Text strong>{goalkeepingHistoryData.content.length}</Text> times.
                    </Text>
                    <Timeline
                        mode="left"
                        style={{ marginTop: 20 }}
                        items={goalkeepingHistoryData.content.map((record, index) => ({
                            dot: <TrophyOutlined style={{ color: club.gold }} />,
                            children: (
                                <div
                                    style={{
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: `1px solid ${colorBorderSecondary}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                        }}
                                    >
                                        <Text strong>Round {record.roundNumber}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            #{goalkeepingHistoryData.content.length - index}
                                        </Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {showBdLocalTime(record.playedDate)}
                                    </Text>
                                </div>
                            ),
                        }))}
                    />
                </div>
            ) : (
                <Empty description="No goalkeeping history yet" />
            ),
        },
    ];

    return (
        <div className="userProfileContainer">
            {/* Hero header */}
            <Card
                style={{ marginBottom: 16, overflow: "hidden" }}
                bodyStyle={{ padding: 0 }}
            >
                <div
                    className="profile-hero"
                    style={{
                        position: "relative",
                        padding: isMobile ? "24px 16px 28px" : "32px 32px",
                        boxShadow: "inset 0 -50px 90px rgba(0,0,0,0.38)",
                        background: `
                            radial-gradient(130% 100% at 50% -25%, rgba(255,255,255,0.08), transparent 55%),
                            radial-gradient(circle at 16% 28%, rgba(198, 161, 91, 0.26), transparent 45%),
                            radial-gradient(circle at 88% 115%, rgba(198, 161, 91, 0.14), transparent 45%),
                            repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 14px),
                            linear-gradient(120deg, ${club.navySoft} 0%, ${club.navy} 55%, ${club.navyDeep} 100%)
                        `,
                    }}
                >
                    {/* Faint club crest watermark */}
                    <img
                        src={companyLogo}
                        alt=""
                        aria-hidden
                        style={{
                            position: "absolute",
                            right: isMobile ? 8 : 28,
                            top: "50%",
                            transform: "translateY(-50%)",
                            height: isMobile ? 120 : 200,
                            opacity: 0.07,
                            pointerEvents: "none",
                        }}
                    />

                    {/* Bottom accent line */}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 3,
                            background: `linear-gradient(90deg, ${club.gold} 0%, ${club.goldSoft} 45%, transparent 90%)`,
                        }}
                    />

                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: isMobile ? "center" : "flex-start",
                            gap: isMobile ? 16 : 24,
                        }}
                    >
                        {/* Avatar with gradient ring + active dot */}
                        <div
                            style={{
                                position: "relative",
                                padding: 3,
                                borderRadius: "50%",
                                background: `linear-gradient(135deg, ${club.gold}, ${club.goldSoft})`,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                                flexShrink: 0,
                            }}
                        >
                            <Avatar
                                size={isMobile ? 92 : 112}
                                src={avatarSrc}
                                icon={<UserOutlined />}
                                style={{ border: "3px solid #0b1f2a" }}
                            />
                            {profile?.active && (
                                <span
                                    title="Active player"
                                    style={{
                                        position: "absolute",
                                        bottom: 6,
                                        right: 6,
                                        width: 18,
                                        height: 18,
                                        borderRadius: "50%",
                                        background: "#52c41a",
                                        border: `3px solid ${club.navyDeep}`,
                                    }}
                                />
                            )}
                        </div>

                        <div style={{
                            flex: isMobile ? "1 1 100%" : 1,
                            minWidth: isMobile ? 0 : 220,
                            textAlign: isMobile ? "center" : "left",
                        }}>
                            <Title
                                level={2}
                                style={{
                                    margin: 0,
                                    color: "#ffffff",
                                    textShadow: "0 2px 10px rgba(0,0,0,0.35)",
                                    fontSize: isMobile ? 24 : undefined,
                                }}
                            >
                                {profile?.name || loginInfo.username}
                            </Title>
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.6)",
                                    fontSize: 13,
                                    marginTop: 2,
                                }}
                            >
                                {profile?.email || loginInfo.email}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    marginTop: 12,
                                    alignItems: "center",
                                    justifyContent: isMobile ? "center" : "flex-start",
                                }}
                            >
                                {profile?.playingPosition && (
                                    <span
                                        style={{
                                            padding: "3px 12px",
                                            borderRadius: 20,
                                            background: club.gold,
                                            color: club.navyDeep,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        {profile.playingPosition}
                                    </span>
                                )}
                                {loginInfo?.roles?.filter(Boolean).map((r) => (
                                    <span
                                        key={r}
                                        style={{
                                            padding: "3px 12px",
                                            borderRadius: 20,
                                            background: "rgba(255,255,255,0.14)",
                                            border: "1px solid rgba(255,255,255,0.25)",
                                            color: "#ffffff",
                                            fontSize: 12,
                                        }}
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Stat tiles */}
                        <div style={{
                            display: isMobile ? "grid" : "flex",
                            gridTemplateColumns: isMobile ? "1fr 1fr" : undefined,
                            gap: 10,
                            flexWrap: "wrap",
                            width: isMobile ? "100%" : undefined,
                        }}>
                            {heroStat("Matches", myStats?.matchesPlayed ?? 0, club.gold)}
                            {heroStat("Goals", myStats?.goalsScored ?? 0, club.pitch)}
                            {heroStat("Assists", myStats?.assists ?? 0, club.goldSoft)}
                            {heroStat("G+A", myStats?.goalsAndAssists ?? 0, "#ffffff")}
                        </div>
                    </div>
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card title="Player Details">
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : (
                            <>
                                {infoRow(<MailOutlined />, "Email", profile?.email || loginInfo.email)}
                                {infoRow(<PhoneOutlined />, "Mobile", profile?.mobileNo)}
                                {infoRow(<IdcardOutlined />, "Employee ID", profile?.employeeId)}
                                {infoRow(<MessageOutlined />, "Skype", profile?.skypeId)}

                                <div
                                    style={{
                                        marginTop: 12,
                                        paddingTop: 12,
                                        borderTop: `1px solid ${colorBorderSecondary}`,
                                    }}
                                >
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 11,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        Disciplinary Record
                                    </Text>
                                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                                        {disciplineTile("Yellow Cards", myStats?.yellowCards ?? 0, colorWarning)}
                                        {disciplineTile("Red Cards", myStats?.redCards ?? 0, colorError)}
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card>
                        <Tabs defaultActiveKey="edit" items={tabItems} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
