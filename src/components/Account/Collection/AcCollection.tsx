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
import { useEffect, useState } from "react";
import IAcCollection from "../../../interfaces/IAcCollection";
import IPlayer from "../../../interfaces/IPlayer";
import { API_URL } from "../../../settings";
import moment from "moment";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import axiosApi from "../../../state/api/axiosBase";
const { Text, Link } = Typography;

function AcCollection() {
    const loginInfo = useSelector(selectLoginInfo);

    var [tableLoadingSpin, setTableSpinLoading] = useState(false);
    var [playerApiLoading, setPlayerApiLoading] = useState(false);

    const [acCollectionForm] = Form.useForm();
    const [acCollections, setAcCollections] = useState<IAcCollection[]>([]);
    const [acCollectionId, setAcCollectionId] = useState<number>();
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
        getAcCollectionList();
        getPlayers();

        return () => {};
    }, []);

    const getAcCollectionList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/collections`)
            .then((response) => {
                response.data.content.map(
                    (x: { [x: string]: any; id: any }) => {
                        x["key"] = x.id;
                    }
                );
                setAcCollections(response.data.content);
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
            setAcCollectionId(0);
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
        acCollectionForm.resetFields();
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    // table rendering settings
    const acCollectionColumns: ColumnsType<IAcCollection> = [
        {
            title: "TrxID",
            dataIndex: "transactionId",
            key: "transactionId",
        },
        {
            title: "Voucher",
            dataIndex: "voucherCode",
            key: "voucherCode",
        },
        {
            title: "Date",
            dataIndex: "createdDate",
            key: "createdDate",
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
        },
        {
            title: "Total Amount",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (_: any, record: IAcCollection) => (
                <FormatCurrencyWithSymbol amount={record.totalAmount} />
            ),
        },
        {
            title: "Month Of Payment",
            dataIndex: "monthOfPayment",
            key: "monthOfPayment",
            render: (_: any, record: IAcCollection) =>
                moment.utc(record.monthOfPayment).local().format("MMM YYYY"),
        },
        // {
        //   title: "Action",
        //   key: "action",
        //   render: (_: any, record: IAcCollection) => (
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
            const values = await acCollectionForm.validateFields();
            console.log("Success:", values);
            setModalConfirmLoading(true);
            console.log(acCollectionForm.getFieldValue("monthOfPayment"));

            if (modalState === "CREATE") {
                axiosApi
                    .post(`${API_URL}/ac/collections`, {
                        playerIds: acCollectionForm.getFieldValue("playerIds"),
                        amount: acCollectionForm.getFieldValue("amount"),
                        description:
                            acCollectionForm.getFieldValue("description"),
                        monthOfPayment:
                            acCollectionForm.getFieldValue("monthOfPayment"),
                    })
                    .then((response) => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        getAcCollectionList();
                        console.log(response);
                    })
                    .catch((err) => {
                        // Handle error
                        console.log("server error");
                        setModalConfirmLoading(false);
                    });
            } else {
                axiosApi
                    .put(`${API_URL}/ac/collections/${acCollectionId}`, {
                        playerIds: acCollectionForm.getFieldValue("playerIds"),
                        amount: acCollectionForm.getFieldValue("amount"),
                        description:
                            acCollectionForm.getFieldValue("description"),
                        monthOfPayment:
                            acCollectionForm.getFieldValue("monthOfPayment"),
                    })
                    .then((response) => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        getAcCollectionList();
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

    // const updateAction = (id: number) => {
    //     setAcCollectionId(id);
    //     setModalState("UPDATE");
    //     showModal();
    //     setModalSpinLoading(true);
    //     axiosApi.get(`${API_URL}/acCollections/${id}`)
    //         .then((response) => {
    //             acCollectionForm.setFieldsValue({
    //                 name: response.data.content.name,
    //                 address: response.data.content.address,
    //             });

    //             setModalSpinLoading(false);
    //         })
    //         .catch((err) => {
    //             // Handle error
    //             console.log("server error");
    //             setModalSpinLoading(false);
    //         });
    // };

    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Title level={4}>Payment Collections</Title>
                        {loginInfo.roles.includes("ADMIN") && (
                            <Button type="primary" onClick={showModal}>
                                Create
                            </Button>
                        )}
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
                            scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
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
                                <div>
                                    <Form
                                        name="acCollectionForm"
                                        form={acCollectionForm}
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
                                            label="Month of Collection"
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

export default AcCollection;
