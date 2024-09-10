import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Table, Select, Typography, Space, Skeleton, Input } from "antd";
import useJoinTournament from "../../hooks/useJoinTournament";
import { TournamentPlayerInfoType } from "../../state/features/tournaments/tournamentTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./tournament.css";
import { RightSquareOutlined } from "@ant-design/icons";
import { showBdLocalTime } from "./../../utils/utils";

const { Title, Text } = Typography;
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
        <Space direction="vertical" style={{ padding: "0 0 10px 0" }}>
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 13 }} />
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
                            flexWrap: "wrap",
                        }}
                    >
                        <Space direction="vertical">
                            <Title
                                level={2}
                                style={{ margin: 0, fontWeight: 600, fontSize: '18px' }}
                            >
                                {nextTournament?.tournamentName}
                            </Title>
                            <Space
                                direction="horizontal"
                                size={0}
                                style={{
                                    lineHeight: 1.2,
                                    display: "flex",
                                    gap: "30px",
                                    flexWrap: "wrap", // Adjust for smaller screens
                                }}
                            >
                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ margin: 0, fontSize: '14px' }}
                                >
                                    <RightSquareOutlined />{" "}
                                    {nextTournament?.tournamentDate &&
                                        showBdLocalTime(
                                            nextTournament?.tournamentDate
                                        )}
                                </Title>

                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ margin: 0, fontSize: '14px' }}
                                >
                                    <RightSquareOutlined /> Total Players:{" "}
                                    {filteredPlayers.length}
                                </Title>
                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ margin: 0, fontSize: '14px' }}
                                >
                                    <RightSquareOutlined />
                                    Total Participating:{" "}
                                    {
                                        filteredPlayers.filter(
                                            (player) =>
                                                player.participationStatus ===
                                                true
                                        ).length
                                    }
                                </Title>
                            </Space>
                        </Space>
                        <Search
                            placeholder="Search players"
                            onSearch={(value) => setSearchTerm(value)}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: "100%", maxWidth: 300, marginTop: '10px' }}
                        />
                    </Space>

             
                 <Table
                        rowKey="playerId"
                        columns={columns}
                        dataSource={filteredPlayers}
                        pagination={false}
                        bordered
                        size="small"
                        scroll={{ y: 740  }}
                        className="slimScroll"
                        
                    />
                 
                </>
            )}
        </Space>
    );
}
