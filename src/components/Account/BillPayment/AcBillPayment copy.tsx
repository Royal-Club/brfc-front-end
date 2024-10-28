import { EditTwoTone } from "@ant-design/icons";
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
  Table,
  Typography,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
import ICostType from "../../../interfaces/ICostType";
import { API_URL } from "../../../settings";
import axiosApi from "../../../state/api/axiosBase";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";

const { Text, Title } = Typography;

function AcBillPayment1() {
  const loginInfo = useSelector(selectLoginInfo);

  const [tableLoading, setTableLoading] = useState(false);
  const [costTypeLoading, setCostTypeLoading] = useState(false);
  const [form] = Form.useForm();
  const [billPayments, setBillPayments] = useState<IAcBillPayment[]>([]);
  const [billPaymentId, setBillPaymentId] = useState<number | undefined>();
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [costTypes, setCostTypes] = useState<ICostType[]>([]);
  const [modalState, setModalState] = useState("CREATE");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

  useEffect(() => {
    fetchBillPayments();
    fetchCostTypes();
  }, []);

  useEffect(() => {
    setModalState(modalState === "CREATE" ? "Create" : "Update");
    setIsFormDisabled(false);
    if (modalState === "CREATE") setBillPaymentId(undefined);
  }, [modalState]);

  const fetchBillPayments = () => {
    setTableLoading(true);
    axiosApi
      .get(`${API_URL}/ac/bill-payments`)
      .then((response) => {
        const dataWithKeys = response.data.content.map((item: IAcBillPayment) => ({
          ...item,
          key: item.id,
        }));
        setBillPayments(dataWithKeys);
      })
      .catch(console.error)
      .finally(() => setTableLoading(false));
  };

  const fetchCostTypes = () => {
    setCostTypeLoading(true);
    axiosApi
      .get(`${API_URL}/cost-types`)
      .then((response) => {
        const costTypesWithKeys = response.data.content.map((item: ICostType) => ({
          ...item,
          key: item.id,
        }));
        setCostTypes(costTypesWithKeys);
      })
      .catch(console.error)
      .finally(() => setCostTypeLoading(false));
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalState("CREATE");
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      await form.validateFields();
      setModalConfirmLoading(true);
      const formattedData = {
        ...form.getFieldsValue(),
        paymentDate: dayjs(form.getFieldValue("paymentDate")).format(
          "YYYY-MM-DD"
        ),
        isPaid: true,
      };

      const request =
        modalState === "CREATE"
          ? axiosApi.post(`${API_URL}/ac/bill-payments`, formattedData)
          : axiosApi.put(
              `${API_URL}/ac/bill-payments/${billPaymentId}`,
              formattedData
            );

      request
        .then(() => {
          fetchBillPayments();
          handleModalCancel();
        })
        .catch(console.error)
        .finally(() => setModalConfirmLoading(false));
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const openUpdateModal = (id: number) => {
    setBillPaymentId(id);
    setModalState("UPDATE");
    setModalVisible(true);
    setModalConfirmLoading(true);
    axiosApi
      .get(`${API_URL}/ac/bill-payments/${id}`)
      .then((response) => {
        form.setFieldsValue({
          ...response.data.content,
          paymentDate: dayjs(response.data.content.paymentDate),
        });
      })
      .catch(console.error)
      .finally(() => setModalConfirmLoading(false));
  };

  const getUniqueYears = () => {
    return [
      ...new Set(billPayments.map((item) => dayjs(item.paymentDate).year())),
    ];
  };

  const getUniqueMonths = () => {
    return [
      ...new Set(
        billPayments.map((item) => dayjs(item.paymentDate).format("MMMM"))
      ),
    ];
  };

  const columns: ColumnsType<IAcBillPayment> = [
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
      render: (_, record) => dayjs(record.paymentDate).format("DD-MMM-YYYY"),
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
      dataIndex: ["costType", "name"],
      key: "costType.name",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <FormatCurrencyWithSymbol amount={value} />,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => openUpdateModal(record.id)}>
            <EditTwoTone />
          </a>
        </Space>
      ),
    },
  ];

  const totalAmount = billPayments.reduce((acc, item) => acc + item.amount, 0);

  return (
    <>
      <Row>
        <Col span={24}>
          <Title level={4}>Bill Payment</Title>
          {loginInfo.roles.includes("ADMIN") && (
            <Button type="primary" onClick={() => setModalVisible(true)}>
              Create
            </Button>
          )}
          <Table
            loading={tableLoading}
            size="small"
            dataSource={billPayments}
            columns={columns}
            pagination={{ showTotal: (total) => `Total ${total} records` }}
            summary={() => {
              const filteredTotal = billPayments.length ? billPayments.reduce((acc, { amount }) => acc + amount, 0) : 0;
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Total Amount:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text>{<FormatCurrencyWithSymbol amount={filteredTotal} />}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />

          <Modal
            title="Bill Payment"
            visible={modalVisible}
            onOk={handleFormSubmit}
            confirmLoading={modalConfirmLoading}
            onCancel={handleModalCancel}
            okText={modalState === "CREATE" ? "Create" : "Update"}
            okButtonProps={{ disabled: isFormDisabled }}
            width={700}
          >
            <Spin spinning={modalConfirmLoading}>
              <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{ paymentDate: dayjs() }}
                autoComplete="off"
              >
                {modalState !== "CREATE" && (
                  <Form.Item label="Bill ID" name="code">
                    <Input readOnly />
                  </Form.Item>
                )}
                <Form.Item
                  label="Cost Type"
                  name="costTypeId"
                  rules={[{ required: true, message: "CostType cannot be null!" }]}
                >
                  <Select
                    showSearch
                    placeholder="Select a CostType"
                    options={costTypes.map(({ id, name }) => ({ value: id, label: name }))}
                    loading={costTypeLoading}
                  />
                </Form.Item>
                <Form.Item
                  label="Amount"
                  name="amount"
                  rules={[{ required: true, message: "Amount cannot be null!" }]}
                >
                  <InputNumber />
                </Form.Item>
                <Form.Item
                  label="Date"
                  name="paymentDate"
                  rules={[{ required: true, message: "Payment date cannot be null!" }]}
                >
                  <DatePicker format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item label="Comments" name="description">
                  <Input.TextArea />
                </Form.Item>
              </Form>
            </Spin>
          </Modal>
        </Col>
      </Row>
    </>
  );
}

export default AcBillPayment1;
