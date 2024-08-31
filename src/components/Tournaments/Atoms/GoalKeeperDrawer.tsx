import { Button, Drawer, Input, Table } from "antd";
import React, { useState, useMemo, Key } from "react";
import { useGetTournamentGoalKeeperListQuery } from "../../../state/features/tournaments/tournamentsSlice";

export default function GoalKeeperDrawer({
    tournamentId,
}: {
    tournamentId: number;
}) {
    const {
        data: tournamentGoalKeeperList,
        refetch: refetchTournamentGoalKeeperList,
    } = useGetTournamentGoalKeeperListQuery({
        tournamentId,
    });
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    const showDrawer = () => {
        refetchTournamentGoalKeeperList();
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    interface ColumnProps {
        title: string;
        dataIndex: string;
        key: string;
        sorter?: (a: any, b: any) => number;
        filteredValue?: string[] | null;
        onFilter?: (
            value: boolean | Key,
            record: { key: number; playerName: string; goalkeeperCount: number }
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
                record: { playerName: string; goalkeeperCount: number }
            ) =>
                record.playerName
                    .toLowerCase()
                    .includes(
                        (value as string | number).toString().toLowerCase()
                    ),
        },
        {
            title: "Count",
            dataIndex: "goalkeeperCount",
            key: "goalkeeperCount",
            sorter: (
                a: { goalkeeperCount: number },
                b: { goalkeeperCount: number }
            ) => a.goalkeeperCount - b.goalkeeperCount,
        },
    ];

    const dataSource = useMemo(() => {
        return tournamentGoalKeeperList?.content?.map((player) => ({
            key: player.playerId,
            playerName: player.playerName,
            goalkeeperCount: player.goalkeeperCount,
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
                Goalkeeper List
            </Button>

            <Drawer title="Goal Keeper List" onClose={onClose} open={open}>
                <Input
                    placeholder="Search Player"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                />
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    rowKey="key"
                    scroll={{ y: "75vh" }}
                    showSorterTooltip={false}
                />
            </Drawer>
        </>
    );
}
