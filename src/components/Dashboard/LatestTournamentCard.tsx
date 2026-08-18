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
    ClockCircleOutlined,
    LockOutlined
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
import { club, kicker, scoreNum } from '../../theme/clubTheme';
import useIsMobile from '../../hooks/useIsMobile';

// Surfaces that read on the navy matchday panel
const { tileBg, tileBorder, textPrimary, textMuted } = club;

const { Title, Text } = Typography;

const getErrorMessage = (error: any) => {
    return normalizeErrorMessage(error, 'Failed to update participation status');
};
const LatestTournamentCard: React.FC = () => {
    const loginInfo = useSelector(selectLoginInfo);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'pending' | 'not-joining' | null>(null);
    const isMobile = useIsMobile();
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

    const { tournament, totalParticipant, remainParticipant, totalPlayer, isUserParticipated, votingLockedByName, participationSource } = latestTournamentData.content;

    // Two ways the RSVP shuts: the coordinator closes it to pick teams, or kick-off arrives. The
    // backend rejects both, so the buttons have to reflect it rather than letting people click into
    // an error toast.
    const votingLocked = Boolean(tournament.votingLocked);
    const kickoffPassed = new Date(tournament.tournamentDate).getTime() <= Date.now();
    const votingClosed = votingLocked || kickoffPassed;
    const lockContact = votingLockedByName || 'a coordinator';
    const votingClosedReason = !votingLocked
        ? 'Kick-off has passed — answers are closed.'
        // A No the lock wrote is not a decision this member made, and the plain "locked" wording
        // would leave them staring at an answer they never gave.
        : participationSource === 'AUTO_LOCK'
            ? `The team list was locked before you answered, so you are down as not playing. Contact ${lockContact} if you can make it.`
            : `Team list locked. Contact ${lockContact} to change your answer.`;

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
                borderRadius: 14,
                border: `1px solid ${club.panelBorder}`,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                background: club.panel,
                overflow: 'hidden'
            }}
            styles={{
                body: { padding: 0 }
            }}
        >
            {/* Matchday header strip */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 20px',
                background: 'rgba(0, 0, 0, 0.22)',
                borderBottom: `1px solid ${club.panelBorder}`,
            }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ ...kicker, color: club.gold, marginBottom: 2 }}>
                        ⚽ Matchday
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
                    }}>
                        <Title level={5} style={{
                            margin: 0, fontSize: 17, fontWeight: 700, color: textPrimary,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                            {tournament.name}
                        </Title>
                        {getStatusBadge()}
                    </div>
                    <Space size={16} wrap style={{ marginTop: 6 }}>
                        <Space size={6}>
                            <CalendarOutlined style={{ color: club.gold, fontSize: 13 }} />
                            <Text style={{ fontSize: 12, color: textMuted, ...scoreNum }}>
                                {showBdLocalTime(tournament.tournamentDate)}
                            </Text>
                        </Space>
                        <Space size={6}>
                            <EnvironmentOutlined style={{ color: club.gold, fontSize: 13 }} />
                            <Text style={{ fontSize: 12, color: textMuted }}>
                                {tournament.venueName}
                            </Text>
                        </Space>
                    </Space>
                </div>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0
                }}>
                    <Text style={{ ...kicker, fontSize: 10, color: textMuted }}>Kick-off</Text>
                    <Space size={5}>
                        <ClockCircleOutlined style={{ color: club.gold, fontSize: 12 }} />
                        <Text strong style={{ fontSize: 12, color: textPrimary, ...scoreNum }}>
                            {getCountdownText()}
                        </Text>
                    </Space>
                </div>
            </div>

            {/* Everything in one unified row */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'stretch',
                gap: 14,
                padding: '18px 20px',
            }}>
                {/* Stats block: Total+Confirmed on top, Pending+Not Joining below */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    alignContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 10,
                    background: tileBg,
                    border: tileBorder,
                    flex: isMobile ? '1 1 100%' : undefined,
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
                                background: `${stat.color}22`,
                                border: `1px solid ${stat.color}45`,
                                cursor: stat.onClick ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Text strong style={{ fontSize: 17, color: stat.color, lineHeight: 1, ...scoreNum }}>{stat.value}</Text>
                            <Text style={{ ...kicker, fontSize: 10, color: stat.color, opacity: 0.95, whiteSpace: 'nowrap' }}>{stat.label}</Text>
                        </div>
                    ))}
                </div>

                {/* Participation block: label on top, Yes/No/Later below */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: tileBg,
                    border: tileBorder,
                    flex: isMobile ? '1 1 100%' : undefined,
                }}>
                    <Text style={{ ...kicker, fontSize: 10, color: club.goldSoft, whiteSpace: 'nowrap' }}>
                        {votingClosed ? 'Your Call — Closed' : 'Your Call'}
                    </Text>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { value: 'true', label: 'Yes', icon: <CheckCircleOutlined />, color: token.colorSuccess },
                            { value: 'false', label: 'No', icon: <CloseCircleOutlined />, color: token.colorError },
                            { value: 'null', label: 'Later', icon: <QuestionCircleOutlined />, color: token.colorTextSecondary },
                        ].map((opt) => {
                            const active = getParticipationValue() === opt.value;
                            const disabled = isUpdating || votingClosed;
                            return (
                                <div
                                    key={opt.value}
                                    role="button"
                                    aria-disabled={disabled}
                                    tabIndex={disabled ? -1 : 0}
                                    onClick={() => !disabled && handleParticipationChange({ target: { value: opt.value } })}
                                    onKeyDown={(e) => {
                                        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            handleParticipationChange({ target: { value: opt.value } });
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                        flex: isMobile ? 1 : undefined,
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        border: `1.5px solid ${active ? opt.color : 'rgba(255,255,255,0.18)'}`,
                                        background: active ? opt.color : 'rgba(255,255,255,0.03)',
                                        color: active ? '#fff' : opt.color,
                                        // A locked answer still has to read as *your* answer, so the
                                        // active pill stays legible while the rest dims out.
                                        opacity: disabled ? (active ? 0.75 : 0.4) : 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    {votingClosed && (
                        <Text style={{ fontSize: 11, color: textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <LockOutlined style={{ color: club.gold }} />
                            {votingClosedReason}
                        </Text>
                    )}
                </div>

                {/* Squad fill progress */}
                <div style={{
                    flex: '1 1 200px',
                    minWidth: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: tileBg,
                    border: tileBorder,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Text style={{ ...kicker, fontSize: 10, color: club.goldSoft }}>Squad Filled</Text>
                        <Text strong style={{ fontSize: 13, color: textPrimary, ...scoreNum }}>
                            {confirmedCount}/{totalPlayer}
                            <span style={{ color: textMuted, fontWeight: 400, marginLeft: 6 }}>{fillPercent}%</span>
                        </Text>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${fillPercent}%`,
                            background: `linear-gradient(90deg, ${club.pitch} 0%, #43c46f 100%)`,
                            borderRadius: 4,
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>

                {/* View Details */}
                <Link
                    to={`/tournaments/join-tournament/${tournament.id}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: isMobile ? '1 1 100%' : undefined,
                    }}
                >
                    <Button
                        icon={<TeamOutlined />}
                        size="middle"
                        block={isMobile}
                        style={{
                            borderRadius: 8,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            height: 40,
                            paddingLeft: 20,
                            paddingRight: 20,
                            background: `linear-gradient(135deg, ${club.goldSoft} 0%, ${club.gold} 100%)`,
                            border: 'none',
                            color: club.navyDeep,
                            boxShadow: `0 2px 10px rgba(198, 161, 91, 0.35)`,
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
