import React, { useState } from 'react';
import { Card, Button, Typography, Space, message, Badge, theme, Modal, List, Avatar } from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import {
    useGetLatestTournamentWithUserStatusQuery,
    useAddParticipationToTournamentMutation,
    useGetTournamentParticipantsListQuery,
} from '../../state/features/tournaments/tournamentsSlice';
import { showBdLocalTime } from '../../utils/utils';
import { useSelector } from 'react-redux';
import { selectLoginInfo } from '../../state/slices/loginInfoSlice';
import { Link } from 'react-router-dom';
import { TournamentPlayerInfoType } from '../../state/features/tournaments/tournamentTypes';
import { normalizeErrorMessage } from '../../utils/normalizeErrorMessage';

const { Title, Text } = Typography;

const getErrorMessage = (error: any) => {
    return normalizeErrorMessage(error, 'Failed to update participation status');
};
const LatestTournamentCard: React.FC = () => {
    const loginInfo = useSelector(selectLoginInfo);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'pending' | 'not-joining' | null>(null);
    const { token } = theme.useToken();
    
    const { 
        data: latestTournamentData, 
        isLoading, 
        refetch 
    } = useGetLatestTournamentWithUserStatusQuery();

    const latestTournamentId = latestTournamentData?.content?.tournament?.id;
    const tournamentStatus = latestTournamentData?.content?.tournament?.tournamentStatus;
    const { data: tournamentParticipantsData } = useGetTournamentParticipantsListQuery(
        { tournamentId: latestTournamentId ?? 0 },
        { skip: !latestTournamentId || tournamentStatus === 'CONCLUDED' }
    );
    
    const [addParticipationToTournament] = useAddParticipationToTournamentMutation();

    const handleParticipationChange = async (e: any) => {
        const value = e.target.value;
        if (!latestTournamentData?.content || !loginInfo.userId) return;

        let participationStatus: boolean | null = null;
        if (value === 'true') participationStatus = true;
        else if (value === 'false') participationStatus = false;

        setIsUpdating(true);
        
        try {
            const payload: any = {
                tournamentId: latestTournamentData.content.tournament.id,
                playerId: Number(loginInfo.userId),
                participationStatus,
                comments: "",
            };

            // Include tournamentParticipantId if it exists in the response
            if (latestTournamentData.content.tournamentParticipantId) {
                payload.tournamentParticipantId = latestTournamentData.content.tournamentParticipantId;
            }

            await addParticipationToTournament(payload).unwrap();

            const statusMessage = participationStatus === true 
                ? 'Successfully joined the tournament!' 
                : participationStatus === false 
                ? 'Updated to not participating' 
                : 'Response cleared';
            
            message.success(statusMessage);
            refetch();
        } catch (error: any) {
            message.error(getErrorMessage(error));
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <Card loading style={{ borderRadius: 8 }}>
                <div style={{ height: 60 }} />
            </Card>
        );
    }

    if (!latestTournamentData?.content) {
        return (
            <Card style={{ borderRadius: 8, textAlign: 'center', padding: '20px 0' }}>
                <TrophyOutlined style={{ fontSize: 32, color: token.colorTextDisabled, marginBottom: 8 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>No upcoming tournaments</Text>
            </Card>
        );
    }

    const { tournament, totalParticipant, remainParticipant, totalPlayer, isUserParticipated } = latestTournamentData.content;

    const tournamentPlayers = tournamentParticipantsData?.content?.players || [];
    const hasPlayerStatusData = tournamentPlayers.length > 0;

    const confirmedCount = hasPlayerStatusData
        ? tournamentPlayers.filter((p) => p.participationStatus === true).length
        : totalParticipant;

    const notJoiningCount = hasPlayerStatusData
        ? tournamentPlayers.filter((p) => p.participationStatus === false).length
        : 0;

    const pendingCount = hasPlayerStatusData
        ? tournamentPlayers.filter((p) => p.participationStatus === null).length
        : remainParticipant;

    const fillPercent = totalPlayer > 0 ? Math.round((confirmedCount / totalPlayer) * 100) : 0;

    const getCountdownText = () => {
        const diffMs = new Date(tournament.tournamentDate).getTime() - Date.now();
        if (tournament.tournamentStatus === 'ONGOING') return 'Happening now';
        if (diffMs <= 0) return 'Match started';

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
        return 'Starting soon';
    };

    const getPlayersBySelectedStatus = (): TournamentPlayerInfoType[] => {
        if (!selectedStatus) return [];

        if (selectedStatus === 'confirmed') {
            return tournamentPlayers.filter((p) => p.participationStatus === true);
        }
        if (selectedStatus === 'not-joining') {
            return tournamentPlayers.filter((p) => p.participationStatus === false);
        }
        return tournamentPlayers.filter((p) => p.participationStatus === null);
    };

    const getPlayerColumns = (players: TournamentPlayerInfoType[]) => {
        const chunkSize = 10;
        const columns: TournamentPlayerInfoType[][] = [];

        for (let i = 0; i < players.length; i += chunkSize) {
            columns.push(players.slice(i, i + chunkSize));
        }

        return columns;
    };

    const getModalTitle = () => {
        if (selectedStatus === 'confirmed') return 'Confirmed Players';
        if (selectedStatus === 'not-joining') return 'Not Joining Players';
        return 'Pending Players';
    };

    const openStatusModal = (status: 'confirmed' | 'pending' | 'not-joining') => {
        setSelectedStatus(status);
        setIsStatusModalOpen(true);
    };

    const selectedPlayers = getPlayersBySelectedStatus();
    const playerColumns = getPlayerColumns(selectedPlayers);
    const modalWidth = Math.min(Math.max(360, playerColumns.length * 270 + 64), 980);

    console.log('Latest Tournament Data:', latestTournamentData);
    console.log('User Participation Status:', isUserParticipated);
    
    const getStatusBadge = () => {
        switch (tournament.tournamentStatus) {
            case 'UPCOMING':
                return <Badge status="processing" text="Upcoming" />;
            case 'ONGOING':
                return <Badge status="success" text="Ongoing" />;
            case 'COMPLETED':
                return <Badge status="default" text="Completed" />;
            default:
                return <Badge status="default" text={tournament.tournamentStatus} />;
        }
    };

    const getParticipationValue = () => {
        if (isUserParticipated === true) return 'true';
        if (isUserParticipated === false) return 'false';
        return 'null';
    };

    return (
        <Card
            style={{ 
                borderRadius: 16, 
                border: `1px solid ${token.colorBorder}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
                transition: 'all 0.3s ease',
                overflow: 'hidden'
            }}
            styles={{
                body: { padding: '20px' }
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
        >
            {/* Everything in one unified row */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'stretch',
                gap: 14
            }}>
                {/* Match identity */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px',
                    borderRadius: 10,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                    <div style={{
                        background: token.colorPrimary,
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <TrophyOutlined style={{ fontSize: 18, color: 'white' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600, color: token.colorText }}>
                                {tournament.name}
                            </Title>
                            {getStatusBadge()}
                        </div>
                        <Space size={14} wrap style={{ marginTop: 3 }}>
                            <Space size={5}>
                                <CalendarOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
                                <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                    {showBdLocalTime(tournament.tournamentDate)}
                                </Text>
                            </Space>
                            <Space size={5}>
                                <EnvironmentOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
                                <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                    {tournament.venueName}
                                </Text>
                            </Space>
                        </Space>
                    </div>
                </div>

                {/* Stats block: Total+Confirmed on top, Pending+Not Joining below */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, auto)',
                    alignContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 10,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                    {[
                        { label: 'Total', value: totalPlayer, color: token.colorInfo, onClick: undefined as (() => void) | undefined },
                        { label: 'Confirmed', value: confirmedCount, color: token.colorSuccess, onClick: () => openStatusModal('confirmed') },
                        { label: 'Pending', value: pendingCount, color: token.colorWarning, onClick: () => openStatusModal('pending') },
                        { label: 'Not Joining', value: notJoiningCount, color: token.colorError, onClick: () => openStatusModal('not-joining') },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            role={stat.onClick ? 'button' : undefined}
                            tabIndex={stat.onClick ? 0 : undefined}
                            onClick={stat.onClick}
                            onKeyDown={stat.onClick ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    stat.onClick!();
                                }
                            } : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 7,
                                padding: '8px 14px',
                                borderRadius: 8,
                                background: `${stat.color}14`,
                                border: `1px solid ${stat.color}30`,
                                cursor: stat.onClick ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Text strong style={{ fontSize: 16, color: stat.color, lineHeight: 1 }}>{stat.value}</Text>
                            <Text style={{ fontSize: 12, color: stat.color, opacity: 0.85, whiteSpace: 'nowrap' }}>{stat.label}</Text>
                        </div>
                    ))}
                </div>

                {/* Participation block: label on top, Yes/No/Later below */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                    <Text strong style={{ fontSize: 12, color: token.colorText, whiteSpace: 'nowrap' }}>
                        Your Participation:
                    </Text>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { value: 'true', label: 'Yes', icon: <CheckCircleOutlined />, color: token.colorSuccess },
                            { value: 'false', label: 'No', icon: <CloseCircleOutlined />, color: token.colorError },
                            { value: 'null', label: 'Later', icon: <QuestionCircleOutlined />, color: token.colorTextSecondary },
                        ].map((opt) => {
                            const active = getParticipationValue() === opt.value;
                            return (
                                <div
                                    key={opt.value}
                                    role="button"
                                    tabIndex={isUpdating ? -1 : 0}
                                    onClick={() => !isUpdating && handleParticipationChange({ target: { value: opt.value } })}
                                    onKeyDown={(e) => {
                                        if (!isUpdating && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            handleParticipationChange({ target: { value: opt.value } });
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                                        border: `1.5px solid ${active ? opt.color : token.colorBorder}`,
                                        background: active ? opt.color : token.colorBgContainer,
                                        color: active ? '#fff' : opt.color,
                                        opacity: isUpdating ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Countdown + fill progress */}
                <div style={{
                    flex: '1 1 200px',
                    minWidth: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}>
                    <Space size={6}>
                        <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 13 }} />
                        <Text strong style={{ fontSize: 12, color: token.colorText }}>
                            {getCountdownText()}
                        </Text>
                    </Space>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>Slots filled</Text>
                            <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                                {confirmedCount}/{totalPlayer} ({fillPercent}%)
                            </Text>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: token.colorBorderSecondary, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${fillPercent}%`,
                                background: token.colorSuccess,
                                borderRadius: 3,
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                </div>

                {/* View Details */}
                <Link to={`/tournaments/join-tournament/${tournament.id}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="primary"
                        icon={<TeamOutlined />}
                        size="middle"
                        style={{
                            borderRadius: 8,
                            fontWeight: '500',
                            height: 38,
                            paddingLeft: 16,
                            paddingRight: 16,
                            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                            border: 'none',
                            boxShadow: `0 2px 8px ${token.colorPrimary}30`
                        }}
                    >
                        View Details
                    </Button>
                </Link>
            </div>

            <Modal
                title={getModalTitle()}
                open={isStatusModalOpen}
                onCancel={() => setIsStatusModalOpen(false)}
                footer={null}
                width={modalWidth}
                styles={{
                    content: {
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorder}`,
                        borderRadius: 12,
                    },
                    header: {
                        background: 'transparent',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        marginBottom: 12,
                    },
                    body: {
                        background: 'transparent',
                    },
                }}
            >
                {selectedPlayers.length === 0 ? (
                    <Text type="secondary">No players found for this status.</Text>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 16,
                            alignItems: 'flex-start',
                            justifyContent: playerColumns.length === 1 ? 'center' : 'flex-start',
                            paddingBottom: 4,
                        }}
                    >
                        {playerColumns.map((columnPlayers, columnIndex) => (
                            <div
                                key={`column-${columnIndex}`}
                                style={{
                                    minWidth: 240,
                                    flex: '0 0 240px',
                                    border: `1px solid ${token.colorBorder}`,
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    background: token.colorBgElevated,
                                }}
                            >
                                <Text
                                    type="secondary"
                                    style={{
                                        display: 'block',
                                        fontSize: 12,
                                        marginBottom: 8,
                                    }}
                                >
                                    Players {columnIndex * 10 + 1} - {columnIndex * 10 + columnPlayers.length}
                                </Text>

                                <List
                                    size="small"
                                    dataSource={columnPlayers}
                                    renderItem={(player) => (
                                        <List.Item
                                            style={{
                                                padding: '8px 0',
                                                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        size="small"
                                                        icon={<UserOutlined />}
                                                        style={{
                                                            background: token.colorPrimaryBg,
                                                            color: token.colorPrimary,
                                                        }}
                                                    />
                                                }
                                                title={
                                                    <span style={{ fontSize: 13, color: token.colorText, fontWeight: 600 }}>
                                                        {player.playerName}
                                                    </span>
                                                }
                                                description={
                                                    <span style={{ color: token.colorTextSecondary }}>
                                                        ID: {player.employeeId}
                                                    </span>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default LatestTournamentCard;
