import { Alert, Button, Drawer, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
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
  ELIGIBLE: {
    label: "Eligible",
    color: "blue",
    hint: "In the running — ranked by how much goalkeeping they're owed",
  },
  COOLDOWN: {
    label: "Resting",
    color: "orange",
    hint: "Kept goal recently — held back, but still building up their share",
  },
  EXEMPT: {
    label: "Not in rotation",
    color: "default",
    hint: "Opted out of goalkeeping — shown for completeness, not ranked",
  },
};

const CategoryTag = ({
  category,
  cooldownRemaining,
}: {
  category: GoalKeeperCategoryType;
  cooldownRemaining?: number | null;
}) => {
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  const label =
    category === "COOLDOWN" && cooldownRemaining
      ? `${meta.label} · ${cooldownRemaining}`
      : meta.label;
  return (
    <Tooltip title={meta.hint}>
      <Tag color={meta.color} style={{ margin: 0 }}>
        {label}
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
  const coverage = data?.content?.ledgerCoverage;
  const cooldownTournaments = data?.content?.cooldownTournaments;

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
            <CategoryTag
              category={record.category}
              cooldownRemaining={record.cooldownRemaining}
            />
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
      title: "Owed",
      dataIndex: "goalKeeperDebt",
      key: "goalKeeperDebt",
      width: 110,
      align: "center",
      sorter: (a, b) => a.goalKeeperDebt - b.goalKeeperDebt,
      render: (debt: number, record) => (
        <Tooltip
          title={`Turned up ${record.attendedTournaments} times — that share works out at ${record.accruedObligation} turns in goal, and they've taken ${record.goalKeeperStints}.`}
        >
          <span
            style={{
              fontWeight: 600,
              // Negative means they've already done more than their share, so it's
              // information rather than a call to action - keep it quiet.
              opacity: debt > 0 ? 1 : 0.45,
            }}
          >
            {debt > 0 ? `+${debt.toFixed(2)}` : debt.toFixed(2)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Served",
      dataIndex: "goalKeeperStints",
      key: "goalKeeperStints",
      width: 90,
      align: "center",
      sorter: (a, b) => a.goalKeeperStints - b.goalKeeperStints,
      render: (stints: number) =>
        stints === 0 ? <Tag color="green">Never</Tag> : <span>{stints}</span>,
    },
    {
      title: "Attended",
      dataIndex: "attendedTournaments",
      key: "attendedTournaments",
      width: 100,
      align: "center",
      sorter: (a, b) => a.attendedTournaments - b.attendedTournaments,
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
          Suggested order of who should keep goal next. Every tournament&apos;s
          goalkeeping is shared between the people who turned up for it, so each
          appearance builds up a small share and each turn in goal pays one off.
          &ldquo;Owed&rdquo; is what&apos;s left, and Priority #1 is owed the
          most. Anyone who kept goal in the last{" "}
          {cooldownTournaments ?? 2} tournaments is held back regardless.
        </Typography.Paragraph>

        {coverage && coverage.tournamentsEstimated > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={`${coverage.tournamentsEstimated} of ${coverage.tournamentsConsidered} past tournaments have no goalkeeper recorded`}
            description="Their share is estimated, so the numbers below are approximate for anyone who played in them. Entering the missing keepers will settle it."
          />
        )}

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
          scroll={{ x: 1100, y: "calc(95vh - 260px)" }}
          showSorterTooltip={false}
        />
      </Drawer>
    </>
  );
}
