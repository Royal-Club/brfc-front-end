import React, { useState } from "react";
import {
  Card, Table, Tag, Button, Space, Modal, Input, Typography, Select,
  message, InputNumber, Badge, Tabs, Tooltip, Row, Col, Statistic, Empty
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, PlusCircleOutlined,
  TeamOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined
} from "@ant-design/icons";
import {
  useGetAuctionRegistrationsQuery,
  useApproveRegistrationMutation,
  useRejectRegistrationMutation,
  useUndoRejectRegistrationMutation,
  useApproveAndAddToPoolMutation,
  useAddFromRegistrationMutation,
} from "../../state/features/auction/auctionSlice";
import { AuctionRegistrationResponse, AuctionPlayerCategory } from "../../state/features/auction/auctionTypes";
import { useParams } from "react-router-dom";

const { Title, Text } = Typography;

const CATEGORY_OPTIONS: { value: AuctionPlayerCategory; label: string; defaultPrice: number }[] = [
  { value: "ICON", label: "⭐ Icon", defaultPrice: 30000 },
  { value: "A_GRADE", label: "🅰️ A Grade", defaultPrice: 20000 },
  { value: "B_GRADE", label: "🅱️ B Grade", defaultPrice: 12000 },
  { value: "EMERGING", label: "🌱 Emerging", defaultPrice: 7000 },
  { value: "OUTSIDE", label: "🔷 Outside", defaultPrice: 4000 },
];

const categoryColor: Record<AuctionPlayerCategory, string> = {
  ICON: "gold", A_GRADE: "blue", B_GRADE: "green", EMERGING: "cyan", OUTSIDE: "purple",
};

interface RowState {
  category: AuctionPlayerCategory;
  basePrice: number;
}

const AuctionAdminApprovalPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);

  const [tab, setTab] = useState<string>("ALL");
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const statusParam = tab === "ALL" ? undefined : tab;
  const { data: registrations = [], isLoading } = useGetAuctionRegistrationsQuery({ tournamentId: tid, status: statusParam });

  const [approve, { isLoading: approving }] = useApproveRegistrationMutation();
  const [reject, { isLoading: rejecting }] = useRejectRegistrationMutation();
  const [undoReject, { isLoading: undoingReject }] = useUndoRejectRegistrationMutation();
  const [approveAndPool, { isLoading: pooling }] = useApproveAndAddToPoolMutation();
  const [addToPool, { isLoading: addingPool }] = useAddFromRegistrationMutation();

  const getRowState = (id: number): RowState =>
    rowStates[id] || { category: "B_GRADE", basePrice: 12000 };

  const setCategory = (id: number, category: AuctionPlayerCategory) => {
    const defaultPrice = CATEGORY_OPTIONS.find(o => o.value === category)?.defaultPrice || 12000;
    setRowStates(prev => ({ ...prev, [id]: { category, basePrice: defaultPrice } }));
  };

  const setPrice = (id: number, basePrice: number) => {
    setRowStates(prev => ({ ...prev, [id]: { ...getRowState(id), basePrice } }));
  };

  const handleApproveAndPool = async (reg: AuctionRegistrationResponse) => {
    const state = getRowState(reg.id);
    try {
      await approveAndPool({ id: reg.id, body: { category: state.category, basePrice: state.basePrice } }).unwrap();
      message.success(`${reg.name} approved and added to auction pool!`);
    } catch (err: any) {
      message.error(err?.data?.message || "Failed");
    }
  };

  const handleAddToPool = async (reg: AuctionRegistrationResponse) => {
    const state = getRowState(reg.id);
    try {
      await addToPool({ tournamentId: tid, registrationId: reg.id, body: { category: state.category, basePrice: state.basePrice } }).unwrap();
      message.success(`${reg.name} added to pool!`);
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to add to pool");
    }
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    try {
      await reject({ id: rejectModal.id, reason: rejectReason }).unwrap();
      message.success("Registration rejected");
      setRejectModal({ visible: false, id: null });
      setRejectReason("");
    } catch (err: any) {
      message.error(err?.data?.message || "Rejection failed");
    }
  };

  // Stats
  const pending = registrations.filter(r => r.approvalStatus === "PENDING").length;
  const approved = registrations.filter(r => r.approvalStatus === "APPROVED").length;
  const inPool = registrations.filter(r => r.inAuctionPool).length;
  const rejected = registrations.filter(r => r.approvalStatus === "REJECTED").length;

  const columns = [
    {
      title: "Player",
      key: "player",
      render: (_: any, r: AuctionRegistrationResponse) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.employeeId} • {r.email}</Text>
        </Space>
      ),
    },
    {
      title: "Position",
      dataIndex: "playingPosition",
      key: "pos",
      render: (v?: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Pref. Price",
      dataIndex: "preferredBasePrice",
      key: "prefPrice",
      render: (v?: number) => v ? <Text>৳{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Category",
      key: "category",
      render: (_: any, r: AuctionRegistrationResponse) => {
        if (r.inAuctionPool) return <Tag color={categoryColor[getRowState(r.id).category]}>In Pool</Tag>;
        return (
          <Select
            value={getRowState(r.id).category}
            onChange={(v) => setCategory(r.id, v)}
            style={{ width: 130 }}
            size="small"
            disabled={r.approvalStatus === "REJECTED"}
          >
            {CATEGORY_OPTIONS.map(o => (
              <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Base Price",
      key: "basePrice",
      render: (_: any, r: AuctionRegistrationResponse) => {
        if (r.inAuctionPool) return <Text>—</Text>;
        return (
          <InputNumber
            value={getRowState(r.id).basePrice}
            onChange={(v) => setPrice(r.id, v || 0)}
            min={0}
            step={1000}
            style={{ width: 110 }}
            size="small"
            formatter={v => `৳${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v!.replace(/৳|(,*)/g, '') as any}
            disabled={r.approvalStatus === "REJECTED"}
          />
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, r: AuctionRegistrationResponse) => {
        if (r.inAuctionPool) return <Badge status="success" text="In Pool ✓" />;
        switch (r.approvalStatus) {
          case "PENDING": return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
          case "APPROVED": return <Tag color="blue" icon={<CheckCircleOutlined />}>Approved</Tag>;
          case "REJECTED": return <Tag color="red" icon={<CloseCircleOutlined />}>Rejected</Tag>;
        }
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, r: AuctionRegistrationResponse) => {
        if (r.inAuctionPool) return <Text type="secondary">Done</Text>;

        if (r.approvalStatus === "PENDING") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={() => handleApproveAndPool(r)}
                loading={pooling}
              >
                Approve & Add Pool
              </Button>
              <Button
                size="small"
                icon={<CheckOutlined />}
                onClick={async () => {
                  try { await approve(r.id).unwrap(); message.success("Approved"); }
                  catch (e: any) { message.error(e?.data?.message || "Failed"); }
                }}
                loading={approving}
              >
                Approve Only
              </Button>
              <Tooltip title="Reject registration">
                <Button
                  danger size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModal({ visible: true, id: r.id })}
                />
              </Tooltip>
            </Space>
          );
        }

        if (r.approvalStatus === "APPROVED") {
          return (
            <Button
              type="primary"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => handleAddToPool(r)}
              loading={addingPool}
            >
              Add to Pool
            </Button>
          );
        }

        if (r.approvalStatus === "REJECTED") {
          return (
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>{r.rejectionReason || "Rejected"}</Text>
              <Tooltip title="Move back to Pending">
                <Button
                  size="small"
                  onClick={async () => {
                    try { await undoReject(r.id).unwrap(); message.success("Moved back to pending"); }
                    catch (e: any) { message.error(e?.data?.message || "Failed"); }
                  }}
                  loading={undoingReject}
                >
                  Reconsider
                </Button>
              </Tooltip>
            </Space>
          );
        }

        return null;
      },
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={4}><TeamOutlined /> Player Registrations</Title>

      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col><Card size="small"><Statistic title="Pending" value={pending} valueStyle={{ color: "#faad14" }} /></Card></Col>
        <Col><Card size="small"><Statistic title="Approved" value={approved} valueStyle={{ color: "#1677ff" }} /></Card></Col>
        <Col><Card size="small"><Statistic title="In Pool" value={inPool} valueStyle={{ color: "#52c41a" }} /></Card></Col>
        <Col><Card size="small"><Statistic title="Rejected" value={rejected} valueStyle={{ color: "#ff4d4f" }} /></Card></Col>
      </Row>

      <Card>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: "ALL", label: `All (${registrations.length})` },
            { key: "PENDING", label: `Pending (${pending})` },
            { key: "APPROVED", label: `Approved (${approved})` },
            { key: "REJECTED", label: `Rejected (${rejected})` },
          ]}
        />

        {registrations.length === 0 && !isLoading ? (
          <Empty description="No registrations yet for this tournament." />
        ) : (
          <Table
            dataSource={registrations}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            size="small"
            scroll={{ x: 900 }}
            rowClassName={(r) => r.approvalStatus === "REJECTED" ? "ant-table-row-disabled" : ""}
          />
        )}
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Registration"
        open={rejectModal.visible}
        onOk={handleReject}
        onCancel={() => setRejectModal({ visible: false, id: null })}
        okButtonProps={{ danger: true, loading: rejecting }}
        okText="Reject"
      >
        <Input.TextArea
          rows={3}
          placeholder="Reason for rejection (optional)..."
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default AuctionAdminApprovalPage;
