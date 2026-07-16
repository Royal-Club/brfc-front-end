import { Button, Drawer, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import React, { useMemo, useState } from "react";
import type { ColumnsType } from "antd/lib/table";
import { CrownOutlined } from "@ant-design/icons";
import moment from "moment";
import { useGetGoalKeeperPriorityQueueQuery } from "../../../state/features/tournaments/tournamentsSlice";
import {
  GoalKeeperCategoryType,
  GoalKeeperPriorityPlayerType,
} from "../../../state/features/tournaments/tournamentTypes";

const CATEGORY_META: Record<
  GoalKeeperCategoryType,
  { label: string; color: string; hint: string }
> = {
  REGULAR: {
    label: "Regular",
    color: "blue",
    hint: "Regular attendee, eligible now — placed first",
  },
  LAST_GK: {
    label: "Last GK",
    color: "orange",
    hint: "Kept goal in the most recent tournament — placed lower to avoid repeating",
  },
  NEW: {
    label: "New",
    color: "purple",
    hint: "First-ever tournament — placed last",
  },
};

const CategoryTag = ({ category }: { category: GoalKeeperCategoryType }) => {
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  return (
    <Tooltip title={meta.hint}>
      <Tag color={meta.color} style={{ margin: 0 }}>
        {meta.label}
      </Tag>
    </Tooltip>
  );
};

export default function GoalKeeperPriorityDrawer({
  tournamentId,
  triggerClassName,
  triggerStyle,
  triggerIcon,
}: {
  tournamentId: number;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  triggerIcon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { data, isFetching } = useGetGoalKeeperPriorityQueueQuery(
    { tournamentId },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  const queue = useMemo(
    () => data?.content?.goalKeeperPriorityQueue ?? [],
    [data]
  );

  const filtered = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return queue;
    return queue.filter(
      (p) =>
        p.playerName.toLowerCase().includes(text) ||
        (p.employeeId ?? "").toLowerCase().includes(text)
    );
  }, [queue, searchText]);

  const columns: ColumnsType<GoalKeeperPriorityPlayerType> = [
    {
      title: "#",
      dataIndex: "priority",
      key: "priority",
      width: 70,
      fixed: "left",
      sorter: (a, b) => a.priority - b.priority,
      defaultSortOrder: "ascend",
      render: (priority: number) => (
        <span style={{ fontWeight: 600 }}>{priority}</span>
      ),
    },
    {
      title: "Player",
      dataIndex: "playerName",
      key: "playerName",
      render: (_: string, record) => (
        <div>
          <div
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {record.playerName}
            <CategoryTag category={record.category} />
          </div>
          {record.employeeId && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.employeeId}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Times as GK",
      dataIndex: "totalGoalKeeperTournaments",
      key: "totalGoalKeeperTournaments",
      width: 120,
      align: "center",
      sorter: (a, b) =>
        a.totalGoalKeeperTournaments - b.totalGoalKeeperTournaments,
      render: (count: number) =>
        count === 0 ? (
          <Tag color="green">Never</Tag>
        ) : (
          <span>{count}</span>
        ),
    },
    {
      title: "Last as GK",
      dataIndex: "lastGoalKeeperDate",
      key: "lastGoalKeeperDate",
      width: 130,
      render: (date: string | null) =>
        date ? (
          moment(date).format("DD-MM-YY")
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Last Played",
      dataIndex: "lastPlayedTournamentDate",
      key: "lastPlayedTournamentDate",
      width: 120,
      render: (date: string | null) =>
        date ? date : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "GK History",
      dataIndex: "playAsGkDates",
      key: "playAsGkDates",
      render: (dates: string[]) =>
        dates && dates.length > 0 ? (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {dates.map((d, idx) => (
              <Tag key={`${d}-${idx}`} style={{ margin: 0 }}>
                {d}
              </Tag>
            ))}
          </span>
        ) : (
          <Typography.Text type="secondary">No records</Typography.Text>
        ),
    },
  ];

  return (
    <>
      <Button
        onClick={showDrawer}
        className={triggerClassName}
        icon={triggerIcon ?? <CrownOutlined />}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...triggerStyle,
        }}
      >
        GK Priority
      </Button>

      <Drawer
        title="Goalkeeper Priority Queue"
        onClose={onClose}
        open={open}
        placement="bottom"
        height="95vh"
        style={{ top: "auto" }}
        className="slimScroll"
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Suggested order of who should keep goal next — a fairness ranking based
          on how recently and how often each participant has played as
          goalkeeper. Priority #1 is most due to be goalkeeper.
        </Typography.Paragraph>

        <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
          {(Object.keys(CATEGORY_META) as GoalKeeperCategoryType[]).map(
            (cat) => (
              <Typography.Text
                key={cat}
                type="secondary"
                style={{ fontSize: 12 }}
              >
                <CategoryTag category={cat} /> {CATEGORY_META[cat].hint}
              </Typography.Text>
            )
          )}
        </Space>

        <Input
          placeholder="Search player"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 320, marginBottom: 12 }}
        />

        <Table
          columns={columns}
          dataSource={filtered}
          loading={isFetching}
          rowKey="playerId"
          pagination={false}
          size="small"
          scroll={{ x: 900, y: "calc(95vh - 220px)" }}
          showSorterTooltip={false}
        />
      </Drawer>
    </>
  );
}
