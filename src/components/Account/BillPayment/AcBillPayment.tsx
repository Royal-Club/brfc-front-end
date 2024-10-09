import { CheckCircleTwoTone, EditTwoTone } from "@ant-design/icons";
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
    Space,
    Spin,
    TableColumnsType,
    Typography,
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import { API_URL } from "../../../settings";
import moment from "moment";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
import ICostType from "../../../interfaces/ICostType";
import axiosApi from "../../../state/api/axiosBase";
const { Text, Link } = Typography;

function AcBillPayment() {
    const loginInfo = useSelector(selectLoginInfo);

    var [tableLoadingSpin, setTableSpinLoading] = useState(false);
    var [costTypeApiLoading, setCostTypeApiLoading] = useState(false);

    const [acBillPaymentForm] = Form.useForm();
    const [acBillPayments, setAcBillPayments] = useState<IAcBillPayment[]>([]);
    const [acBillPaymentId, setAcBillPaymentId] = useState<number>();
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [costTypeListSize, setCostTypeListSize] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [costTypes, setCostTypes] = useState<ICostType[]>([]);

    // Modal related properties
    var [modalLoadingSpin, setModalSpinLoading] = useState(false);
    var [modalState, setModalState] = useState("CREATE");
    const [modalOkButtonText, setModalOkButtonText] = useState("Create");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

    useEffect(() => {
        getAcBillPaymentList();
        getCostTypes();

        return () => {};
    }, []);

    const getAcBillPaymentList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/bill-payments`)
            .then((response) => {
                response.data.content.map(
                    (x: { [x: string]: any; id: any }) => {
                        x["key"] = x.id;
                    }
                );
                setAcBillPayments(response.data.content);
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
            setAcBillPaymentId(0);
        } else {
            setModalOkButtonText("Change");
            setIsFormDisabled(false);
        }

        return () => {};
    }, [modalState]);

    const showModal = () => {
        // setPaymentAmount(1000);
        // setCostTypeListSize(0);
        clearModalField();
        setModalOpen(true);
    };

    const clearModalField = () => {
        acBillPaymentForm.resetFields();
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalSpinLoading(false);
        setModalState("CREATE");
    };

    // table rendering settings
    const acBillPaymentColumns: ColumnsType<IAcBillPayment> = [
        {
            title: "Bill ID",
            dataIndex: "code",
            key: "code",
        },
        {
            title: "Voucher",
            dataIndex: "voucherCode",
            key: "voucherCode",
        },
        {
            title: "Date",
            dataIndex: "paymentDate",
            key: "paymentDate",
            render: (_: any, record: IAcBillPayment) =>
                moment.utc(record.paymentDate).local().format("DD-MMM-YYYY"),
        },
        {
            title: "Cost Type",
            dataIndex: "costType.name",
            key: "costType.name",
            render: (_: any, record: IAcBillPayment) => record.costType?.name,
        },
        // {
        //   title: "Date",
        //   dataIndex: "createdDate",
        //   key: "createdDate",
        // },
        // {
        //   title: "Payeer Name",
        //   dataIndex: "allPayersName",
        //   key: "allPayersName",
        //   render: (_: any, record: IAcBillPayment) => {
        //     if (record.costTypes.length > 1) {
        //       return <>Expand to see</>;
        //     } else {
        //       return <span>{record.allPayersName}</span>;
        //     }
        //   },
        // },
        Table.EXPAND_COLUMN,
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (_: any, record: IAcBillPayment) => (
                <FormatCurrencyWithSymbol amount={record.amount} />
            ),
        },
        // {
        //   title: "Total Amount",
        //   dataIndex: "totalAmount",
        //   key: "totalAmount",
        //   render: (_: any, record: IAcBillPayment) => (
        //     <FormatCurrencyWithSymbol amount={record.totalAmount} />
        //   ),
        // },

        // {
        //   title: "Action",
        //   key: "action",
        //   render: (_: any, record: IAcBillPayment) => (
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
            const values = await acBillPaymentForm.validateFields();
            console.log("Success:", values);
            setModalConfirmLoading(true);
            console.log(acBillPaymentForm.getFieldValue("paymentDate"));

            if (modalState === "CREATE") {
                axiosApi
                    .post(`${API_URL}/ac/bill-payments`, {
                        costTypeId:
                            acBillPaymentForm.getFieldValue("costTypeId"),
                        amount: acBillPaymentForm.getFieldValue("amount"),
                        description:
                            acBillPaymentForm.getFieldValue("description"),
                        paymentDate:
                            acBillPaymentForm.getFieldValue("paymentDate"),
                        isPaid: true,
                    })
                    .then((response) => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        getAcBillPaymentList();
                        console.log(response);
                    })
                    .catch((err) => {
                        // Handle error
                        console.log("server error");
                        setModalConfirmLoading(false);
                    });
            } else {
                axiosApi
                    .put(`${API_URL}/ac/bill-payments/${acBillPaymentId}`, {
                        costTypeId:
                            acBillPaymentForm.getFieldValue("costTypeId"),
                        amount: acBillPaymentForm.getFieldValue("amount"),
                        description:
                            acBillPaymentForm.getFieldValue("description"),
                        paymentDate:
                            acBillPaymentForm.getFieldValue("paymentDate"),
                        isPaid: true,
                    })
                    .then((response) => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        getAcBillPaymentList();
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

    const getCostTypes = () => {
        setCostTypeApiLoading(true);
        axiosApi
            .get(`${API_URL}/cost-types`)
            .then((response) => {
                if (response.data?.content) {
                    response.data?.content?.map(
                        (x: { [x: string]: any; id: any }) => {
                            x["key"] = x.id;
                        }
                    );
                    setCostTypes(response.data.content);
                }
                setCostTypeApiLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error", err);
                setCostTypeApiLoading(false);
            });
    };

    const onChangeCostTypeList = (selectedValues: any) => {
        const selectedItemCount = selectedValues.length;
        setCostTypeListSize(selectedValues.length);
        console.log("Number of selected items:", selectedItemCount);
    };

    const updateAction = (id: number) => {
        setAcBillPaymentId(id);
        setModalState("UPDATE");
        showModal();
        setModalSpinLoading(true);
        axiosApi
            .get(`${API_URL}/acBillPayments/${id}`)
            .then((response) => {
                acBillPaymentForm.setFieldsValue({
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
                        <Title level={4}>Bill Payment</Title>
                        {loginInfo.roles.includes("ADMIN") && (
                            <Button type="primary" onClick={showModal}>
                                Create
                            </Button>
                        )}
                        <Table
                            loading={tableLoadingSpin}
                            size="small"
                            dataSource={acBillPayments}
                            columns={acBillPaymentColumns}
                            // expandable={{
                            //   expandedRowRender: (record) => (
                            //     <p style={{ margin: 0 }}>{record.allPayersName}</p>
                            //   ),
                            //   rowExpandable: (record) => record.costTypes.length > 1,
                            // }}
                            scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
                        />

                        <Modal
                            title="Bill Payment"
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
                                        name="acBillPaymentForm"
                                        form={acBillPaymentForm}
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
                                            label="CostType"
                                            name="costTypeId"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "CostType can not be null!",
                                                },
                                            ]}
                                        >
                                            <Select
                                                virtual={true}
                                                showSearch
                                                placeholder="Select a CostType"
                                                filterOption={(input, option) =>
                                                    (option?.label ?? "")
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase()
                                                        )
                                                }
                                                options={costTypes.map(
                                                    (costType) => ({
                                                        value: costType.id,
                                                        label: `${costType.name}`,
                                                    })
                                                )}
                                                loading={costTypeApiLoading}
                                                onChange={(value, option) =>
                                                    onChangeCostTypeList(value)
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
                                            label="Date"
                                            name="paymentDate"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "amount can not be null!",
                                                },
                                            ]}
                                        >
                                            <DatePicker picker="date" />
                                        </Form.Item>
                                        <Form.Item
                                            name="description"
                                            label="Comments"
                                        >
                                            <Input.TextArea />
                                        </Form.Item>
                                    </Form>
                                    {costTypeListSize > 0 && (
                                        <Typography.Title
                                            level={5}
                                            style={{ margin: 0 }}
                                        >
                                            <Text type="success">
                                                Total transaction amount is
                                                <Text type="success" strong>
                                                    {" "}
                                                    {costTypeListSize *
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

export default AcBillPayment;
