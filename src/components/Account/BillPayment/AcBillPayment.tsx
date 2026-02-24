import {
    CheckCircleTwoTone,
    EditTwoTone,
    SearchOutlined,
} from "@ant-design/icons";
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
    TableColumnsType,
    Typography,
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../settings";
import dayjs from "dayjs";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
import ICostType from "../../../interfaces/ICostType";
import axiosApi from "../../../state/api/axiosBase";
import AcBillPaymentGraph from "./AcBillPaymentGraph";
const { Text } = Typography;

function AcBillPayment() {
    const loginInfo = useSelector(selectLoginInfo);

    const [tableLoadingSpin, setTableSpinLoading] = useState(false);
    const [costTypeApiLoading, setCostTypeApiLoading] = useState(false);
    const [acBillPaymentForm] = Form.useForm();
    const [acBillPayments, setAcBillPayments] = useState<IAcBillPayment[]>([]);
    const [acBillPaymentId, setAcBillPaymentId] = useState<number>();
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [costTypeListSize, setCostTypeListSize] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [costTypes, setCostTypes] = useState<ICostType[]>([]);
    const [filteredYear, setFilteredYear] = useState(null);
    const [filteredMonth, setFilteredMonth] = useState(null);

    // Modal related properties
    const [modalLoadingSpin, setModalSpinLoading] = useState(false);
    const [modalState, setModalState] = useState("CREATE");
    const [modalOkButtonText, setModalOkButtonText] = useState("Create");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

    const searchInput = useRef<InputRef>(null);

    useEffect(() => {
        getAcBillPaymentList();
        getCostTypes();
    }, []);

    const getAcBillPaymentList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/bill-payments`)
            .then((response) => {
                response.data.content.forEach(
                    (x: { [x: string]: any; id: any }) => {
                        x["key"] = x.id;
                    }
                );
                setAcBillPayments(response.data.content);
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
            setAcBillPaymentId(0);
        } else {
            setModalOkButtonText("Change");
            setIsFormDisabled(false);
        }
    }, [modalState]);

    const showModal = () => {
        clearModalField();
        setModalOpen(true);
    };

    const clearModalField = () => {
        acBillPaymentForm.resetFields();
        setPaymentAmount(0);
    };

    const getUniqueYears = () => {
        return [
            ...new Set(
                acBillPayments.map((item) => dayjs(item.paymentDate).year())
            ),
        ];
    };

    const getUniqueMonths = () => {
        return [
            ...new Set(
                acBillPayments.map((item) =>
                    dayjs(item.paymentDate).format("MMMM")
                )
            ),
        ];
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
            ...getColumnSearchProps("code"),
        },
        {
            title: "Voucher",
            dataIndex: "voucherCode",
            key: "voucherCode",
            ...getColumnSearchProps("voucherCode"),
        },
        {
            title: "Date",
            dataIndex: "paymentDate",
            key: "paymentDate",
            render: (_, record) =>
                dayjs(record.paymentDate).format("DD-MMM-YYYY"),
            // showSorterTooltip: { target: 'full-header' },
            sorter: (a, b) =>
                dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix(),
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
                    // Filtering by year
                    return dayjs(record.paymentDate).year() === value;
                }
                if (typeof value === "string") {
                    // Filtering by month name
                    return dayjs(record.paymentDate).format("MMMM") === value;
                }
                return true;
            },
        },
        {
            title: "Cost Type",
            dataIndex: "costType.name",
            key: "costType.name",
            render: (_: any, record: IAcBillPayment) => record.costType?.name,
        },
        Table.EXPAND_COLUMN,
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (_: any, record: IAcBillPayment) => (
                <FormatCurrencyWithSymbol amount={record.amount} />
            ),
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: IAcBillPayment) => (
                <Space size="middle">
                    <a onClick={() => updateAction(record.id)}>
                        <EditTwoTone />
                    </a>
                </Space>
            ),
        },
    ];

    const modalFormSubmit = async () => {
        try {
            await acBillPaymentForm.validateFields();
            setModalConfirmLoading(true);

            const paymentDate = acBillPaymentForm.getFieldValue("paymentDate");
            const formattedPaymentDate = paymentDate
                ? dayjs(paymentDate).format("YYYY-MM-DD")
                : null;

            const requestData = {
                costTypeId: acBillPaymentForm.getFieldValue("costTypeId"),
                amount: acBillPaymentForm.getFieldValue("amount"),
                description: acBillPaymentForm.getFieldValue("description"),
                paymentDate: formattedPaymentDate,
                isPaid: true,
            };

            if (modalState === "CREATE") {
                axiosApi
                    .post(`${API_URL}/ac/bill-payments`, requestData)
                    .then((response) => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        getAcBillPaymentList();
                        console.log(response);
                    })
                    .catch((err) => {
                        console.log("server error");
                        setModalConfirmLoading(false);
                    });
            } else {
                axiosApi
                    .put(
                        `${API_URL}/ac/bill-payments/${acBillPaymentId}`,
                        requestData
                    )
                    .then((response) => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        getAcBillPaymentList();
                        setModalState("CREATE");
                    })
                    .catch((err) => {
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
                    response.data?.content?.forEach(
                        (x: { [x: string]: any; id: any }) => {
                            x["key"] = x.id;
                        }
                    );
                    setCostTypes(response.data.content);
                }
                setCostTypeApiLoading(false);
            })
            .catch((err) => {
                console.log("server error", err);
                setCostTypeApiLoading(false);
            });
    };

    const onChangeCostTypeList = (selectedValues: any) => {
        setCostTypeListSize(selectedValues.length);
    };

    const updateAction = (id: number) => {
        setAcBillPaymentId(id);
        setModalState("UPDATE");
        showModal();
        setModalSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/bill-payments/${id}`)
            .then((response) => {
                acBillPaymentForm.setFieldsValue({
                    code: response.data.content.code,
                    costTypeId: response.data.content.costType?.id,
                    amount: response.data.content.amount,
                    description: response.data.content.description,
                    paymentDate: dayjs(
                        response.data.content.paymentDate,
                        "YYYY-MM-DD"
                    ),
                });
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
                        <Row align="middle" justify="space-between">
                            <Title level={3}>Bill Payment</Title>
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <Button type="primary" onClick={showModal}>
                                    Create
                                </Button>
                            )}
                        </Row>
                        {acBillPayments.length > 0 && (
                            <AcBillPaymentGraph
                                acBillPayments={acBillPayments}
                            />
                        )}
                        <Table
                            loading={tableLoadingSpin}
                            size="small"
                            dataSource={acBillPayments}
                            columns={acBillPaymentColumns}
                            scroll={{ x: "max-content" }}
                            showSorterTooltip={{ target: "sorter-icon" }}
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                            }}
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
    <div style={{ padding: "0 16px" }}>
      <Form
        name="acBillPaymentForm"
        form={acBillPaymentForm}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        initialValues={{
          remember: true,
          paymentDate: dayjs(),
        }}
        autoComplete="off"
        disabled={isFormDisabled}
      >
        {modalState !== "CREATE" && (
          <Form.Item
            label="Bill ID"
            name="code"
            style={{ marginBottom: "16px" }}
          >
            <Input readOnly={true} style={{ borderRadius: "4px" }} />
          </Form.Item>
        )}

        <Form.Item
          label="CostType"
          name="costTypeId"
          rules={[
            {
              required: true,
              message: "CostType can not be null!",
            },
          ]}
          style={{ marginBottom: "16px" }}
        >
          <Select
            virtual={true}
            showSearch
            placeholder="Select a CostType"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={costTypes.map((costType) => ({
              value: costType.id,
              label: `${costType.name}`,
            }))}
            loading={costTypeApiLoading}
            onChange={(value) => onChangeCostTypeList(value)}
            style={{ borderRadius: "4px" }}
          />
        </Form.Item>

        <Form.Item
          label="Amount"
          name="amount"
          initialValue={paymentAmount}
          rules={[
            {
              required: true,
              message: "amount can not be null!",
            },
          ]}
          style={{ marginBottom: "16px" }}
        >
          <InputNumber
            defaultValue={paymentAmount}
            onChange={(value) => setPaymentAmount(value ?? 0)}
            style={{ width: "100%", borderRadius: "4px" }}
          />
        </Form.Item>

        <Form.Item
          label="Date"
          name="paymentDate"
          rules={[
            {
              required: true,
              message: "Payment date cannot be null!",
            },
          ]}
          style={{ marginBottom: "16px" }}
        >
          <DatePicker
            format="YYYY-MM-DD"
            defaultValue={dayjs()}
            style={{ width: "100%", borderRadius: "4px" }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Comments"
          style={{ marginBottom: "16px" }}
        >
          <Input.TextArea style={{ borderRadius: "4px" }} />
        </Form.Item>
      </Form>
      {costTypeListSize > 0 && (
        <Typography.Title level={5} style={{ margin: 0, marginTop: "16px" }}>
          <Text type="success">
            Total transaction amount is
            <Text type="success" strong>
              {` ${costTypeListSize * paymentAmount}`}
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

export default AcBillPayment;
