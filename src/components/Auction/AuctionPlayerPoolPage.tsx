import React, { useState } from "react";
import { Card, Table, Tag, Button, Space, Typography, message, Select, InputNumber, Row, Col, Empty, Alert, Divider } from "antd";
import { PlusOutlined, DeleteOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetAuctionPlayersQuery,
  useAddExistingPlayerMutation,
  useAddFromRegistrationMutation,
  useRemoveAuctionPlayerMutation,
  useGetAuctionRegistrationsQuery,
} from "../../state/features/auction/auctionSlice";
import { AuctionPlayerResponse, AuctionPlayerCategory, AuctionPlayerStatus, AuctionRegistrationResponse } from "../../state/features/auction/auctionTypes";

const { Title, Text } = Typography;

const categoryColors: Record<AuctionPlayerCategory, string> = {
  ICON: "gold",
  A_GRADE: "blue",
  B_GRADE: "green",
  EMERGING: "cyan",
  OUTSIDE: "purple",
};

const statusColors: Record<AuctionPlayerStatus, string> = {
  AVAILABLE: "blue",
  ON_AUCTION: "orange",
  SOLD: "green",
  UNSOLD: "red",
  WITHDRAWN: "default",
};

const defaultBasePrices: Record<AuctionPlayerCategory, number> = {
  ICON: 20000,
  A_GRADE: 15000,
  B_GRADE: 10000,
  EMERGING: 5000,
  OUTSIDE: 3000,
};

interface PlayerAddState {
  category: AuctionPlayerCategory;
  basePrice: number;
}

const AuctionPlayerPoolPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);

  // Track category/price state per registration
  const [playerStates, setPlayerStates] = useState<Record<number, PlayerAddState>>({});

  const { data: players, isLoading } = useGetAuctionPlayersQuery(tid);
  const { data: registrations } = useGetAuctionRegistrationsQuery({ tournamentId: tid, status: "APPROVED" });
  const [addFromReg, { isLoading: addingReg }] = useAddFromRegistrationMutation();
  const [addExisting, { isLoading: addingExisting }] = useAddExistingPlayerMutation();
  const [removePlayer] = useRemoveAuctionPlayerMutation();

  // Filter out registrations already in the pool:
  // A registration is in pool if inAuctionPool is true, OR its createdPlayerId is already in poolPlayerIds
  const poolPlayerIds = new Set(players?.map(p => p.playerId) || []);
  const availableRegistrations = (registrations || []).filter(
    (r: AuctionRegistrationResponse) => !r.inAuctionPool && (!r.createdPlayerId || !poolPlayerIds.has(r.createdPlayerId))
  );

  const getState = (regId: number): PlayerAddState => {
    return playerStates[regId] || { category: "B_GRADE" as AuctionPlayerCategory, basePrice: 10000 };
  };

  const updateState = (regId: number, updates: Partial<PlayerAddState>) => {
    setPlayerStates(prev => ({
      ...prev,
      [regId]: { ...getState(regId), ...updates },
    }));
  };

  const handleCategoryChange = (regId: number, category: AuctionPlayerCategory) => {
    updateState(regId, { category, basePrice: defaultBasePrices[category] });
  };

  const handleAddToPool = async (reg: AuctionRegistrationResponse) => {
    const state = getState(reg.id);
    try {
      await addFromReg({
        tournamentId: tid,
        registrationId: reg.id,
        body: { category: state.category, basePrice: state.basePrice },
      }).unwrap();
      message.success(`${reg.name} added to pool!`);
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to add");
    }
  };

  const handleAddAll = async () => {
    let success = 0;
    for (const reg of availableRegistrations) {
      const state = getState(reg.id);
      try {
        await addFromReg({
          tournamentId: tid,
          registrationId: reg.id,
          body: { category: state.category, basePrice: state.basePrice },
        }).unwrap();
        success++;
      } catch (err: any) {
        message.error(`Failed to add ${reg.name}: ${err?.data?.message || "Error"}`);
      }
    }
    if (success > 0) message.success(`${success} player(s) added to pool!`);
  };

  const handleRemove = async (auctionPlayerId: number) => {
    try {
      await removePlayer({ tournamentId: tid, auctionPlayerId }).unwrap();
      message.success("Player removed from pool");
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to remove");
    }
  };

  // Pool table columns
  const poolColumns = [
    { title: "Player", dataIndex: "playerName", key: "playerName", render: (v: string) => <Text strong>{v}</Text> },
    { title: "ID", dataIndex: "employeeId", key: "employeeId" },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: AuctionPlayerCategory) => <Tag color={categoryColors[cat]}>{cat.replace("_", " ")}</Tag>,
    },
    { title: "Base Price", dataIndex: "basePrice", key: "basePrice", render: (v: number) => <Text strong>৳{v?.toLocaleString()}</Text> },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: AuctionPlayerStatus) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: "Sold For", dataIndex: "finalPrice", key: "finalPrice", render: (v?: number) => v ? `৳${v.toLocaleString()}` : "-" },
    { title: "Sold To", dataIndex: "soldToTeamName", key: "soldToTeamName", render: (v?: string) => v || "-" },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: AuctionPlayerResponse) =>
        record.status === "AVAILABLE" ? (
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(record.id)}>
            Remove
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={4}><UserOutlined /> Auction Player Pool</Title>

      {/* Section 1: Registered Players ready to add */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined />
            <Text strong>Approved Players — Ready to Add to Pool</Text>
            <Tag color="blue">{availableRegistrations.length} available</Tag>
          </Space>
        }
        extra={
          availableRegistrations.length > 0 && (
            <Button type="primary" onClick={handleAddAll} loading={addingReg}>
              Add All to Pool
            </Button>
          )
        }
        style={{ marginBottom: 24 }}
      >
        {availableRegistrations.length === 0 ? (
          <Empty description="All approved registrations are already in the pool (or no approved registrations yet)." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #303030", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>Player</th>
                  <th style={{ padding: "8px 12px" }}>Position</th>
                  <th style={{ padding: "8px 12px" }}>Category</th>
                  <th style={{ padding: "8px 12px" }}>Base Price</th>
                  <th style={{ padding: "8px 12px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableRegistrations.map((reg: AuctionRegistrationResponse) => {
                  const state = getState(reg.id);
                  return (
                    <tr key={reg.id} style={{ borderBottom: "1px solid #1f1f1f" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <Space direction="vertical" size={0}>
                          <Text strong>{reg.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{reg.employeeId} • {reg.email}</Text>
                        </Space>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Tag>{reg.playingPosition || "N/A"}</Tag>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Select
                          value={state.category}
                          onChange={(val) => handleCategoryChange(reg.id, val)}
                          style={{ width: 130 }}
                          size="small"
                        >
                          <Select.Option value="ICON">⭐ Icon</Select.Option>
                          <Select.Option value="A_GRADE">🅰️ A Grade</Select.Option>
                          <Select.Option value="B_GRADE">🅱️ B Grade</Select.Option>
                          <Select.Option value="EMERGING">🌱 Emerging</Select.Option>
                          <Select.Option value="OUTSIDE">🔷 Outside</Select.Option>
                        </Select>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <InputNumber
                          value={state.basePrice}
                          onChange={(val) => updateState(reg.id, { basePrice: val || 0 })}
                          min={0}
                          step={1000}
                          style={{ width: 120 }}
                          size="small"
                          formatter={value => `৳${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value!.replace(/৳|(,*)/g, '') as any}
                        />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddToPool(reg)}
                          loading={addingReg}
                        >
                          Add
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Section 2: Current Pool */}
      <Card
        title={
          <Space>
            <Text strong>Current Pool</Text>
            <Tag color="green">{players?.length || 0} players</Tag>
          </Space>
        }
      >
        {(!players || players.length === 0) ? (
          <Empty description="No players in the pool yet. Add players from the approved list above." />
        ) : (
          <Table
            dataSource={players}
            columns={poolColumns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            size="small"
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </div>
  );
};

export default AuctionPlayerPoolPage;
