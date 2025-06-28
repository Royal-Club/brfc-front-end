import React, { useState } from 'react';
import { Card, Button, Typography, Space, Row, Col, Radio, message, Tooltip, Badge, theme } from 'antd';
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
import { useGetLatestTournamentWithUserStatusQuery, useAddParticipationToTournamentMutation } from '../../state/features/tournaments/tournamentsSlice';
import { showBdLocalTime } from '../../utils/utils';
import { useSelector } from 'react-redux';
import { selectLoginInfo } from '../../state/slices/loginInfoSlice';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const LatestTournamentCard: React.FC = () => {
    const loginInfo = useSelector(selectLoginInfo);
    const [isUpdating, setIsUpdating] = useState(false);
    const { token } = theme.useToken();
    
    const { 
        data: latestTournamentData, 
        isLoading, 
        refetch 
    } = useGetLatestTournamentWithUserStatusQuery();
    
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
        } catch (error) {
            message.error('Failed to update participation status');
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

    const { tournament, totalParticipant, remainParticipant, totalPlayer, userParticipated } = latestTournamentData.content;

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
        if (userParticipated === true) return 'true';
        if (userParticipated === false) return 'false';
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
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
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
                            <Col xs={8} sm={8}>
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
                            <Col xs={8} sm={8}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '12px 6px', 
                                    background: `linear-gradient(135deg, ${token.colorSuccess}15 0%, ${token.colorSuccess}08 100%)`,
                                    border: `1px solid ${token.colorSuccess}30`,
                                    borderRadius: 8,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ 
                                        fontSize: 16, 
                                        fontWeight: 'bold', 
                                        color: token.colorSuccess,
                                        marginBottom: 2
                                    }}>
                                        {totalParticipant}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: '500' }}>
                                        Confirmed
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={8} sm={8}>
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '12px 6px', 
                                    background: `linear-gradient(135deg, ${token.colorWarning}15 0%, ${token.colorWarning}08 100%)`,
                                    border: `1px solid ${token.colorWarning}30`,
                                    borderRadius: 8,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ 
                                        fontSize: 16, 
                                        fontWeight: 'bold', 
                                        color: token.colorWarning,
                                        marginBottom: 2
                                    }}>
                                        {remainParticipant}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: '500' }}>
                                        Pending
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
        </Card>
    );
};

export default LatestTournamentCard;
