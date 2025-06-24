import {
    Button,
    Col,
    DatePicker,
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
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import IAcVoucher from "../../../interfaces/IAcVoucher";
import IPlayer from "../../../interfaces/IPlayer";
import { API_URL } from "../../../settings";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import axiosApi from "../../../state/api/axiosBase";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
const { Text } = Typography;

function AcVouchers() {
    const loginInfo = useSelector(selectLoginInfo);
    const [isMobile, setIsMobile] = useState(false);

    var [tableLoadingSpin, setTableSpinLoading] = useState(false);
    var [playerApiLoading, setPlayerApiLoading] = useState(false);

    const [acVoucherForm] = Form.useForm();
    const [acVouchers, setAcVouchers] = useState<IAcVoucher[]>([]);
    const [acVoucherId, setAcVoucherId] = useState<number>();
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [playerListSize, setPlayerListSize] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState(1000);
    const [players, setPlayers] = useState<IPlayer[]>([]);

    // Modal related properties
    var [modalLoadingSpin, setModalSpinLoading] = useState(false);
    var [modalState, setModalState] = useState("CREATE");
    const [modalOkButtonText, setModalOkButtonText] = useState("Create");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

    const searchInput = useRef<InputRef>(null);

    useEffect(() => {
        getAcVoucherList();
        getPlayers();

        return () => {};
    }, []);

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

    const getAcVoucherList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/vouchers`)
            .then((response) => {
                response.data.content.map(
                    (x: { [x: string]: any; id: any }) => {
                        x["key"] = x.id;
                    }
                );
                setAcVouchers(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error", err);
                setTableSpinLoading(false);
            });
    };

    useEffect(() => {
        if (modalState === "CREATE") {
            setModalOkButtonText("Create");
            setIsFormDisabled(false);
            setAcVoucherId(0);
        } else {
            setModalOkButtonText("Change");
            setIsFormDisabled(false);
        }

        return () => {};
    }, [modalState]);

    const showModal = () => {
        // setPaymentAmount(1000);
        // setPlayerListSize(0);
        clearModalField();
        setModalOpen(true);
    };

    const clearModalField = () => {
        acVoucherForm.resetFields();
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    const getUniqueMonths = () => {
        return [
            ...new Set(
                acVouchers.map((item) => dayjs(item.voucherDate).format("MMMM"))
            ),
        ];
    };

    const getUniqueYears = () => {
        return [
            ...new Set(
                acVouchers.map((item) => dayjs(item.voucherDate).year())
            ),
        ];
    };

    // table rendering settings
    const acVoucherColumns: ColumnsType<IAcVoucher> = [
        {
            title: "Voucher No",
            dataIndex: "code",
            key: "code",
            ...getColumnSearchProps("code"),
        },
        {
            title: "Date",
            dataIndex: "voucherDate",
            key: "voucherDate",
            render: (_: any, record: IAcVoucher) =>
                moment.utc(record.voucherDate).local().format("YYYY-MMM-DD"),
            sorter: (a, b) =>
                dayjs(a.voucherDate).unix() - dayjs(b.voucherDate).unix(),
            filters: [
                ...getUniqueYears().map((year) => ({
                    text: year,
                    value: year,
                })),
                ...getUniqueMonths().map((month) => ({
                    text: month,
                    value: month,
                })),
            ],
            onFilter: (value, record) => {
                if (typeof value === "number") {
                    return dayjs(record.voucherDate).year() === value;
                }
                if (typeof value === "string") {
                    return dayjs(record.voucherDate).format("MMMM") === value;
                }
                return true;
            },
        },
        {
            title: "Type",
            dataIndex: "voucherType.name",
            key: "voucherType.name",
            render: (_: any, record: IAcVoucher) => record.voucherType.name,
        },

        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (_: any, record: IAcVoucher) => (
                <FormatCurrencyWithSymbol amount={record.amount} />
            ),
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Reference",
            dataIndex: "collection",
            key: "collectionCode",
            render: (_: any, record: IAcVoucher) =>
                record.collection
                    ? record.collection.transactionId
                    : record.billPayment
                    ? record.billPayment.code
                    : "",
        },

        // {
        //   title: "Action",
        //   key: "action",
        //   render: (_: any, record: IAcVoucher) => (
        //     <Space size="middle">
        //       <a onClick={() => updateAction(record.id)}>
        //         <EditTwoTone />
        //       </a>
        //     </Space>
        //   ),
        // },
    ];

    const modalFormSubmit = async () => {
        try {
            const values = await acVoucherForm.validateFields();
            console.log("Success:", values);
            setModalConfirmLoading(true);
            console.log(acVoucherForm.getFieldValue("monthOfPayment"));

            if (modalState === "CREATE") {
                axiosApi
                    .post(`${API_URL}/ac/vouchers`, {
                        playerIds: acVoucherForm.getFieldValue("playerIds"),
                        amount: acVoucherForm.getFieldValue("amount"),
                        description: acVoucherForm.getFieldValue("description"),
                        monthOfPayment:
                            acVoucherForm.getFieldValue("monthOfPayment"),
                    })
                    .then((response) => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        getAcVoucherList();
                        console.log(response);
                    })
                    .catch((err) => {
                        // Handle error
                        console.log("server error");
                        setModalConfirmLoading(false);
                    });
            } else {
                axiosApi
                    .put(`${API_URL}/ac/vouchers/${acVoucherId}`, {
                        playerIds: acVoucherForm.getFieldValue("playerIds"),
                        amount: acVoucherForm.getFieldValue("amount"),
                        description: acVoucherForm.getFieldValue("description"),
                        monthOfPayment:
                            acVoucherForm.getFieldValue("monthOfPayment"),
                    })
                    .then((response) => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        getAcVoucherList();
                        setModalState("CREATE");
                    })
                    .catch((err) => {
                        // Handle error
                        console.log("server error");
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
                    response.data?.content?.map(
                        (x: { [x: string]: any; id: any }) => {
                            x["key"] = x.id;
                        }
                    );
                    setPlayers(response.data.content);
                }
                setPlayerApiLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error", err);
                setPlayerApiLoading(false);
            });
    };

    const onChangePlayerList = (selectedValues: any) => {
        const selectedItemCount = selectedValues.length;
        setPlayerListSize(selectedValues.length);
        console.log("Number of selected items:", selectedItemCount);
    };

    const updateAction = (id: number) => {
        setAcVoucherId(id);
        setModalState("UPDATE");
        showModal();
        setModalSpinLoading(true);
        axiosApi
            .get(`${API_URL}/acVouchers/${id}`)
            .then((response) => {
                acVoucherForm.setFieldsValue({
                    name: response.data.content.name,
                    address: response.data.content.address,
                });

                setModalSpinLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error");
                setModalSpinLoading(false);
            });
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', minHeight: '100vh' }}>
            <Row>
                <Col span={24}>
                    <div>
                        <Title level={3} style={{ fontSize: isMobile ? '18px' : '24px' }}>Voucher</Title>
                        <Table
                            loading={tableLoadingSpin}
                            size={isMobile ? "small" : "middle"}
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                                showSizeChanger: !isMobile,
                                showQuickJumper: !isMobile,
                                size: isMobile ? "small" : "default",
                            }}
                            dataSource={acVouchers}
                            columns={acVoucherColumns}
                            scroll={{ 
                                x: isMobile ? 600 : "max-content",
                                y: isMobile ? "60vh" : undefined
                            }}
                        />

                        <Modal
                            title="Monthly Voucher"
                            open={modalOpen}
                            onOk={modalFormSubmit}
                            confirmLoading={modalConfirmLoading}
                            onCancel={handleCancel}
                            okText={modalOkButtonText}
                            okButtonProps={{ disabled: isFormDisabled }}
                            width={700}
                        >
                            <Spin spinning={modalLoadingSpin}>
                                <div>
                                    <Form
                                        name="acVoucherForm"
                                        form={acVoucherForm}
                                        labelCol={{ span: 6 }}
                                        wrapperCol={{ span: 18 }}
                                        initialValues={{ remember: true }}
                                        autoComplete="off"
                                        disabled={isFormDisabled}
                                    >
                                        {modalState !== "CREATE" && (
                                            <Form.Item
                                                label="Transaction ID"
                                                name="transactionId"
                                            >
                                                <Input readOnly={true} />
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
                                        >
                                            <Select
                                                virtual={true}
                                                mode="multiple"
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
                                                onChange={(value, option) =>
                                                    onChangePlayerList(value)
                                                }
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Amount"
                                            name="amount"
                                            initialValue={paymentAmount}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "amount can not be null!",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                defaultValue={paymentAmount} // Sets the initial value
                                                onChange={(value) =>
                                                    setPaymentAmount(value ?? 0)
                                                }
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            label="Month of Voucher"
                                            name="monthOfPayment"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "amount can not be null!",
                                                },
                                            ]}
                                        >
                                            <DatePicker picker="month" />
                                        </Form.Item>
                                        <Form.Item
                                            name="description"
                                            label="Comments"
                                        >
                                            <Input.TextArea />
                                        </Form.Item>
                                    </Form>
                                    {playerListSize > 0 && (
                                        <Typography.Title
                                            level={5}
                                            style={{ margin: 0 }}
                                        >
                                            <Text type="success">
                                                Total transaction amount is
                                                <Text type="success" strong>
                                                    {" "}
                                                    {playerListSize *
                                                        paymentAmount}
                                                </Text>{" "}
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
        </div>
    );
}

export default AcVouchers;
