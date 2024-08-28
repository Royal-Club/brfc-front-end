import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Table, Select, Typography, Space, Skeleton } from "antd";
import useJoinTournament from "../../hooks/useJoinTournament";
import { TournamentPlayerInfoType } from "../../state/features/tournaments/tournamentTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./tournament.css";

const { Title } = Typography;
const { Option } = Select;

export default function JoinTournament() {
    const { id = "" } = useParams();
    const tournamentId = Number(id);
    const { players, isLoading, isUpdating, handleUpdate, nextTournament } =
        useJoinTournament(tournamentId);
    const [editedComments, setEditedComments] = useState<{
        [key: number]: string;
    }>({});

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
                    value={record.participationStatus ? "true" : "false"}
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
                            console.log("debounced value", value);
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
        <Space
            direction="vertical"
            style={{ width: "100%", padding: "0 20px" }}
        >
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <>
                    <Space
                        direction="horizontal"
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <Title level={4}>
                            {nextTournament?.tournamentName}
                        </Title>
                        <Title level={5}>
                            {`Date: ${new Date(
                                nextTournament?.tournamentDate || ""
                            ).toLocaleString()}`}
                        </Title>
                    </Space>
                    <Table
                        rowKey="playerId"
                        columns={columns}
                        dataSource={players}
                        pagination={{ pageSize: 8 }}
                        bordered
                        className="small-table"
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                        }}
                    />
                </>
            )}
        </Space>
    );
}
