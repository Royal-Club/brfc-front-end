import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    Table,
    Select,
    Typography,
    Space,
    Skeleton,
    Input,
    Grid,
    Breakpoint,
    theme,
} from "antd";
import useJoinTournament from "../../hooks/useJoinTournament";
import { TournamentPlayerInfoType } from "../../state/features/tournaments/tournamentTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./tournament.css";
import { CheckCircleTwoTone, RightSquareOutlined } from "@ant-design/icons";
import { showBdLocalTime } from "./../../utils/utils";

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;
const { useBreakpoint } = Grid;

export default function JoinTournament() {
    const { id = "" } = useParams();
    const tournamentId = Number(id);
    const { players, isLoading, isUpdating, handleUpdate, nextTournament } =
        useJoinTournament(tournamentId);

    const [editedComments, setEditedComments] = useState<{
        [key: number]: string;
    }>({});

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const [searchTerm, setSearchTerm] = useState("");
    const screens = useBreakpoint();

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
            width: screens.xs ? 120 : 300,
            render: (_: any, record: TournamentPlayerInfoType) => (
                <Space
                    style={{
                        display: "flex",
                        padding: "0 5px",
                        justifyContent: "space-between",
                    }}
                >
                    {record.playerName}{" "}
                    {record.participationStatus === true && (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />
                    )}
                </Space>
            ),
        },
        {
            title: "Employee ID",
            dataIndex: "employeeId",
            key: "employeeId",
            width: screens.xs ? 100 : 200,
        },
        {
            title: "Participation Status",
            dataIndex: "participationStatus",
            key: "participationStatus",
            width: screens.xs ? 100 : 200,
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
                    style={{ width: "100%" }}
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
            width: screens.xs ? 300 : "auto", // Full width on small screens
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
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <>
                    <Space
                        direction={screens.xs ? "vertical" : "horizontal"}
                        style={{
                            display: "flex",
                            padding: "10px",
                            justifyContent: "space-between",
                            alignItems: screens.xs ? "start" : "end",
                            flexWrap: "wrap",
                            background: colorBgContainer,
                        }}
                    >
                        <Space direction="vertical">
                            <Title
                                level={2}
                                style={{
                                    margin: 0,
                                    fontWeight: 600,
                                    fontSize: "18px",
                                }}
                            >
                                {nextTournament?.tournamentName}
                            </Title>
                            <Space
                                direction="horizontal"
                                size={0}
                                style={{
                                    lineHeight: 1.2,
                                    display: "flex",
                                    gap: screens.xs ? "10px" : "30px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ margin: 0, fontSize: "14px" }}
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
                                    style={{ margin: 0, fontSize: "14px" }}
                                >
                                    <RightSquareOutlined /> Total Players:{" "}
                                    {filteredPlayers.length}
                                </Title>
                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ margin: 0, fontSize: "14px" }}
                                >
                                    <RightSquareOutlined /> Total Participating:{" "}
                                    {
                                        filteredPlayers.filter(
                                            (player) =>
                                                player.participationStatus ===
                                                true
                                        ).length
                                    }
                                </Title>
                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ margin: 0, fontSize: "14px" }}
                                >
                                    <RightSquareOutlined /> Pending
                                    Participating:{" "}
                                    {
                                        filteredPlayers.filter(
                                            (player) =>
                                                player.participationStatus ===
                                                null
                                        ).length
                                    }
                                </Title>
                            </Space>
                        </Space>
                        <Search
                            placeholder="Search players"
                            onSearch={(value) => setSearchTerm(value)}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                maxWidth: 300,
                                marginTop: "10px",
                            }}
                        />
                    </Space>

                    <Table
                        rowKey="playerId"
                        columns={columns}
                        dataSource={filteredPlayers}
                        pagination={false}
                        bordered
                        size="middle"
                        scroll={{ x: "max-content", y: "76vh" }}
                        className="slimScroll"
                    />
                </>
            )}
        </Space>
    );
}
