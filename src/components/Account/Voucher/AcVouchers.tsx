import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Spin,
    Typography,
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import IAcVoucher from "../../../interfaces/IAcVoucher";
import IPlayer from "../../../interfaces/IPlayer";
import { API_URL } from "../../../settings";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import axiosApi from "../../../state/api/axiosBase";
const { Text } = Typography;

function AcVouchers() {
    const loginInfo = useSelector(selectLoginInfo);

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

    useEffect(() => {
        getAcVoucherList();
        getPlayers();

        return () => {};
    }, []);

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

    // table rendering settings
    const acVoucherColumns: ColumnsType<IAcVoucher> = [
        {
            title: "Voucher No",
            dataIndex: "code",
            key: "code",
        },
        {
            title: "Date",
            dataIndex: "voucherDate",
            key: "voucherDate",
            render: (_: any, record: IAcVoucher) =>
                moment.utc(record.voucherDate).local().format("YYYY-MMM-DD"),
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
        },
        {
            title: "Reference",
            dataIndex: "collection.code",
            key: "collection.code",
            render: (_: any, record: IAcVoucher) =>
                record.collection
                    ? record.collection.transactionId
                    : record.billPayment
                    ? record.billPayment.code
                    : "",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (_: any, record: IAcVoucher) => (
                <FormatCurrencyWithSymbol amount={record.amount} />
            ),
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

    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Title level={4}>Voucher</Title>
                        {/* {loginInfo.roles.includes("ADMIN") && <Button type="primary" onClick={showModal}>
              Create
            </Button>} */}
                        <Table
                            loading={tableLoadingSpin}
                            size="small"
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                            }}
                            dataSource={acVouchers}
                            columns={acVoucherColumns}
                            scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
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
        </>
    );
}

export default AcVouchers;
