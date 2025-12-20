import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import { EditOutlined, PlayCircleOutlined, PlusOutlined, MinusOutlined, DragOutlined } from "@ant-design/icons";
import moment from "moment";
import { ColumnsType } from "antd/es/table";
import { IFixture, MatchStatus } from "../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../utils/matchStatusUtils";
import { formatMatchTime, isMatchOngoing, calculateElapsedTime } from "../../../utils/matchTimeUtils";
import { useNavigate } from "react-router-dom";
import { useDeleteMatchMutation, useUpdateMatchOrderMutation } from "../../../state/features/fixtures/fixturesSlice";
import AddMatchModal from "./AddMatchModal";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageFixtures } from "../../../utils/roleUtils";

interface FixturesTableProps {
  fixtures: IFixture[];
  isLoading?: boolean;
  onViewDetails?: (fixture: IFixture) => void;
  onEditFixture?: (fixture: IFixture) => void;
  tournamentId?: number;
  roundId?: number;
  groupId?: number;
  groupName?: string;
  teams?: Array<{ teamId: number; teamName: string }>;
  onRefresh?: () => void;
  enableAddRemove?: boolean;
  enableDragDrop?: boolean;
}

export default function FixturesTable({
  fixtures,
  isLoading = false,
  onViewDetails,
  onEditFixture,
  tournamentId,
  roundId,
  groupId,
  groupName,
  teams = [],
  onRefresh,
  enableAddRemove = false,
  enableDragDrop = false,
}: FixturesTableProps) {
  const navigate = useNavigate();
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageFixtures(loginInfo.roles);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [deleteMatch, { isLoading: isDeleting }] = useDeleteMatchMutation();
  const [updateMatchOrder, { isLoading: isUpdatingOrder }] = useUpdateMatchOrderMutation();
  const [localFixtures, setLocalFixtures] = useState(fixtures);

  // Update local fixtures when props change
  useEffect(() => {
    setLocalFixtures(fixtures);
  }, [fixtures]);

  // Update time every second for ongoing matches
  useEffect(() => {
    const hasOngoingMatches = fixtures.some(f => isMatchOngoing(f.matchStatus));
    if (!hasOngoingMatches) {
      setCurrentTime(Date.now()); // Set once if no ongoing matches
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [fixtures]); // Only depend on fixtures, not currentTime

  const handleDeleteMatch = async (matchId: number) => {
    try {
      await deleteMatch({ matchId }).unwrap();
      message.success("Match deleted successfully");
      onRefresh?.();
    } catch (error: any) {
      message.error(error?.data?.message || "Failed to delete match");
    }
  };

  const handleAddMatch = () => {
    if (!tournamentId || teams.length === 0) {
      message.warning("Tournament ID and teams are required to add matches");
      return;
    }
    setIsAddModalVisible(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localFixtures);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setLocalFixtures(items);

    // Update match orders
    const matchOrders = items.map((fixture, index) => ({
      matchId: fixture.id,
      matchOrder: index + 1,
    }));

    try {
      await updateMatchOrder({ matchOrders }).unwrap();
      message.success("Match order updated successfully");
      onRefresh?.();
    } catch (error: any) {
      // Revert on error
      setLocalFixtures(fixtures);
      message.error(error?.data?.message || "Failed to update match order");
    }
  };

  // Custom table body component for drag and drop
  // Note: Ant Design Table's structure is complex, so we'll use a simpler approach
  // with manual reordering buttons or a custom list view for drag and drop
  // For now, we'll keep the drag handle column but use a simpler reordering mechanism
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const items = Array.from(localFixtures);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setLocalFixtures(items);

    const matchOrders = items.map((fixture, idx) => ({
      matchId: fixture.id,
      matchOrder: idx + 1,
    }));

    try {
      await updateMatchOrder({ matchOrders }).unwrap();
      message.success("Match order updated successfully");
      onRefresh?.();
    } catch (error: any) {
      setLocalFixtures(fixtures);
      message.error(error?.data?.message || "Failed to update match order");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === localFixtures.length - 1) return;
    
    const items = Array.from(localFixtures);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setLocalFixtures(items);

    const matchOrders = items.map((fixture, idx) => ({
      matchId: fixture.id,
      matchOrder: idx + 1,
    }));

    try {
      await updateMatchOrder({ matchOrders }).unwrap();
      message.success("Match order updated successfully");
      onRefresh?.();
    } catch (error: any) {
      setLocalFixtures(fixtures);
      message.error(error?.data?.message || "Failed to update match order");
    }
  };

  const columns: ColumnsType<IFixture> = [
    ...(enableDragDrop ? [{
      title: "",
      key: "drag",
      width: 50,
      render: (_: any, record: IFixture, index: number) => {
        // This will be replaced by the drag handle in the custom row component
        return (
          <Tooltip title="Drag to reorder">
            <DragOutlined style={{ cursor: "grab", color: "#999", fontSize: 16 }} />
          </Tooltip>
        );
      },
    }] : []),
    {
      title: "Match #",
      dataIndex: "matchOrder",
      key: "matchOrder",
      width: 80,
      sorter: (a, b) => a.matchOrder - b.matchOrder,
    },
    {
      title: "Home Team",
      dataIndex: "homeTeamName",
      key: "homeTeamName",
      sorter: (a, b) => a.homeTeamName.localeCompare(b.homeTeamName),
    },
    {
      title: "Score",
      key: "score",
      width: 80,
      render: (_, record) => (
        <span style={{ fontWeight: "bold" }}>
          {record.homeTeamScore} - {record.awayTeamScore}
        </span>
      ),
      align: "center",
    },
    {
      title: "Away Team",
      dataIndex: "awayTeamName",
      key: "awayTeamName",
      sorter: (a, b) => a.awayTeamName.localeCompare(b.awayTeamName),
    },
    {
      title: "Venue",
      dataIndex: "venueName",
      key: "venueName",
      render: (venue) => (
        <Tooltip title={venue}>
          <span>{venue?.length > 15 ? `${venue.substring(0, 15)}...` : venue}</span>
        </Tooltip>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "matchDate",
      key: "matchDate",
      render: (date: string) => moment.utc(date).local().format("DD MMM YYYY, HH:mm"),
      sorter: (a, b) => moment.utc(a.matchDate).valueOf() - moment.utc(b.matchDate).valueOf(),
    },
    {
      title: "Status",
      dataIndex: "matchStatus",
      key: "matchStatus",
      width: 150,
      render: (status: string, record: IFixture) => {
        const color = getStatusColor(status);
        const isOngoing = isMatchOngoing(status);
        const matchTime = formatMatchTime(
          record.matchStatus,
          record.startedAt,
          record.elapsedTimeSeconds,
          record.completedAt
        );
        
        return (
          <Space direction="vertical" size={2}>
            <Tag color={color} icon={isOngoing ? <PlayCircleOutlined /> : undefined}>
              {status}
            </Tag>
            {isOngoing && matchTime && (
              <Tag color="green" style={{ margin: 0, cursor: "pointer" }}>
                {matchTime}
              </Tag>
            )}
          </Space>
        );
      },
      sorter: (a, b) => a.matchStatus.localeCompare(b.matchStatus),
    },
    ...(canManage ? [{
      title: "Action",
      key: "action",
      width: enableAddRemove ? 150 : 80,
      render: (_: any, record: IFixture) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEditFixture?.(record);
            }}
            size="small"
          >
            Edit
          </Button>
          {enableAddRemove && (
            <Popconfirm
              title="Delete this match?"
              description="Are you sure you want to delete this match? This action cannot be undone."
              onConfirm={() => handleDeleteMatch(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                danger
                icon={<MinusOutlined />}
                onClick={(e) => e.stopPropagation()}
                size="small"
                loading={isDeleting}
              >
                Remove
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    }] : []),
  ];

  const displayFixtures = enableDragDrop ? localFixtures : fixtures;

  return (
    <>
      <Spin spinning={isLoading || isUpdatingOrder} tip="Loading fixtures...">
        {enableAddRemove && canManage && (
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddMatch}
              disabled={!tournamentId || teams.length === 0}
            >
              Add Match
            </Button>
          </div>
        )}
        {displayFixtures.length === 0 ? (
          <Empty description="No fixtures found" />
        ) : enableDragDrop ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fixtures-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ width: "100%" }}>
                  <Table
                    columns={columns}
                    dataSource={displayFixtures.map((fixture, index) => ({
                      ...fixture,
                      key: fixture.id,
                      index,
                    }))}
                    pagination={{
                      pageSize: 10,
                      showTotal: (total) => `Total ${total} matches`,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                    }}
                    scroll={{ x: "max-content" }}
                    size="small"
                    components={{
                      body: {
                        row: (props: any) => {
                          const index = displayFixtures.findIndex((f) => f.id === props['data-row-key']);
                          if (index === -1) return <tr {...props} />;

                          return (
                            <Draggable draggableId={String(props['data-row-key'])} index={index}>
                              {(provided, snapshot) => (
                                <tr
                                  {...props}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{
                                    ...props.style,
                                    ...provided.draggableProps.style,
                                    backgroundColor: snapshot.isDragging ? '#f0f0f0' : props.style?.backgroundColor || 'transparent',
                                    cursor: 'pointer',
                                  }}
                                  onClick={(e: React.MouseEvent) => {
                                    // Only navigate if not clicking on a button or drag handle
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('button') && !target.closest('[data-no-click]')) {
                                      navigate(`/fixtures/${props['data-row-key']}`);
                                    }
                                  }}
                                >
                                  {React.Children.map(props.children, (child: any, i) => {
                                    if (i === 0 && enableDragDrop) {
                                      return React.cloneElement(child, {
                                        ...child.props,
                                        children: (
                                          <div
                                            {...provided.dragHandleProps}
                                            data-no-click="true"
                                            style={{
                                              cursor: 'grab',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              padding: '8px',
                                              width: '100%',
                                              minHeight: '32px',
                                              transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }}
                                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                          >
                                            <Tooltip title="Drag to reorder">
                                              <DragOutlined
                                                style={{
                                                  cursor: 'grab',
                                                  color: '#8c8c8c',
                                                  fontSize: 18
                                                }}
                                              />
                                            </Tooltip>
                                          </div>
                                        ),
                                      });
                                    }
                                    return child;
                                  })}
                                </tr>
                              )}
                            </Draggable>
                          );
                        },
                      },
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        navigate(`/fixtures/${record.id}`);
                      },
                      style: {
                        cursor: "pointer",
                      },
                    })}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <Table
            columns={columns}
            dataSource={displayFixtures.map((fixture) => ({
              ...fixture,
              key: fixture.id,
            }))}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} matches`,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }}
            scroll={{ x: "max-content" }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                navigate(`/fixtures/${record.id}`);
              },
              style: {
                cursor: "pointer",
              },
            })}
          />
        )}
      </Spin>
      {enableAddRemove && canManage && tournamentId && teams.length > 0 && (
        <AddMatchModal
          tournamentId={tournamentId}
          roundId={roundId}
          groupId={groupId}
          groupName={groupName}
          teams={teams}
          isModalVisible={isAddModalVisible}
          handleSetIsModalVisible={setIsAddModalVisible}
          onSuccess={() => {
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
