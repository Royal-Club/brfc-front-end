import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Table, Select, Typography, Space, Skeleton, Input } from "antd";
import useJoinTournament from "../../hooks/useJoinTournament";
import { TournamentPlayerInfoType } from "../../state/features/tournaments/tournamentTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./tournament.css";

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function JoinTournament() {
    const { id = "" } = useParams();
    const tournamentId = Number(id);
    const { players, isLoading, isUpdating, handleUpdate, nextTournament } =
        useJoinTournament(tournamentId);
    const [editedComments, setEditedComments] = useState<{
        [key: number]: string;
    }>({});
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPlayers = players.filter(
        (player) =>
            player.playerName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            player.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            title: "Player Name",
            dataIndex: "playerName",
            key: "playerName",
        },
        {
            title: "Employee ID",
            dataIndex: "employeeId",
            key: "employeeId",
        },
        {
            title: "Participation Status",
            dataIndex: "participationStatus",
            key: "participationStatus",
            render: (_: any, record: TournamentPlayerInfoType) => (
                <Select
                    value={
                        record.participationStatus === true
                            ? "true"
                            : record.participationStatus === false
                            ? "false"
                            : "Select"
                    }
                    onChange={(value) => {
                        handleUpdate(
                            record.playerId,
                            editedComments[record.playerId] ||
                                record.comments ||
                                "",
                            value === "true"
                        );
                    }}
                    disabled={isUpdating}
                >
                    <Option value="true">Yes</Option>
                    <Option value="false">No</Option>
                </Select>
            ),
        },
        {
            title: "Comments",
            dataIndex: "comments",
            key: "comments",
            render: (_: any, record: TournamentPlayerInfoType) => (
                <Space direction="vertical" style={{ width: "100%" }}>
                    <DebouncedInput
                        placeholder="Enter comments..."
                        debounceDuration={500}
                        onChange={(value) => {
                            setEditedComments({
                                ...editedComments,
                                [record.playerId]: value,
                            });

                            handleUpdate(
                                record.playerId,
                                value,
                                record.participationStatus
                            );
                        }}
                        value={
                            editedComments[record.playerId] ||
                            record.comments ||
                            ""
                        }
                    />
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical">
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <>
                    <Space
                        direction="horizontal"
                        style={{
                            display: "flex",
                            marginBottom: "10px",
                            padding: "0 10px",
                            justifyContent: "space-between",
                            alignItems: "end",
                        }}
                    >
                        <Space
                            direction="vertical"
                            style={{ lineHeight: "1.2" }}
                        >
                            <Title level={5} style={{ margin: 0 }}>
                                {nextTournament?.tournamentName}
                            </Title>
                            <Title
                                level={5}
                                style={{ margin: 0, cursor: "pointer" }}
                            >
                                {new Date(
                                    nextTournament?.tournamentDate || ""
                                ).toLocaleString()}
                            </Title>
                        </Space>
                        <Search
                            placeholder="Search players"
                            onSearch={(value) => setSearchTerm(value)}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 200 }}
                        />
                    </Space>

                    <Table
                        rowKey="playerId"
                        columns={columns}
                        dataSource={filteredPlayers}
                        pagination={false}
                        bordered
                        size="small"
                        scroll={{ y: 600 }}
                        footer={() => (
                            <div
                                style={{
                                    padding: "10px 10px 0 10px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                }}
                            >
                                <span style={{ marginRight: "20px" }}>
                                    Total Players: {filteredPlayers.length}
                                </span>
                                <span>
                                    Total Participating:{" "}
                                    {
                                        filteredPlayers.filter(
                                            (player) =>
                                                player.participationStatus ===
                                                true
                                        ).length
                                    }
                                </span>
                            </div>
                        )}
                    />
                </>
            )}
        </Space>
    );
}
