import { Button, Drawer, Input, Table } from "antd";
import React, { useState, useMemo, useRef, useEffect, Key } from "react";
import { useGetTournamentGoalkeeperHistoryListQuery } from "../../../state/features/tournaments/tournamentsSlice";

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

  interface ColumnProps {
    title: string;
    dataIndex: string;
    key: string;
    sorter?: (a: any, b: any) => number;
    filteredValue?: string[] | null;
    onFilter?: (
      value: boolean | Key,
      record: {
        key: number;
        playerName: string;
        goalkeeperCount: number | "" | null;
      }
    ) => boolean;
  }

  const columns: ColumnProps[] = [
    {
      title: "Player",
      dataIndex: "playerName",
      key: "playerName",
      sorter: (a: { playerName: string }, b: { playerName: string }) =>
        a.playerName.localeCompare(b.playerName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (
        value: boolean | Key,
        record: { playerName: string; goalkeeperCount: number | "" | null }
      ) =>
        record.playerName
          .toLowerCase()
          .includes((value as string | number).toString().toLowerCase()),
    },
  ];

  const dataSourceByRound = useMemo(() => {
    if (!tournamentGoalKeeperList?.content) return [];

    return Object.keys(tournamentGoalKeeperList.content).map((round) => ({
      round,
      data: tournamentGoalKeeperList.content[round].map((player) => ({
        key: player.playerId,
        playerName: player.playerName,
        playedDate: player?.playedDate,
        goalkeeperCount: player?.playedDate ? 1 : null, // Assuming goalkeeperCount is determined based on playedDate
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
            gap: 16,
           
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
              <h2>Round {roundData.round}</h2>
              <Table
                columns={columns}
                dataSource={roundData.data}
                pagination={false}
                rowKey="key"
                scroll={{ y: "68vh" }}
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
