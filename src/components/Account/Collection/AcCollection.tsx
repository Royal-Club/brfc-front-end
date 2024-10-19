import { EditTwoTone } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  DatePickerProps,
  Form,
  Input,
  InputNumber,
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
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import IAcCollection from "../../../interfaces/IAcCollection";
import IPlayer from "../../../interfaces/IPlayer";
import { API_URL } from "../../../settings";
import axiosApi from "../../../state/api/axiosBase";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
const { Text, Link } = Typography;

function AcCollection() {
  const loginInfo = useSelector(selectLoginInfo);

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

  useEffect(() => {
    getAcCollectionList();
    getPlayers();
  }, []);

  const getAcCollectionList = () => {
    setTableSpinLoading(true);
    axiosApi
      .get(`${API_URL}/ac/collections`)
      .then((response) => {
        response.data.content.forEach((x: { [x: string]: any; id: any }) => {
          x["key"] = x.id;
        });
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

  // table rendering settings
  const acCollectionColumns: ColumnsType<IAcCollection> = [
    {
      title: "TrxID",
      dataIndex: "transactionId",
      key: "transactionId",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (_, record) => dayjs(record.date).format("YYYY-MMM-DD"),
    },
    {
      title: "Month Of Payment",
      dataIndex: "monthOfPayment",
      key: "monthOfPayment",
      render: (_, record) => dayjs(record.monthOfPayment).format("MMM YYYY"),
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
      title: "Voucher",
      dataIndex: "voucherCode",
      key: "voucherCode",
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
          .put(`${API_URL}/ac/collections/${acCollectionId}`, requestData)
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
          response.data?.content.forEach((x: { [x: string]: any; id: any }) => {
            x["key"] = x.id;
          });
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
            <Title level={4}>Payment Collections</Title>
            {loginInfo.roles.includes("ADMIN") && (
              <>
                <Space>
                  <Button type="primary" onClick={showModal}>
                    Create
                  </Button>
                  <Button type="primary" onClick={showModalForMultiple}>
                    Create(s)
                  </Button>
                </Space>
              </>
            )}
            <Table
              loading={tableLoadingSpin}
              size="small"
              dataSource={acCollections}
              columns={acCollectionColumns}
              expandable={{
                expandedRowRender: (record) => (
                  <p style={{ margin: 0 }}>{record.allPayersName}</p>
                ),
                rowExpandable: (record) => record.players.length > 1,
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
                <div>
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
                      <Form.Item label="Transaction ID" name="transactionId">
                        <Input readOnly={true} />
                      </Form.Item>
                    )}

                    <Form.Item
                      label="Player"
                      name="playerIds"
                      rules={[
                        {
                          required: true,
                          message: "Player can not be null!",
                        },
                      ]}
                    >
                      <Select
                        virtual={true}
                        // mode={`${isMultiPlayers} ? "multiple" : ""`}
                        mode={isMultiPlayers ? "multiple" : undefined}
                        showSearch
                        placeholder="Select a Player"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={players.map((player) => ({
                          value: player.id,
                          label: `${player.name} [${player.employeeId}]`,
                        }))}
                        loading={playerApiLoading}
                        onChange={(value) => onChangePlayerList(value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Collection Date"
                      name="date"
                      rules={[
                        {
                          required: true,
                          message: "amount can not be null!",
                        },
                      ]}
                    >
                      <DatePicker
                        mode="date"
                        onChange={onChangeDate}
                        defaultValue={dayjs()}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Amount"
                      name="amount"
                      rules={[
                        {
                          required: true,
                          message: "amount can not be null!",
                        },
                      ]}
                    >
                      <InputNumber
                        defaultValue={1000}
                        onChange={(value) => onChangeAmount(value ?? 0)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Month of Collection"
                      name="monthOfPayment"
                      rules={[
                        {
                          required: true,
                          message: "amount can not be null!",
                        },
                      ]}
                    >
                      <DatePicker
                        onChange={onChangeMonth}
                        picker="month"
                        defaultValue={dayjs()}
                      />
                    </Form.Item>

                    <Form.Item name="description" label="Comments">
                      <Input.TextArea />
                    </Form.Item>
                  </Form>
                  {playerListSize > 0 && paymentAmount > 0 && (
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      <Text type="success">
                        Total transaction amount is
                        <Text type="success" strong>
                          {` ${playerListSize * paymentAmount}`}
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
