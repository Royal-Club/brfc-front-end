import React, { useState, useCallback, useEffect } from "react";
import { Modal, Button, Input, List, Radio, Space, theme } from "antd";
import PickerWheel from "./PickerWheel";
import "./pickerWheelModal.css";
import { CheckOutlined, DeleteOutlined, UnorderedListOutlined } from "@ant-design/icons";
import LogoImage from "../../../../assets/logo.png";
import { useMediaQuery } from 'react-responsive'
import { Team } from "../../tournamentTypes";

interface PickerWheelModalProps {
    teams?: Team[];
}

// Default segments to show when no captains are available
const defaultSegments = [
    { name: "Player 1", disabled: false },
    { name: "Player 2", disabled: false },
    { name: "Player 3", disabled: false },
    { name: "Player 4", disabled: false },
];

const defaultColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
];

const PickerWheelModal: React.FC<PickerWheelModalProps> = ({ teams = [] }) => {
    const isMobile = useMediaQuery({ query: '(max-width: 767px)' })
    const { token } = theme.useToken();

    // Detect dark mode by checking if background is dark
    const isDarkMode = token.colorBgContainer === '#141414' || token.colorBgContainer === '#1f1f1f';
    const headerBgColor = isDarkMode ? '#001529' : token.colorPrimary;

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isWinnerModalVisible, setIsWinnerModalVisible] = useState(false);
    const [isWinnersListModalVisible, setIsWinnersListModalVisible] = useState(false);
    const [segments, setSegments] = useState(defaultSegments);
    const [segColors, setSegColors] = useState(defaultColors);
    const [newSegment, setNewSegment] = useState("");
    const [winner, setWinner] = useState("");
    const [winnersList, setWinnersList] = useState<string[]>([]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // Auto-populate segments with team captains when teams are available
    useEffect(() => {
        if (teams && teams.length > 0) {
            const captains: { name: string; disabled: boolean }[] = [];
            const captainColors: string[] = [];

            teams.forEach((team) => {
                const captain = team.players.find((player) => player.isCaptain);
                if (captain) {
                    captains.push({ name: captain.playerName, disabled: false });
                    captainColors.push(getRandomColor());
                }
            });

            // Update with captains if found, otherwise keep default segments
            if (captains.length > 0) {
                setSegments(captains);
                setSegColors(captainColors);
            } else {
                // Reset to default when no captains
                setSegments(defaultSegments);
                setSegColors(defaultColors);
            }
        }
    }, [teams]);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleAddSegment = useCallback(() => {
        if (newSegment.trim() !== "") {
            setSegments((prevSegments) => [
                ...prevSegments,
                { name: newSegment.trim(), disabled: false },
            ]);
            setSegColors((prevColors) => [...prevColors, getRandomColor()]);
            setNewSegment("");
        }
    }, [newSegment]);

    const handleRemoveSegment = useCallback((index: number) => {
        setSegments((prevSegments) =>
            prevSegments.filter((_, i) => i !== index)
        );
        setSegColors((prevColors) => prevColors.filter((_, i) => i !== index));
    }, []);

    const handleToggleSegment = (index: number) => {
        setSegments((prevSegments) =>
            prevSegments.map((segment, i) =>
                i === index
                    ? { ...segment, disabled: !segment.disabled }
                    : segment
            )
        );
    };

    const handleSpinFinished = (winnerSegment: string) => {
        setWinner(winnerSegment);
        setWinnersList((prevWinners) => [...prevWinners, winnerSegment]); // Add the winner to the winners list
        setIsWinnerModalVisible(true);
    };

    const handleWinnerModalOk = () => {
        setIsWinnerModalVisible(false);
    };

    const handleWinnersListModalOk = () => {
        setIsWinnersListModalVisible(false);
    };

    return (
        <div>
            <Button
                onClick={showModal}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                lottery
            </Button>

            <Modal
                title={
                    <div style={{
                        background: headerBgColor,
                        padding: "12px 20px",
                        margin: "-20px -24px 20px -24px",
                        borderRadius: "8px 8px 0 0",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "600",
                        textAlign: "center",
                    }}>
                        Lottery Wheel
                    </div>
                }
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={1000}
                styles={{
                    body: {
                        padding: "24px",
                    }
                }}
                style={{
                    top: 20,
                }}
            >
                <div
                    style={{
                        display: isMobile ? "block" : "flex",
                        justifyContent: "space-between",
                        gap: "24px"
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <PickerWheel
                            segments={segments
                                .filter((segment) => !segment.disabled)
                                .map((segment) => segment.name)}
                            segColors={segColors}
                            onFinished={handleSpinFinished}
                            size={isMobile ? 170 : 250}
                            maxWidth={isMobile ?350 : 500}
                            maxHeight={isMobile ? 350 : 500}
                            fontSize={isMobile ? 15 : 20}
                            centerImageSrc={LogoImage}
                            fontFamily="Segoe UI"
                            wheelBackground={headerBgColor}
                        />
                    </div>

                    <div style={{
                        flex: 1,
                        marginLeft: isMobile ? "0" : "16px",
                        marginTop: isMobile ? "16px" : "0"
                    }}>
                        <Space direction="vertical" style={{ width: "100%" }}                        
                        >
                            <div
                                style={{
                                    padding: "16px",
                                    background: "transparent",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(0, 0, 0, 0.1)",
                                }}
                            >
                                <div style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    marginBottom: "12px",
                                    color: "#667eea"
                                }}>
                                    Add New Player
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <Input
                                        value={newSegment}
                                        onChange={(e) =>
                                            setNewSegment(e.target.value)
                                        }
                                        onPressEnter={handleAddSegment}
                                        placeholder="Enter player name"
                                        style={{
                                            width: "100%",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <Button
                                        onClick={handleAddSegment}
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        style={{
                                            borderRadius: "8px",
                                        }}
                                    ></Button>
                                </div>
                            </div>

                            <div style={{
                                background: "transparent",
                                borderRadius: "12px",
                                padding: "16px",
                                border: "1px solid rgba(0, 0, 0, 0.1)",
                            }}>
                                <div style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    marginBottom: "12px",
                                    color: "#667eea"
                                }}>
                                    Players ({segments.length})
                                </div>
                                <List
                                    className="slimScroll"
                                    dataSource={segments}
                                    renderItem={(segment, index) => (
                                        <List.Item
                                            style={{
                                                padding: "12px",
                                                borderRadius: "8px",
                                                marginBottom: "4px",
                                                marginRight: "2px",
                                                fontWeight: 500,
                                                background: segment.disabled
                                                    ? "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)"
                                                    : "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                                                border: "none",
                                                transition: "all 0.3s ease",
                                                cursor: "default",
                                            }}
                                            actions={[
                                                <Radio
                                                    value={segment.name}
                                                    type="sq"
                                                    checked={!segment.disabled}
                                                    onClick={() =>
                                                        handleToggleSegment(index)
                                                    }
                                                    className="square-radio"
                                                ></Radio>,
                                                <Button
                                                    type="link"
                                                    onClick={() =>
                                                        handleRemoveSegment(index)
                                                    }
                                                    danger
                                                    style={{
                                                        padding: "0 8px",
                                                    }}
                                                    icon={<DeleteOutlined />}
                                                />,
                                            ]}
                                        >
                                            <span style={{
                                                color: segment.disabled ? "#999" : "#2e7d32",
                                                textDecoration: segment.disabled ? "line-through" : "none",
                                            }}>
                                                {segment.name}
                                            </span>
                                        </List.Item>
                                    )}
                                    style={{
                                        maxHeight: "400px",
                                        overflowY: "auto",
                                        height: "100%",
                                        backgroundColor: "transparent",
                                    }}
                                />
                            </div>
                        </Space>
                    </div>
                </div>

                {/* Button to view winners */}
                <Button
                    icon={<UnorderedListOutlined />}
                    onClick={() => setIsWinnersListModalVisible(true)}
                    type="primary"
                    style={{
                        marginTop: "16px",
                    }}
                >
                    View Winners
                </Button>
            </Modal>

            {/* Modal to display individual winner */}
            <Modal
                title={
                    <div style={{
                        background: headerBgColor,
                        padding: "12px 20px",
                        margin: "-20px -24px 20px -24px",
                        borderRadius: "8px 8px 0 0",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "600",
                        textAlign: "center",
                    }}>
                        Congratulations!
                    </div>
                }
                visible={isWinnerModalVisible}
                onOk={handleWinnerModalOk}
                onCancel={handleWinnerModalOk}
                width={400}
                footer={[
                    <Button
                        key="ok"
                        type="primary"
                        onClick={handleWinnerModalOk}
                    >
                        OK
                    </Button>,
                ]}
                styles={{
                    body: {
                        padding: "24px",
                        textAlign: "center",
                    }
                }}
            >
                <div style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#667eea",
                    marginBottom: "8px",
                }}>
                    The winner is:
                </div>
                <div style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    padding: "16px",
                }}>
                    {winner}
                </div>
            </Modal>


            <Modal
                title={
                    <div style={{
                        background: headerBgColor,
                        padding: "12px 20px",
                        margin: "-20px -24px 20px -24px",
                        borderRadius: "8px 8px 0 0",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "600",
                        textAlign: "center",
                    }}>
                        Winners History
                    </div>
                }
                visible={isWinnersListModalVisible}
                onOk={handleWinnersListModalOk}
                onCancel={handleWinnersListModalOk}
                width={700}
                footer={[
                    <Button
                        key="ok"
                        type="primary"
                        onClick={handleWinnersListModalOk}
                    >
                        Close
                    </Button>,
                ]}
                styles={{
                    body: {
                        padding: "24px",
                        maxHeight: "600px",
                        overflowY: "auto",
                    }
                }}
            >
                {/* <div style={{
                    background: "transparent",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                }}>
                    <WinnerFrequencyChart winnersList={winnersList} />
                </div> */}
                <div style={{
                    background: "transparent",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                }}>
                    <div style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "12px",
                        color: "#667eea"
                    }}>
                        All Winners ({winnersList.length})
                    </div>
                    <List
                        className="slimScroll"
                        style={{ maxHeight: "400px", overflowY: "auto"}}
                        dataSource={winnersList}
                        renderItem={(winner, index) => (
                            <List.Item
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    marginBottom: "8px",
                                    marginRight: "2px",
                                    background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                                    border: "none",
                                }}
                            >
                                <span style={{
                                    fontWeight: "600",
                                    color: "#1976d2",
                                    marginRight: "8px",
                                }}>
                                    #{index + 1}
                                </span>
                                <span style={{
                                    color: "#424242",
                                    fontWeight: "500",
                                }}>
                                    {winner}
                                </span>
                            </List.Item>
                        )}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PickerWheelModal;
