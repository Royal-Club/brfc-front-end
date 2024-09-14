import { CheckCircleTwoTone, EditTwoTone } from "@ant-design/icons";
import { Button, Col, Form, Input, Modal, Row, Space, Spin } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import axios from "axios";
import { useEffect, useState } from "react";
import IVenue from "../../interfaces/IVenue";
import { API_URL } from "../../settings";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";

function Venue() {
  const loginInfo = useSelector(selectLoginInfo);

  var [tableLoadingSpin, setTableSpinLoading] = useState(false);

  const [venueForm] = Form.useForm();
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [venueId, setVenueId] = useState<number>();
  const [isFormDisabled, setIsFormDisabled] = useState(false);

  // Modal related properties
  var [modalLoadingSpin, setModalSpinLoading] = useState(false);
  var [modalState, setModalState] = useState("CREATE");
  const [modalOkButtonText, setModalOkButtonText] = useState("Create");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

  useEffect(() => {
    getVenueList();

    return () => {};
  }, []);

  const getVenueList = () => {
    setTableSpinLoading(true);
    axios
      .get(`${API_URL}/venues`)
      .then((response) => {
        response.data.content.map((x: { [x: string]: any; id: any }) => {
          x["key"] = x.id;
        });
        setVenues(response.data.content);
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
      setVenueId(0);
    } else {
      setModalOkButtonText("Change");
      setIsFormDisabled(false);
    }

    return () => {};
  }, [modalState]);

  const showModal = () => {
    clearModalField();
    setModalOpen(true);
  };

  const clearModalField = () => {
    venueForm.setFieldsValue({
      name: "",
      address: "",
      activeStatus: true,
    });
  };

  const handleCancel = () => {
    setModalOpen(false);
    setModalSpinLoading(false);
    setModalState("CREATE");
  };

  // table rendering settings
  const CommonColumns: ColumnsType<IVenue> = [
    {
      title: "Venue Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_: any, record: IVenue) => {
        if (record.active) {
          return (
            <span>
              <CheckCircleTwoTone twoToneColor="#52c41a" /> Active
            </span>
          );
        } else {
          return (
            <span>
              <CheckCircleTwoTone twoToneColor="#eb2f96" /> InActive
            </span>
          );
        }
      },
    },
  ];

  const venueColumns: ColumnsType<IVenue> = loginInfo.roles.includes("ADMIN")
    ? [
        ...CommonColumns,
        {
          title: "Action",
          key: "action",
          render: (_: any, record: IVenue) => (
            <Space size="middle">
              <a onClick={() => updateAction(record.id)}>
                <EditTwoTone />
              </a>
            </Space>
          ),
        },
      ]
    : CommonColumns;

  const modalFormSubmit = async () => {
    try {
      const values = await venueForm.validateFields();
      console.log("Success:", values);
      setModalConfirmLoading(true);

      if (modalState === "CREATE") {
        axios
          .post(`${API_URL}/venues`, {
            name: venueForm.getFieldValue("name"),
            address: venueForm.getFieldValue("address"),
          })
          .then((response) => {
            setModalOpen(false);
            clearModalField();
            setModalConfirmLoading(false);
            getVenueList();
            console.log(response);
          })
          .catch((err) => {
            // Handle error
            console.log("server error");
            setModalConfirmLoading(false);
          });
      } else {
        axios
          .put(`${API_URL}/venues/${venueId}`, {
            name: venueForm.getFieldValue("name"),
            address: venueForm.getFieldValue("address"),
          })
          .then((response) => {
            clearModalField();
            setModalOpen(false);
            setModalConfirmLoading(false);
            getVenueList();
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

  const updateAction = (id: number) => {
    setVenueId(id);
    setModalState("UPDATE");
    showModal();
    setModalSpinLoading(true);
    axios
      .get(`${API_URL}/venues/${id}`)
      .then((response) => {
        venueForm.setFieldsValue({
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
            <Space style={{ marginBottom: 16, justifyContent: "space-between" , display: "flex" , alignItems: "center"}}>
              <Title level={4}>Venue</Title>
              {loginInfo.roles.includes("ADMIN") && (
                <Button type="primary" onClick={showModal}>
                  Create
                </Button>
              )}
            </Space>

            <Table
              loading={tableLoadingSpin}
              size="small"
              dataSource={venues}
              columns={venueColumns}
              scroll={{ x: "max-content" }} 
            />

            <Modal
              title="Venue"
              open={modalOpen}
              onOk={modalFormSubmit}
              confirmLoading={modalConfirmLoading}
              onCancel={handleCancel}
              okText={modalOkButtonText}
              okButtonProps={{ disabled: isFormDisabled }}
            >
              <Spin spinning={modalLoadingSpin}>
                <div>
                  <Form
                    name="venueForm"
                    form={venueForm}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ remember: true }}
                    autoComplete="off"
                    disabled={isFormDisabled}
                  >
                    <Form.Item
                      label="Venue Name"
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: "Venue Name can not be null!",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Address">
                      <Input.TextArea />
                    </Form.Item>
                  </Form>
                </div>
              </Spin>
            </Modal>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Venue;
