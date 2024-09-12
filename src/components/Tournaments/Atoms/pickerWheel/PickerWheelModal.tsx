import React, { useState, useCallback } from "react";
import { Modal, Button, Input, List, Radio, Space } from "antd";
import PickerWheel from "./PickerWheel";
import "./pickerWheelModal.css";
import { CheckOutlined, DeleteOutlined, UnorderedListOutlined } from "@ant-design/icons";

import LogoImage from "../../../../assets/logo.png";
import colors from "../../../../utils/colors";
import WinnerFrequencyChart from "./WinnerFrequencyChart";

const PickerWheelModal = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isWinnerModalVisible, setIsWinnerModalVisible] = useState(false);
    const [isWinnersListModalVisible, setIsWinnersListModalVisible] = useState(false); // New modal for winners list
    const [segments, setSegments] = useState([
        { name: "Segment 1", disabled: false },
        { name: "Segment 2", disabled: false },
        { name: "Segment 3", disabled: false },
    ]);
    const [segColors, setSegColors] = useState([
        "#FF5733",
        "#33FF57",
        "#3357FF",
    ]);
    const [newSegment, setNewSegment] = useState("");
    const [winner, setWinner] = useState("");
    const [winnersList, setWinnersList] = useState<string[]>([]); // List to track all winners

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

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
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
                title="lottery"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={1000}
            >
                <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                >
                    <div style={{ flex: 1 }}>
                        <PickerWheel
                            segments={segments
                                .filter((segment) => !segment.disabled)
                                .map((segment) => segment.name)}
                            segColors={segColors}
                            onFinished={handleSpinFinished}
                            size={250}
                            maxWidth={520}
                            maxHeight={520}
                            centerImageSrc={LogoImage}
                            fontFamily="Segoe UI"
                        />
                    </div>

                    <div style={{ flex: 1, marginLeft: "16px" }}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                            <div
                                style={{
                                    marginBottom: "16px",
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
                                    placeholder="Enter segment name"
                                    style={{ width: "100%" }}
                                />
                                <Button
                                    onClick={handleAddSegment}
                                    icon={<CheckOutlined />}
                                ></Button>
                            </div>

                            <List
                                className="slimScroll"
                                dataSource={segments}
                                renderItem={(segment, index) => (
                                    <List.Item
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "4px",
                                            marginBottom: "8px",
                                            fontWeight: 500,
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
                                                style={{
                                                    color: "red",
                                                    padding: "0 8px",
                                                }}
                                                icon={<DeleteOutlined />}
                                            />,
                                        ]}
                                    >
                                        {segment.name}
                                    </List.Item>
                                )}
                                style={{
                                    maxHeight: "450px",
                                    overflowY: "auto",
                                    height: "100%",
                                    backgroundColor:
                                        segments.length > 0
                                            ? ""
                                            : colors.background,
                                }}
                            />
                        </Space>
                    </div>
                </div>

                {/* Button to view winners */}
                <Button
                    icon={<UnorderedListOutlined />}
                    onClick={() => setIsWinnersListModalVisible(true)} // Open the winners list modal
                    style={{
                        marginTop: "16px",
                    }}
                >
                    View Winners
                </Button>
            </Modal>

            {/* Modal to display individual winner */}
            <Modal
                title="Congratulations!"
                visible={isWinnerModalVisible}
                onOk={handleWinnerModalOk}
                onCancel={handleWinnerModalOk}
                footer={[
                    <Button
                        key="ok"
                        type="primary"
                        onClick={handleWinnerModalOk}
                    >
                        OK
                    </Button>,
                ]}
            >
                <p>
                    The winner is: <strong>{winner}</strong>
                </p>
            </Modal>

        
            <Modal
                title="Winners List"
                visible={isWinnersListModalVisible}
                onOk={handleWinnersListModalOk}
                onCancel={handleWinnersListModalOk}
                footer={[
                    <Button
                        key="ok"
                        type="primary"
                        onClick={handleWinnersListModalOk}
                    >
                        OK
                    </Button>,
                ]}
            >
                <WinnerFrequencyChart winnersList={winnersList} />
                <List
                className="slimScroll"
                    style={{ marginTop: "16px" , maxHeight: "320px", overflowY: "auto"}}

                    dataSource={winnersList}
                    renderItem={(winner, index) => (
                        <List.Item>
                            <strong> {index + 1}. </strong>
                            {winner}
                        </List.Item>
                    )}
                />
            </Modal>
        </div>
    );
};

export default PickerWheelModal;
