import { EditTwoTone, SearchOutlined } from "@ant-design/icons";
import {
    Button,
    Col,
    DatePicker,
    DatePickerProps,
    Form,
    Input,
    InputNumber,
    InputRef,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Typography,
} from "antd";
import dayjs from "dayjs";

import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import IAcCollection from "../../../interfaces/IAcCollection";
import IPlayer from "../../../interfaces/IPlayer";
import { API_URL } from "../../../settings";
import axiosApi from "../../../state/api/axiosBase";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import PlayerMonthlyAmountChart from "./PlayerMonthlyAmountChart";
const { Text, Link } = Typography;

function AcCollection() {
    const loginInfo = useSelector(selectLoginInfo);
    const searchInput = useRef<InputRef>(null);
    const [tableLoadingSpin, setTableSpinLoading] = useState(false);
    const [playerApiLoading, setPlayerApiLoading] = useState(false);

    const [acCollectionForm] = Form.useForm();
    const [acCollections, setAcCollections] = useState<IAcCollection[]>([]);
    const [acCollectionId, setAcCollectionId] = useState<number>();
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [playerListSize, setPlayerListSize] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState(1000);
    const [players, setPlayers] = useState<IPlayer[]>([]);

    const [selectedDate, setSelectedDate] = useState<string | string[]>(
        dayjs().format("YYYY-MM-DD")
    );
    const [selectedMonth, setSelectedMonth] = useState<string | string[]>(
        dayjs().format("YYYY-MM-01")
    );

    // Modal related properties
    const [modalLoadingSpin, setModalSpinLoading] = useState(false);
    const [modalState, setModalState] = useState("CREATE");
    const [modalOkButtonText, setModalOkButtonText] = useState("Create");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);
    const [isMultiPlayers, setIsMultiPlayers] = useState(false);

    // console.log(acCollections.map((item) => dayjs(item.monthOfPayment).format("MMMM")));
    const getUniqueMonths = () => {
        return [
            ...new Set(
                acCollections.map((item) =>
                    dayjs(item.monthOfPayment).format("MMMM")
                )
            ),
        ];
    };

    const getUniqueYears = () => {
        return [
            ...new Set(acCollections.map((item) => dayjs(item.date).year())),
        ];
    };

    useEffect(() => {
        getAcCollectionList();
        getPlayers();
    }, []);

    const getAcCollectionList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/collections`)
            .then((response) => {
                response.data.content.forEach(
                    (x: { [x: string]: any; id: any }) => {
                        x["key"] = x.id;
                    }
                );
                setAcCollections(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                console.log("server error", err);
                setTableSpinLoading(false);
            });
    };

    useEffect(() => {
        if (modalState === "CREATE") {
            setModalOkButtonText("Create");
            setIsFormDisabled(false);
            setAcCollectionId(0);
        } else {
            setModalOkButtonText("Change");
            setIsFormDisabled(false);
        }
    }, [modalState]);

    const showModal = () => {
        setModalOkButtonText("Create");
        clearModalField();
        setIsMultiPlayers(false);
        setModalOpen(true);
    };

    const showModalForMultiple = () => {
        clearModalField();
        setModalOpen(true);
        setModalOkButtonText("Create(s)");
        setIsMultiPlayers(true);
    };

    const clearModalField = () => {
        acCollectionForm.resetFields();
        setSelectedDate(dayjs().format("YYYY-MM-DD"));
        setSelectedMonth(dayjs().format("YYYY-MM-01"));
        setPaymentAmount(1000);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
        confirm();
    };

    const handleReset = (clearFilters: any) => {
        clearFilters();
    };

    const getColumnSearchProps = (dataIndex: any) => ({
        filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }: any) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) =>
                        setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
                    onPressEnter={() =>
                        handleSearch(selectedKeys, confirm, dataIndex)
                    }
                    style={{ marginBottom: 8, display: "block" }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() =>
                            handleSearch(selectedKeys, confirm, dataIndex)
                        }
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() =>
                            clearFilters && handleReset(clearFilters)
                        }
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({ closeDropdown: false });
                        }}
                    >
                        Filter
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: any) => (
            <SearchOutlined
                style={{ color: filtered ? "#1890ff" : undefined }}
            />
        ),
        onFilter: (value: any, record: any) =>
            record[dataIndex]
                ?.toString()
                ?.toLowerCase()
                ?.includes(value.toLowerCase()),
        onFilterDropdownOpenChange: (visible: any) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text: any) => text,
    });

    // table rendering settings
    const acCollectionColumns: ColumnsType<IAcCollection> = [
        {
            title: "TrxID",
            dataIndex: "transactionId",
            key: "transactionId",
            ...getColumnSearchProps("transactionId"),
        },
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (_, record) => dayjs(record.date).format("YYYY-MMM-DD"),
            sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
            filters: getUniqueYears().map((year) => ({
                text: year.toString(),
                value: year,
            })),
            onFilter: (value, record) => {
                return dayjs(record.date).year() === value;
            },
        },
        {
            title: "Month Of Payment",
            dataIndex: "monthOfPayment",
            key: "monthOfPayment",
            render: (_, record) =>
                dayjs(record.monthOfPayment).format("MMM YYYY"),
            sorter: (a, b) =>
                dayjs(a.monthOfPayment).unix() - dayjs(b.monthOfPayment).unix(),
            filters: getUniqueMonths().map((month) => ({
                text: month,
                value: month,
            })),
            onFilter: (value, record) => {
                return dayjs(record.monthOfPayment).format("MMMM") === value;
            },
        },
        {
            title: "Payeer Name",
            dataIndex: "allPayersName",
            key: "allPayersName",
            render: (_: any, record: IAcCollection) => {
                if (record.players.length > 1) {
                    return <>Expand to see</>;
                } else {
                    return <span>{record.allPayersName}</span>;
                }
            },
        },
        Table.EXPAND_COLUMN,
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (_: any, record: IAcCollection) => (
                <FormatCurrencyWithSymbol amount={record.amount} />
            ),
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Voucher",
            dataIndex: "voucherCode",
            key: "voucherCode",
            ...getColumnSearchProps("voucherCode"),
        },
        {
            title: "Total Amount",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (_: any, record: IAcCollection) => (
                <FormatCurrencyWithSymbol amount={record.totalAmount} />
            ),
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: IAcCollection) => (
                <Space size="middle">
                    <a onClick={() => updateAction(record.id)}>
                        <EditTwoTone />
                    </a>
                </Space>
            ),
        },
    ];

    const onChangeDate: DatePickerProps["onChange"] = (date, dateString) => {
        setSelectedDate(dateString);
    };

    const onChangeMonth: DatePickerProps["onChange"] = (date, dateString) => {
        setSelectedMonth(dateString + "-01");
    };

    const onChangeAmount = (value: number) => {
        setPaymentAmount(value);
    };

    const modalFormSubmit = async () => {
        try {
            await acCollectionForm.validateFields();
            setModalConfirmLoading(true);

            const playerIds = acCollectionForm.getFieldValue("playerIds");

            const requestData = {
                playerIds: Array.isArray(playerIds) ? playerIds : [playerIds],
                amount: acCollectionForm.getFieldValue("amount"),
                description: acCollectionForm.getFieldValue("description"),
                monthOfPayment: selectedMonth,
                date: selectedDate,
            };

            if (modalState === "CREATE") {
                axiosApi
                    .post(`${API_URL}/ac/collections`, requestData)
                    .then(() => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        getAcCollectionList();
                    })
                    .catch((err) => {
                        console.log("server error", err);
                        setModalConfirmLoading(false);
                    });
            } else {
                axiosApi
                    .put(
                        `${API_URL}/ac/collections/${acCollectionId}`,
                        requestData
                    )
                    .then(() => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        getAcCollectionList();
                        setModalState("CREATE");
                    })
                    .catch((err) => {
                        console.log("server error", err);
                        setModalConfirmLoading(false);
                    });
            }
        } catch (errorInfo) {
            console.log("Failed:", errorInfo);
        }
    };

    const getPlayers = () => {
        setPlayerApiLoading(true);
        axiosApi
            .get(`${API_URL}/players`)
            .then((response) => {
                if (response.data?.content) {
                    response.data?.content.forEach(
                        (x: { [x: string]: any; id: any }) => {
                            x["key"] = x.id;
                        }
                    );
                    setPlayers(response.data.content);
                }
                setPlayerApiLoading(false);
            })
            .catch((err) => {
                console.log("server error", err);
                setPlayerApiLoading(false);
            });
    };

    const onChangePlayerList = (selectedValues: any) => {
        setPlayerListSize(selectedValues.length);
    };

    const updateAction = (id: number) => {
        setAcCollectionId(id);
        setModalState("UPDATE");
        showModal();
        setModalSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/collections/${id}`)
            .then((response) => {
                const formattedDate = dayjs(response.data.content.date).format(
                    "YYYY-MM-DD"
                );
                const formattedMonthOfPayment = dayjs(
                    response.data.content.monthOfPayment
                ).format("YYYY-MM");

                setSelectedDate(formattedDate);
                setSelectedMonth(formattedMonthOfPayment + "-01");

                acCollectionForm.setFieldsValue({
                    transactionId: response.data.content.transactionId,
                    playerIds: response.data.content.playerIds,
                    amount: response.data.content.amount,
                    description: response.data.content.description,
                    monthOfPayment: dayjs(
                        response.data.content.monthOfPayment,
                        "YYYY-MM"
                    ),
                    date: dayjs(response.data.content.date, "YYYY-MM-DD"),
                });

                // Check if playerIds has more than 1 element
                const playerIds = response.data.content.playerIds;
                if (Array.isArray(playerIds) && playerIds.length > 1) {
                    setModalOkButtonText("Change(s)");
                    setIsMultiPlayers(true);
                } else {
                    setModalOkButtonText("Change");
                    setIsMultiPlayers(false);
                }

                setModalSpinLoading(false);
            })
            .catch((err) => {
                console.log("server error", err);
                setModalSpinLoading(false);
            });
    };

    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Row align="bottom" justify="space-between">
                            <Col>
                                <Title level={3}>Payment Collections</Title>
                            </Col>
                            <Col>
                                {loginInfo.roles.includes("ADMIN") && (
                                    <Space>
                                        <Button
                                            type="primary"
                                            onClick={showModal}
                                        >
                                            Create
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={showModalForMultiple}
                                        >
                                            Create(s)
                                        </Button>
                                    </Space>
                                )}
                            </Col>
                        </Row>
                        <PlayerMonthlyAmountChart
                            acCollections={acCollections}
                        />
                        <Table
                            loading={tableLoadingSpin}
                            size="small"
                            dataSource={acCollections}
                            columns={acCollectionColumns}
                            expandable={{
                                expandedRowRender: (record) => (
                                    <p style={{ margin: 0 }}>
                                        {record.allPayersName}
                                    </p>
                                ),
                                rowExpandable: (record) =>
                                    record.players.length > 1,
                            }}
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                            }}
                            scroll={{ x: "max-content" }}
                        />

                        <Modal
                            title="Payment Collection"
                            open={modalOpen}
                            onOk={modalFormSubmit}
                            confirmLoading={modalConfirmLoading}
                            onCancel={handleCancel}
                            okText={modalOkButtonText}
                            okButtonProps={{ disabled: isFormDisabled }}
                            width={700}
                        >
                            <Spin spinning={modalLoadingSpin}>
                                <div style={{ padding: "0 16px" }}>
                                    <Form
                                        name="acCollectionForm"
                                        form={acCollectionForm}
                                        labelCol={{ span: 6 }}
                                        wrapperCol={{ span: 18 }}
                                        initialValues={{
                                            remember: true,
                                            date: dayjs(),
                                            monthOfPayment: dayjs(),
                                            amount: 1000,
                                        }}
                                        autoComplete="off"
                                        disabled={isFormDisabled}
                                    >
                                        {modalState !== "CREATE" && (
                                            <Form.Item
                                                label="Transaction ID"
                                                name="transactionId"
                                                style={{ marginBottom: "16px" }}
                                            >
                                                <Input
                                                    readOnly={true}
                                                    style={{
                                                        borderRadius: "4px",
                                                    }}
                                                />
                                            </Form.Item>
                                        )}

                                        <Form.Item
                                            label="Player"
                                            name="playerIds"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Player can not be null!",
                                                },
                                            ]}
                                            style={{ marginBottom: "16px" }}
                                        >
                                            <Select
                                                virtual
                                                mode={
                                                    isMultiPlayers
                                                        ? "multiple"
                                                        : undefined
                                                }
                                                showSearch
                                                placeholder="Select a Player"
                                                filterOption={(input, option) =>
                                                    (option?.label ?? "")
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase()
                                                        )
                                                }
                                                options={players.map(
                                                    (player) => ({
                                                        value: player.id,
                                                        label: `${player.name} [${player.employeeId}]`,
                                                    })
                                                )}
                                                loading={playerApiLoading}
                                                onChange={onChangePlayerList}
                                                style={{ borderRadius: "4px" }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Collection Date"
                                            name="date"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Date can not be null!",
                                                },
                                            ]}
                                            style={{ marginBottom: "16px" }}
                                        >
                                            <DatePicker
                                                mode="date"
                                                onChange={onChangeDate}
                                                defaultValue={dayjs()}
                                                style={{
                                                    width: "100%",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Amount"
                                            name="amount"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Amount can not be null!",
                                                },
                                            ]}
                                            style={{ marginBottom: "16px" }}
                                        >
                                            <InputNumber
                                                defaultValue={1000}
                                                onChange={(value) =>
                                                    onChangeAmount(value ?? 0)
                                                }
                                                style={{
                                                    width: "100%",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Month of Collection"
                                            name="monthOfPayment"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Month can not be null!",
                                                },
                                            ]}
                                            style={{ marginBottom: "16px" }}
                                        >
                                            <DatePicker
                                                onChange={onChangeMonth}
                                                picker="month"
                                                defaultValue={dayjs()}
                                                style={{
                                                    width: "100%",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="description"
                                            label="Comments"
                                            style={{ marginBottom: "16px" }}
                                        >
                                            <Input.TextArea
                                                style={{ borderRadius: "4px" }}
                                            />
                                        </Form.Item>
                                    </Form>

                                    {playerListSize > 0 &&
                                        paymentAmount > 0 && (
                                            <Typography.Title
                                                level={5}
                                                style={{
                                                    margin: 0,
                                                    marginTop: "16px",
                                                }}
                                            >
                                                <Text type="success">
                                                    Total transaction amount is{" "}
                                                    <Text type="success" strong>
                                                        {` ${
                                                            playerListSize *
                                                            paymentAmount
                                                        }`}
                                                    </Text>
                                                    BDT.
                                                </Text>
                                            </Typography.Title>
                                        )}
                                </div>
                            </Spin>
                        </Modal>
                    </div>
                </Col>
            </Row>
        </>
    );
}

export default AcCollection;
