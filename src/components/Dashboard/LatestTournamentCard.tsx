import React, { useState } from 'react';
import { Card, Button, Typography, Space, Row, Col, Radio, message, Badge, theme, Modal, List, Avatar } from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined
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

const { Title, Text } = Typography;

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
    const { data: tournamentParticipantsData } = useGetTournamentParticipantsListQuery(
        { tournamentId: latestTournamentId ?? 0 },
        { skip: !latestTournamentId }
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
            {/* Header Section with Analytics */}
            <div style={{ 
                background: `linear-gradient(90deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}08 100%)`,
                margin: '-20px -20px 16px -20px',
                padding: '16px 20px',
                borderBottom: `1px solid ${token.colorBorder}`
            }}>
                <Row gutter={[16, 8]} align="top">
                    <Col xs={24} md={14}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{
                                background: token.colorPrimary,
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <TrophyOutlined style={{ fontSize: 16, color: 'white' }} />
                            </div>
                            <Title level={4} style={{ 
                                margin: 0, 
                                color: token.colorText, 
                                fontSize: 18,
                                fontWeight: '600'
                            }}>
                                {tournament.name}
                            </Title>
                        </div>
                        
                        <div style={{ marginLeft: 44, marginBottom: 8 }}>
                            {getStatusBadge()}
                        </div>
                        
                        <Space size={16} wrap style={{ marginLeft: 44 }}>
                            <Space size={6}>
                                <CalendarOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                                <Text style={{ fontSize: 13, color: token.colorTextSecondary, fontWeight: '500' }}>
                                    {showBdLocalTime(tournament.tournamentDate)}
                                </Text>
                            </Space>
                            <Space size={6}>
                                <EnvironmentOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                                <Text style={{ fontSize: 13, color: token.colorTextSecondary, fontWeight: '500' }}>
                                    {tournament.venueName}
                                </Text>
                            </Space>
                        </Space>
                    </Col>
                    
                    <Col xs={24} md={10}>
                        <Row gutter={[8, 8]}>
                            <Col xs={12} sm={6}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '12px 6px', 
                                    background: `linear-gradient(135deg, ${token.colorInfo}15 0%, ${token.colorInfo}08 100%)`,
                                    border: `1px solid ${token.colorInfo}30`,
                                    borderRadius: 8,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ 
                                        fontSize: 16, 
                                        fontWeight: 'bold', 
                                        color: token.colorInfo,
                                        marginBottom: 2
                                    }}>
                                        {totalPlayer}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: '500' }}>
                                        Total
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '12px 6px', 
                                    background: `linear-gradient(135deg, ${token.colorSuccess}15 0%, ${token.colorSuccess}08 100%)`,
                                    border: `1px solid ${token.colorSuccess}30`,
                                    borderRadius: 8,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => openStatusModal('confirmed')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openStatusModal('confirmed');
                                        }
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: 16, 
                                        fontWeight: 'bold', 
                                        color: token.colorSuccess,
                                        marginBottom: 2
                                    }}>
                                        {confirmedCount}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: '500' }}>
                                        Confirmed
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '12px 6px', 
                                    background: `linear-gradient(135deg, ${token.colorWarning}15 0%, ${token.colorWarning}08 100%)`,
                                    border: `1px solid ${token.colorWarning}30`,
                                    borderRadius: 8,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => openStatusModal('pending')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openStatusModal('pending');
                                        }
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: 16, 
                                        fontWeight: 'bold', 
                                        color: token.colorWarning,
                                        marginBottom: 2
                                    }}>
                                        {pendingCount}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: '500' }}>
                                        Pending
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '12px 6px', 
                                    background: `linear-gradient(135deg, ${token.colorError}15 0%, ${token.colorError}08 100%)`,
                                    border: `1px solid ${token.colorError}30`,
                                    borderRadius: 8,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => openStatusModal('not-joining')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openStatusModal('not-joining');
                                        }
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: 16, 
                                        fontWeight: 'bold', 
                                        color: token.colorError,
                                        marginBottom: 2
                                    }}>
                                        {notJoiningCount}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: '500' }}>
                                        Not Joining
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
            
            {/* Participation Status Section */}
            <div style={{
                background: token.colorBgLayout,
                borderRadius: 12,
                padding: '16px',
                border: `1px solid ${token.colorBorder}`
            }}>
                <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} md={14}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                background: token.colorPrimary,
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <UserOutlined style={{ fontSize: 12, color: 'white' }} />
                            </div>
                            <Text strong style={{ fontSize: 14, color: token.colorText }}>
                                Your Participation:
                            </Text>
                        </div>
                        <div style={{ marginTop: 8, marginLeft: 36 }}>
                            <Radio.Group
                                value={getParticipationValue()}
                                onChange={handleParticipationChange}
                                disabled={isUpdating}
                                size="small"
                                style={{ display: 'flex', gap: 8 }}
                            >
                                <Radio value="true" style={{ 
                                    fontSize: 13,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: getParticipationValue() === 'true' ? `${token.colorSuccess}15` : 'transparent'
                                }}>
                                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 4 }} />
                                    <span>Yes</span>
                                </Radio>
                                <Radio value="false" style={{ 
                                    fontSize: 13,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: getParticipationValue() === 'false' ? `${token.colorError}15` : 'transparent'
                                }}>
                                    <CloseCircleOutlined style={{ color: token.colorError, marginRight: 4 }} />
                                    <span>No</span>
                                </Radio>
                                <Radio value="null" style={{ 
                                    fontSize: 13,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: getParticipationValue() === 'null' ? `${token.colorTextSecondary}15` : 'transparent'
                                }}>
                                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary, marginRight: 4 }} />
                                    <span>Later</span>
                                </Radio>
                            </Radio.Group>
                        </div>
                    </Col>
                    
                    <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                        <Link to={`/tournaments/join-tournament/${tournament.id}`}>
                            <Button 
                                type="primary" 
                                icon={<TeamOutlined />} 
                                size="middle"
                                style={{ 
                                    borderRadius: 8,
                                    fontWeight: '500',
                                    height: 40,
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
                    </Col>
                </Row>
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
