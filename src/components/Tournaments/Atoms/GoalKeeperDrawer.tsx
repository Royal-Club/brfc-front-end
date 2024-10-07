import { Button, Drawer, Input, Table } from "antd";
import React, { useState, useMemo, useRef, useEffect, Key } from "react";
import { useGetTournamentGoalkeeperHistoryListQuery } from "../../../state/features/tournaments/tournamentsSlice";
import moment from "moment"; // Add this for date formatting
import type { ColumnsType } from "antd/lib/table"; // Import Ant Design's column type

export default function GoalKeeperDrawer({
  tournamentId,
}: {
  tournamentId: number;
}) {
  const {
    data: tournamentGoalKeeperList,
    refetch: refetchTournamentGoalKeeperList,
  } = useGetTournamentGoalkeeperHistoryListQuery();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const showDrawer = () => {
    refetchTournamentGoalKeeperList();
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [open]);

  // Use ColumnsType provided by Ant Design for proper typing
  const columns: ColumnsType<any> = [
    {
      title: "Player",
      dataIndex: "playerName",
      key: "playerName",
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.playerName
          .toLowerCase()
          .includes((value as string).toLowerCase()),
    },
    {
      title: "Played Date",
      dataIndex: "playedDate",
      key: "playedDate",
      render: (text) => (text ? moment(text).format("YYYY-MM-DD") : ""),
      sorter: (a, b) => {
        if (!a.playedDate && !b.playedDate) return 0;
        if (!a.playedDate) return 1;
        if (!b.playedDate) return -1;
        return (
          new Date(b.playedDate).getTime() - new Date(a.playedDate).getTime()
        );
      },
    },
  ];
  const dataSourceByRound = useMemo(() => {
    if (!tournamentGoalKeeperList?.content) return [];

    return Object.keys(tournamentGoalKeeperList.content)

      .sort((a, b) => parseInt(b) - parseInt(a))

      .map((round) => ({
        round,
        data: tournamentGoalKeeperList.content[round].map((player) => ({
          key: player.playerId,
          playerName: player.playerName,
          playedDate: player?.playedDate,
          goalkeeperCount: player?.playedDate ? 1 : null,
        })),
      }));
  }, [tournamentGoalKeeperList]);

  return (
    <>
      <Button
        onClick={showDrawer}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Goalkeeper Records
      </Button>

      <Drawer
        title="Goalkeeper Records"
        onClose={onClose}
        open={open}
        placement="bottom"
        height="95vh"
        style={{ top: "auto" }}
        className="slimScroll"
      >
        <Input
          placeholder="Search Player"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div
          style={{
            overflowX: "auto",
            paddingBottom: 16,
            display: "flex",
            flexDirection: "row",
            gap: 16,
            height: "calc(100vh - 200px)",
          }}
          className="slimScroll"
          ref={scrollRef}
        >
          {dataSourceByRound.map((roundData) => (
            <div
              key={roundData.round}
              style={{
                minWidth: "300px",
                maxWidth: "300px",
              }}
            >
              <h3>Round {roundData.round}</h3>
              <Table
                columns={columns}
                dataSource={roundData.data}
                pagination={false}
                rowKey="key"
                // scroll={{ y: "68vh" }}
                showSorterTooltip={false}
                size="small"
                style={{ fontSize: "14px" }}
                rowClassName={(record) =>
                  record.playedDate ? "green-row" : ""
                }
              />
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
}
