import React, { useState } from "react";
import { Card, Table, Button, Space, Modal, Form, InputNumber, Typography, message, Select, Input, Divider, Tag, Empty, Popconfirm } from "antd";
import { PlusOutlined, TeamOutlined, UserOutlined, DollarOutlined, DeleteOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetTeamBudgetsQuery,
  useCreateTeamBudgetMutation,
  useUpdateTeamBudgetMutation,
  useDeleteTeamBudgetMutation,
  useGetAvailableTeamsQuery,
  useCreateTeamForAuctionMutation,
} from "../../state/features/auction/auctionSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { TeamBudgetResponse } from "../../state/features/auction/auctionTypes";

const { Title, Text } = Typography;

const AuctionTeamBudgetsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const [modal, setModal] = useState<{ visible: boolean; editing?: TeamBudgetResponse }>({ visible: false });
  const [newTeamModal, setNewTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [form] = Form.useForm();

  const { data: budgets, isLoading } = useGetTeamBudgetsQuery(tid);
  const { data: teamsData, isLoading: teamsLoading } = useGetAvailableTeamsQuery(tid);
  const { data: playersData } = useGetPlayersQuery();
  const [create, { isLoading: creating }] = useCreateTeamBudgetMutation();
  const [update, { isLoading: updating }] = useUpdateTeamBudgetMutation();
  const [deleteTeamBudget] = useDeleteTeamBudgetMutation();
  const [createTeam, { isLoading: creatingTeam }] = useCreateTeamForAuctionMutation();

  const players = playersData?.content || [];
  const teams = teamsData || [];

  const handleSubmit = async (values: any) => {
    try {
      if (modal.editing) {
        await update({ tournamentId: tid, id: modal.editing.id, body: values }).unwrap();
        message.success("Budget updated");
      } else {
        await create({ tournamentId: tid, body: values }).unwrap();
        message.success("Team budget created successfully!");
      }
      setModal({ visible: false });
      form.resetFields();
    } catch (err: any) {
      message.error(err?.data?.message || "Failed");
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      message.warning("Enter a team name");
      return;
    }
    try {
      await createTeam({ tournamentId: tid, teamName: newTeamName.trim() }).unwrap();
      message.success(`Team "${newTeamName}" created!`);
      setNewTeamName("");
      setNewTeamModal(false);
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to create team");
    }
  };

  const columns = [
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (v: string) => <Space><TeamOutlined /><Text strong>{v}</Text></Space>,
    },
    {
      title: "Owner (Captain)",
      dataIndex: "ownerName",
      key: "ownerName",
      render: (v: string) => <Space><UserOutlined />{v}</Space>,
    },
    {
      title: "Total Budget",
      dataIndex: "totalBudget",
      key: "totalBudget",
      render: (v: number) => <Tag color="blue">৳{v?.toLocaleString()}</Tag>,
    },
    {
      title: "Spent",
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (v: number) => <Tag color="red">৳{(v || 0).toLocaleString()}</Tag>,
    },
    {
      title: "Remaining",
      dataIndex: "remainingBudget",
      key: "remainingBudget",
      render: (v: number) => <Tag color="green">৳{(v || 0).toLocaleString()}</Tag>,
    },
    {
      title: "Players Bought",
      dataIndex: "playersBought",
      key: "playersBought",
      render: (v: number) => v || 0,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: TeamBudgetResponse) => (
        <Space>
          <Button size="small" onClick={() => {
            setModal({ visible: true, editing: record });
            form.setFieldsValue({
              teamId: record.teamId,
              ownerId: record.ownerId,
              totalBudget: record.totalBudget,
            });
          }}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this team budget?"
            description={record.playersBought > 0 ? "This team has bought players. Deletion is not allowed." : "This will remove the team from the auction."}
            okText="Delete"
            okButtonProps={{ danger: true, disabled: record.playersBought > 0 }}
            cancelText="Cancel"
            onConfirm={async () => {
              try {
                await deleteTeamBudget({ tournamentId: tid, id: record.id }).unwrap();
                message.success("Team budget deleted");
              } catch (err: any) {
                message.error(err?.data?.message || "Failed to delete");
              }
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.playersBought > 0}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ justifyContent: "space-between", width: "100%", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <TeamOutlined /> Team Budgets & Owners
        </Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setNewTeamModal(true)}>
            Create New Team
          </Button>
          <Button type="primary" icon={<DollarOutlined />} onClick={() => { setModal({ visible: true }); form.resetFields(); }}>
            Assign Team Budget
          </Button>
        </Space>
      </Space>

      {/* Info banner */}
      <Card size="small" style={{ marginBottom: 16, background: "#f0f5ff", border: "1px solid #adc6ff" }}>
        <Text>
          <strong>How it works:</strong> 1) Create teams → 2) Assign an owner (captain who bids) and budget to each team → 3) Start the live auction!
        </Text>
      </Card>

      {budgets && budgets.length === 0 ? (
        <Empty description="No teams set up yet. Create teams and assign budgets to get started." />
      ) : (
        <Table dataSource={budgets} columns={columns} rowKey="id" loading={isLoading} pagination={false} />
      )}

      {/* Create/Edit Team Budget Modal */}
      <Modal
        title={modal.editing ? "Edit Team Budget" : "Assign Team Budget"}
        open={modal.visible}
        onCancel={() => setModal({ visible: false })}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="teamId" label="Select Team" rules={[{ required: true, message: "Please select a team" }]}>
            <Select
              placeholder="Search or select a team..."
              showSearch
              loading={teamsLoading}
              optionFilterProp="label"
              disabled={!!modal.editing}
              options={teams.map(t => ({ value: t.teamId, label: t.teamName }))}
              notFoundContent={
                <Space direction="vertical" align="center" style={{ width: "100%", padding: 8 }}>
                  <Text type="secondary">No teams found</Text>
                  <Button type="link" onClick={() => { setModal({ visible: false }); setNewTeamModal(true); }}>
                    + Create a new team first
                  </Button>
                </Space>
              }
            />
          </Form.Item>

          <Form.Item name="ownerId" label="Team Owner (Captain)" rules={[{ required: true, message: "Please select an owner" }]}>
            <Select
              placeholder="Search player by name..."
              showSearch
              optionFilterProp="label"
              options={players.filter(p => p.active).map(p => ({
                value: p.id,
                label: `${p.name} (${p.employeeId || p.email})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="totalBudget" label="Total Budget (৳)" rules={[{ required: true, message: "Please set a budget" }]}>
            <InputNumber
              style={{ width: "100%" }}
              min={1000}
              step={5000}
              formatter={value => `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/৳\s?|(,*)/g, '') as any}
              placeholder="e.g. 100,000"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={creating || updating} block size="large">
              {modal.editing ? "Update Budget" : "Assign Budget to Team"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create New Team Modal */}
      <Modal
        title="Create New Team"
        open={newTeamModal}
        onCancel={() => { setNewTeamModal(false); setNewTeamName(""); }}
        footer={null}
        width={400}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text>Enter a name for the new team in this tournament:</Text>
          <Input
            placeholder="e.g. Royal Warriors, Thunder FC..."
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            onPressEnter={handleCreateTeam}
            size="large"
            prefix={<TeamOutlined />}
          />
          <Button type="primary" onClick={handleCreateTeam} loading={creatingTeam} block size="large">
            Create Team
          </Button>
          <Divider style={{ margin: "8px 0" }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            After creating the team, you can assign an owner and budget using "Assign Team Budget".
          </Text>
        </Space>
      </Modal>
    </Card>
  );
};

export default AuctionTeamBudgetsPage;
