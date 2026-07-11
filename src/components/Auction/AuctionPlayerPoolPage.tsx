import React, { useState } from "react";
import { Card, Table, Tag, Button, Space, Typography, message, Select, InputNumber, Empty, Tooltip, Popconfirm, Modal, Form } from "antd";
import { PlusOutlined, DeleteOutlined, UserOutlined, CheckCircleOutlined, UndoOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetAuctionPlayersQuery,
  useAddFromRegistrationMutation,
  useAddExistingPlayerMutation,
  useRemoveAuctionPlayerMutation,
  useRestoreAuctionPlayerMutation,
  useGetAuctionRegistrationsQuery,
} from "../../state/features/auction/auctionSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { AuctionPlayerResponse, AuctionPlayerCategory, AuctionPlayerStatus, AuctionRegistrationResponse } from "../../state/features/auction/auctionTypes";
import { AuctionPage, AuctionHeader, StatusPill } from "./AuctionAtoms";

const { Text } = Typography;

const categoryColors: Record<AuctionPlayerCategory, string> = {
  ICON: "gold",
  A_GRADE: "blue",
  B_GRADE: "green",
  EMERGING: "cyan",
  OUTSIDE: "purple",
};

const defaultBasePrices: Record<AuctionPlayerCategory, number> = {
  ICON: 20000,
  A_GRADE: 15000,
  B_GRADE: 10000,
  EMERGING: 5000,
  OUTSIDE: 3000,
};

const taka = (v?: number) => `৳${(v ?? 0).toLocaleString()}`;

interface PlayerAddState {
  category: AuctionPlayerCategory;
  basePrice: number;
}

const AuctionPlayerPoolPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);

  // Track category/price state per registration
  const [playerStates, setPlayerStates] = useState<Record<number, PlayerAddState>>({});

  // "Add existing player" modal (add a club member directly, no registration)
  const [existingModalOpen, setExistingModalOpen] = useState(false);
  const [existingForm] = Form.useForm();

  const { data: players, isLoading } = useGetAuctionPlayersQuery(tid);
  const { data: registrations } = useGetAuctionRegistrationsQuery({ tournamentId: tid, status: "APPROVED" });
  const { data: playersData } = useGetPlayersQuery();
  const [addFromReg, { isLoading: addingReg }] = useAddFromRegistrationMutation();
  const [addExisting, { isLoading: addingExisting }] = useAddExistingPlayerMutation();
  const [removePlayer] = useRemoveAuctionPlayerMutation();
  const [restorePlayer] = useRestoreAuctionPlayerMutation();

  const activePoolPlayers = (players || []).filter(p => p.status !== "WITHDRAWN");
  const withdrawnCount = (players || []).filter(p => p.status === "WITHDRAWN").length;

  // Filter out registrations already in the pool:
  // A registration is considered in pool only if player exists in active (non-withdrawn) pool.
  const poolPlayerIds = new Set(activePoolPlayers.map(p => p.playerId));
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
      message.success("Player withdrawn from pool");
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to remove");
    }
  };

  const handleRestore = async (auctionPlayerId: number) => {
    try {
      await restorePlayer({ tournamentId: tid, auctionPlayerId }).unwrap();
      message.success("Player restored to pool");
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to restore");
    }
  };

  // Club players eligible to be added directly (active, not already in this pool)
  const poolAllPlayerIds = new Set((players || []).map((p) => p.playerId));
  const selectablePlayers = (playersData?.content || []).filter(
    (p: any) => p.active && !poolAllPlayerIds.has(p.id)
  );

  const openExistingModal = () => setExistingModalOpen(true);

  const handleAddExisting = async () => {
    let values: any;
    try {
      values = await existingForm.validateFields();
    } catch {
      return; // form validation errors are shown inline
    }
    try {
      await addExisting({
        tournamentId: tid,
        body: { playerId: values.playerId, category: values.category, basePrice: values.basePrice },
      }).unwrap();
      message.success("Player added to the pool!");
      setExistingModalOpen(false);
      existingForm.resetFields();
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to add player");
    }
  };

  // Approved-registrations table (ready to add)
  const availableColumns = [
    {
      title: "Player",
      key: "player",
      render: (_: any, reg: AuctionRegistrationResponse) => (
        <Space direction="vertical" size={0}>
          <Text strong>{reg.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{reg.employeeId} • {reg.email}</Text>
        </Space>
      ),
    },
    {
      title: "Position",
      key: "position",
      render: (_: any, reg: AuctionRegistrationResponse) => <Tag>{reg.playingPosition || "N/A"}</Tag>,
    },
    {
      title: "Category",
      key: "category",
      render: (_: any, reg: AuctionRegistrationResponse) => (
        <Select
          value={getState(reg.id).category}
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
      ),
    },
    {
      title: "Base Price",
      key: "basePrice",
      render: (_: any, reg: AuctionRegistrationResponse) => (
        <InputNumber
          value={getState(reg.id).basePrice}
          onChange={(val) => updateState(reg.id, { basePrice: val || 0 })}
          min={0}
          step={1000}
          style={{ width: 120 }}
          size="small"
          formatter={value => `৳${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/৳|(,*)/g, '') as any}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, reg: AuctionRegistrationResponse) => (
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAddToPool(reg)} loading={addingReg}>
          Add
        </Button>
      ),
    },
  ];

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
    { title: "Base Price", dataIndex: "basePrice", key: "basePrice", render: (v: number) => <Text strong>{taka(v)}</Text> },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: AuctionPlayerStatus) => <StatusPill status={s} />,
    },
    { title: "Sold For", dataIndex: "finalPrice", key: "finalPrice", render: (v?: number) => v ? taka(v) : "-" },
    { title: "Sold To", dataIndex: "soldToTeamName", key: "soldToTeamName", render: (v?: string) => v || "-" },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: AuctionPlayerResponse) => {
        if (record.status === "AVAILABLE") {
          return (
            <Popconfirm
              title="Withdraw this player from pool?"
              description="The player can be restored later."
              okText="Withdraw"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={() => handleRemove(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Withdraw
              </Button>
            </Popconfirm>
          );
        }

        if (record.status === "WITHDRAWN") {
          return (
            <Tooltip title="Bring this player back to active pool">
              <Button size="small" icon={<UndoOutlined />} onClick={() => handleRestore(record.id)}>
                Restore
              </Button>
            </Tooltip>
          );
        }

        return null;
      },
    },
  ];

  return (
    <AuctionPage maxWidth={1180}>
      <AuctionHeader
        icon={<UserOutlined />}
        title="Auction Player Pool"
        subtitle="Add approved registrations to the pool and manage pool players."
        backTo="/auction"
        actions={
          <Button type="primary" icon={<UsergroupAddOutlined />} onClick={openExistingModal}>
            Add Existing Player
          </Button>
        }
      />

      {/* Section 1: Registered Players ready to add */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined />
            <Text strong>Approved Players — Ready to Add</Text>
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
      >
        {availableRegistrations.length === 0 ? (
          <Empty description="All approved registrations are already in the pool (or no approved registrations yet)." />
        ) : (
          <Table
            dataSource={availableRegistrations}
            columns={availableColumns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
          />
        )}
      </Card>

      {/* Section 2: Current Pool */}
      <Card
        title={
          <Space>
            <Text strong>Current Pool</Text>
            <Tag color="green">{activePoolPlayers.length} active</Tag>
            {withdrawnCount > 0 && <Tag color="default">{withdrawnCount} withdrawn</Tag>}
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

      {/* Add an existing club player directly to the pool (no registration) */}
      <Modal
        title={
          <Space>
            <UsergroupAddOutlined style={{ color: "#C6A15B" }} />
            Add Existing Player
          </Space>
        }
        open={existingModalOpen}
        onCancel={() => setExistingModalOpen(false)}
        onOk={handleAddExisting}
        okText="Add to Pool"
        confirmLoading={addingExisting}
        okButtonProps={{ icon: <PlusOutlined /> }}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Add a club player straight into the auction pool — no registration required.
        </Text>
        <Form
          form={existingForm}
          layout="vertical"
          initialValues={{ category: "B_GRADE", basePrice: defaultBasePrices.B_GRADE }}
        >
          <Form.Item name="playerId" label="Player" rules={[{ required: true, message: "Select a player" }]}>
            <Select
              showSearch
              placeholder="Search player by name…"
              optionFilterProp="label"
              options={selectablePlayers.map((p: any) => ({
                value: p.id,
                label: `${p.name} (${p.employeeId || p.email})`,
              }))}
              notFoundContent="No eligible players — all active players may already be in the pool."
            />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: "Select a category" }]}>
            <Select
              onChange={(cat: AuctionPlayerCategory) => existingForm.setFieldsValue({ basePrice: defaultBasePrices[cat] })}
            >
              <Select.Option value="ICON">⭐ Icon</Select.Option>
              <Select.Option value="A_GRADE">🅰️ A Grade</Select.Option>
              <Select.Option value="B_GRADE">🅱️ B Grade</Select.Option>
              <Select.Option value="EMERGING">🌱 Emerging</Select.Option>
              <Select.Option value="OUTSIDE">🔷 Outside</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="basePrice" label="Base Price" rules={[{ required: true, message: "Enter a base price" }]}>
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              step={1000}
              formatter={(v) => `৳${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v!.replace(/৳|(,*)/g, "") as any}
            />
          </Form.Item>
        </Form>
      </Modal>
    </AuctionPage>
  );
};

export default AuctionPlayerPoolPage;
