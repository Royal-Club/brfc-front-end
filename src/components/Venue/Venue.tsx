import { CheckCircleTwoTone, EditTwoTone } from "@ant-design/icons";
import { Button, Col, Form, Input, Modal, Row, Space, Spin } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IVenue from "../../interfaces/IVenue";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import {
    useCreateVenueMutation,
    useGetVanuesQuery,
    useUpdateVenueMutation,
} from "../../state/features/vanues/vanuesSlice";

function Venue() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: venues, isLoading: tableLoadingSpin } = useGetVanuesQuery();

    const [createVenue] = useCreateVenueMutation();
    const [updateVenue] = useUpdateVenueMutation();

    const [venueForm] = Form.useForm();
    const [venueId, setVenueId] = useState<number>();
    const [isFormDisabled, setIsFormDisabled] = useState(false);

    // Modal related properties
    var [modalLoadingSpin, setModalSpinLoading] = useState(false);
    var [modalState, setModalState] = useState("CREATE");
    const [modalOkButtonText, setModalOkButtonText] = useState("Create");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);

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
                            <CheckCircleTwoTone twoToneColor="#eb2f96" />{" "}
                            InActive
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
                createVenue({
                    name: venueForm.getFieldValue("name"),
                    address: venueForm.getFieldValue("address"),
                })
                    .unwrap()
                    .then((response) => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        // getVenueList();
                        console.log(response);
                    })
                    .catch((err) => {
                        console.log("server error");
                        setModalConfirmLoading(false);
                    });
            } else {
                updateVenue({
                    id: venueId,
                    name: venueForm.getFieldValue("name"),
                    address: venueForm.getFieldValue("address"),
                })
                    .unwrap()
                    .then((response) => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        // getVenueList();
                        setModalState("CREATE");
                        console.log(response);
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

    const updateAction = (id: number) => {
        setVenueId(id);
        setModalState("UPDATE");
        showModal();
        setModalSpinLoading(true);

        const singleVenue = venues?.content.find((venue) => venue.id === id);
        venueForm.setFieldsValue({
            name: singleVenue?.name,
            address: singleVenue?.address,
            activeStatus: singleVenue?.active,
        });

        setModalSpinLoading(false);
    };

    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Space
                            style={{
                                marginBottom: 16,
                                justifyContent: "space-between",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
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
                            dataSource={venues?.content}
                            columns={venueColumns}
                            scroll={{ x: "max-content" }}
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                            }}
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
                                                    message:
                                                        "Venue Name can not be null!",
                                                },
                                            ]}
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            name="address"
                                            label="Address"
                                        >
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
