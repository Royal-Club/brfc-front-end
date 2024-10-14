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
import dayjs from "dayjs";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
import ICostType from "../../../interfaces/ICostType";
import axiosApi from "../../../state/api/axiosBase";
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

  // Modal related properties
  const [modalLoadingSpin, setModalSpinLoading] = useState(false);
  const [modalState, setModalState] = useState("CREATE");
  const [modalOkButtonText, setModalOkButtonText] = useState("Create");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

  useEffect(() => {
    getAcBillPaymentList();
    getCostTypes();
  }, []);

  const getAcBillPaymentList = () => {
    setTableSpinLoading(true);
    axiosApi
      .get(`${API_URL}/ac/bill-payments`)
      .then((response) => {
        response.data.content.forEach((x: { [x: string]: any; id: any }) => {
          x["key"] = x.id;
        });
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
      render: (_, record) => dayjs(record.paymentDate).format("DD-MMM-YYYY"),
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
          .put(`${API_URL}/ac/bill-payments/${acBillPaymentId}`, requestData)
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
          paymentDate: dayjs(response.data.content.paymentDate, "YYYY-MM-DD"),
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
              scroll={{ x: "max-content" }}
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
                    initialValues={{
                      remember: true,
                      paymentDate: dayjs(),
                    }}
                    autoComplete="off"
                    disabled={isFormDisabled}
                  >
                    {modalState !== "CREATE" && (
                      <Form.Item label="Bill ID" name="code">
                        <Input readOnly={true} />
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
                    >
                      <Select
                        virtual={true}
                        showSearch
                        placeholder="Select a CostType"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={costTypes.map((costType) => ({
                          value: costType.id,
                          label: `${costType.name}`,
                        }))}
                        loading={costTypeApiLoading}
                        onChange={(value) => onChangeCostTypeList(value)}
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
                    >
                      <InputNumber
                        defaultValue={paymentAmount}
                        onChange={(value) => setPaymentAmount(value ?? 0)}
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
                    >
                      <DatePicker format="YYYY-MM-DD" defaultValue={dayjs()} />
                    </Form.Item>

                    <Form.Item name="description" label="Comments">
                      <Input.TextArea />
                    </Form.Item>
                  </Form>
                  {costTypeListSize > 0 && (
                    <Typography.Title level={5} style={{ margin: 0 }}>
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
