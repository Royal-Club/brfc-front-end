import { EditOutlined, PlusOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space, Spin, Typography } from "antd";
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
import { club } from "../../theme/clubTheme";
import "./Venue.css";

const { Text } = Typography;

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
            render: (name: string) => (
                <Space size={8}>
                    <EnvironmentOutlined style={{ color: club.gold, fontSize: 14 }} />
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
            render: (address: string) => (
                <Text type="secondary">{address || "—"}</Text>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (_: any, record: IVenue) => (
                <span className={`brfc-status brfc-status--${record.active ? "active" : "inactive"}`}>
                    <span className="brfc-status__dot" />
                    {record.active ? "Active" : "Inactive"}
                </span>
            ),
        },
    ];

    const venueColumns: ColumnsType<IVenue> = (loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN"))
        ? [
              ...CommonColumns,
              {
                  title: "Action",
                  key: "action",
                  render: (_: any, record: IVenue) => (
                      <Button
                          size="small"
                          icon={<EditOutlined />}
                          className="brfc-act-btn"
                          onClick={() => updateAction(record.id)}
                      >
                          Edit
                      </Button>
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
                    .then((response: any) => {
                        setModalOpen(false);
                        clearModalField();
                        setModalConfirmLoading(false);
                        // getVenueList();
                        console.log(response);
                    })
                    .catch((err: any) => {
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
                    .then((response: any) => {
                        clearModalField();
                        setModalOpen(false);
                        setModalConfirmLoading(false);
                        // getVenueList();
                        setModalState("CREATE");
                        console.log(response);
                    })
                    .catch((err: any) => {
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

        const singleVenue = venues?.content.find((venue: any) => venue.id === id);
        venueForm.setFieldsValue({
            name: singleVenue?.name,
            address: singleVenue?.address,
            activeStatus: singleVenue?.active,
        });

        setModalSpinLoading(false);
    };

    return (
        <>
            <div className="venue-page">
                {/* Page header */}
                <div className="venue-header-row">
                    <Title level={2} style={{ margin: 0, lineHeight: 1.1 }}>Venues</Title>
                    {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                            Add Venue
                        </Button>
                    )}
                </div>

                {/* Gold divider under the header */}
                <div className="venue-gold-divider" />

                <Table
                    loading={tableLoadingSpin}
                    size="small"
                    rowKey="id"
                    dataSource={venues?.content}
                    columns={venueColumns}
                    scroll={{ x: "max-content" }}
                    className="brfc-venue-table"
                    style={{ borderRadius: 10, overflow: "hidden" }}
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
        </>
    );
}

export default Venue;
