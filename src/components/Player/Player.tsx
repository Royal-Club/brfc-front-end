import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Upload,
  UploadFile,
  message,
  notification
} from "antd";
import { RcFile, UploadProps } from "antd/es/upload";
import axios from "axios";

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { InboxOutlined, MailOutlined, PlusOutlined } from "@ant-design/icons";
import { API_URL } from "../../settings";

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function Player() {
  const navigate = useNavigate();
  const [notificationApi, contextHolder] = notification.useNotification();
  //   const [notificationApi, contextHolder] = notification.useNotification();

  const [playerCategoryId, setProjectCategoryId] = useState(1);
  const [sliderLoading, setSliderLoading] = React.useState<boolean>(false);
  var [formState, setFormState] = useState("CREATE");
  const [formSubmitButtonText, setFormSubmitButtonText] = useState("Create");
  const [playerDetails, setPlayerDetails] = useState<string>();
  const [playerDetailsBn, setPlayerDetailsBn] = useState<string>();
  const [playerLoading, setPlayerLoading] = React.useState<boolean>(false);
  const [playerForm] = Form.useForm();
  const [playerThumbnailImageName, setPlayerThumbnailImageName] =
    useState("");
  const { Dragger } = Upload;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [branPlayerfileList, setBranPlayerFileList] = useState<UploadFile[]>(
    []
  );

  const onResetPlayerForm = () => {
    playerForm.resetFields();
  };

  let { id } = useParams();

  const onFinishPlayerForm = (values: any) => {
    if (!id) {
      axios
        .post(`${API_URL}/players`, {
          name: playerForm.getFieldValue("name"),
          email: playerForm.getFieldValue("email"),
          employeeId: playerForm.getFieldValue("employeeId"),
          skypeId: playerForm.getFieldValue("skypeId"),
          mobileNo: playerForm.getFieldValue("mobileNo"),
          active: playerForm.getFieldValue("active"),
        })
        .then((response) => {
          navigate("/players");
        })
        .catch((err) => {
          console.log("server error", err);
        });
    } else {
      axios
        .put(`${API_URL}/players/${id}`, {
          name: playerForm.getFieldValue("name"),
          email: playerForm.getFieldValue("email"),
          employeeId: playerForm.getFieldValue("employeeId"),
          skypeId: playerForm.getFieldValue("skypeId"),
          mobileNo: playerForm.getFieldValue("mobileNo"),
          active: playerForm.getFieldValue("active"),
        })
        .then((response) => {
          navigate("/players");
        })
        .catch((err) => {
          console.log("server error", err);
        });
    }
    // }
  };

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1)
    );
  };

  const handleRemoveBrandPlayerSlider = async (file: UploadFile) => {
    setPlayerThumbnailImageName("");
    setBranPlayerFileList([]);
    return true;
  };

  const getPlayer = () => {
    setPlayerLoading(true);
    axios
      .get(`${API_URL}/players/${id}`)
      .then((response) => {
        setPlayerDetails(response.data.description);
        setPlayerDetailsBn(response.data.description_bn);
        setPlayerThumbnailImageName(response.data.thumbnail_name);
        playerForm.setFieldsValue({
          publish_flag: response.data.publish_flag,
        });
        if (response.data.thumbnail_name) {
          setBranPlayerFileList([
            {
              uid: response.data.id,
              name: response.data.thumbnail_name,
              status: "done",
              url: API_URL + "/image-download/" + response.data.thumbnail_name,
            },
          ]);
        }

        playerForm.setFieldsValue({
          title: response.data.title,
          description: response.data.description,
        });
        response.data.player_sliders.map(
          (x: { [x: string]: any; id: any }) => {
            x["key"] = x.id;
            x["uid"] = x.id;
            x["name"] = x.image_name;
            x["status"] = "done";
            x["url"] = API_URL + "/image-download/" + x.image_name;
          }
        );

        // setFileList(response.data.player_sliders);
        setPlayerLoading(false);
        setFormSubmitButtonText("Change");
      })
      .catch((err) => {
        // Handle error
        console.log("server error");
        setPlayerLoading(false);
      });
  };

  const onResetProjectForm = () => {
    playerForm.resetFields();
  };

  useEffect(() => {
    onResetProjectForm();
    if (id) {
      getPlayer();
      setFormState("UPDATE");
    }
    return () => { };
  }, []);

  const handleChange: UploadProps["onChange"] = (info) => {
    setFileList(info.fileList);
    const { status } = info.file;

    if (
      info.file.percent === 100 &&
      status === "done" &&
      info.file.response &&
      info.file.response.file_name
    ) {
      const playerSliderObject = {
        image_name: info.file.response.file_name,
        player_id: id ? parseInt(id) : undefined,
      };
      // setPlayerSliders((prevState) => [...prevState, playerSliderObject]);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const playerThumnailprops: UploadProps = {
    name: "file",
    // beforeUpload: beforeUpload,
    fileList: branPlayerfileList,
    // onPreview: handlePreview,
    action: `${API_URL}/image-upload`,
    onRemove: handleRemoveBrandPlayerSlider,

    onChange(info) {
      setBranPlayerFileList(info.fileList);
      const { status } = info.file;
      if (status !== "uploading") {
      }
      if (
        info.file.percent === 100 &&
        status === "done" &&
        info.file.response &&
        info.file.response.file_name
      ) {
        setPlayerThumbnailImageName(info.file.response.file_name);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) { },
  };

  const requiredFieldRule = (label: String) => ({
    required: true,
    message: `Please input your ${label}!`,
  });

  return (
    <>
      {contextHolder}
      <Form
        layout="vertical"
        name="realEstateConfigForm"
        form={playerForm}
        initialValues={{ remember: 1 }}
        autoComplete="off"
        onFinish={onFinishPlayerForm}
      >
        <Row gutter={10}>
          <Col span={24}>
            <Card title="Player Information" bordered={true}>
              <Spin spinning={playerLoading}>
                <Row gutter={10}>
                  <Col md={12} lg={8}>
                    <Form.Item
                      name="name"
                      label="Name"
                      rules={[
                        requiredFieldRule('Name')
                      ]}
                    >
                      <Input placeholder="Name" />
                    </Form.Item>
                  </Col>
                  <Col md={12} lg={8}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        {
                          type: 'email',
                          message: 'The input is not a valid email!',
                        },
                        requiredFieldRule('Email')
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                  </Col>
                  <Col md={12} lg={8}>
                    <Form.Item
                      name="employeeId"
                      label="Employee Id"
                      rules={[
                        requiredFieldRule('Employee Id')
                      ]}
                    >
                      <InputNumber style={{ width: "100%" }} placeholder="Employee Id" />
                    </Form.Item>
                  </Col>
                  <Col md={12} lg={8}>
                    <Form.Item
                      name="skypeId"
                      label="Skype Id"
                      rules={[
                        requiredFieldRule('Skype Id')
                      ]}
                    >
                      <Input placeholder="Skype Id" />
                    </Form.Item>
                  </Col>
                  <Col md={12} lg={8}>
                    <Form.Item
                      name="mobileNo"
                      label="Mobile No"
                    >
                      <Input placeholder="Mobile No" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="isActive"
                      label="Active Status"
                      rules={[
                        requiredFieldRule('Active Status')

                      ]}
                      initialValue={0}
                    >
                      <Select
                        options={[
                          { value: 1, label: "Active" },
                          { value: 0, label: "InActive" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit">
                          {formSubmitButtonText}
                        </Button>
                        {!id && (
                          <Button
                            htmlType="button"
                            onClick={onResetPlayerForm}
                          >
                            Reset
                          </Button>
                        )}

                        <Link
                          className="text-decoration-none"
                          to={"/players"}
                        >
                          {" "}
                          Cancel
                        </Link>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>
              </Spin>
            </Card>
          </Col>
          {/* <Col span={9}> */}
          {/* <Row className="mb-2">
              <Col span={24}>
                <Card title="Thumbnail" bordered={true}>
                  <Dragger
                    maxCount={1}
                    listType="picture-card"
                    {...playerThumnailprops}
                    accept={"image/*"}
                    multiple={false}
                    showUploadList={{
                      showPreviewIcon: true,
                      showRemoveIcon: true,
                      showDownloadIcon: true,
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                      Support for a single image upload. Strictly prohibited
                      from uploading company data or other banned files.
                    </p>
                  </Dragger>
                  <Modal
                    open={previewOpen}
                    footer={null}
                    onCancel={handleCancel}
                  >
                    <img
                      alt="slider"
                      style={{ width: "100%" }}
                      src={previewImage}
                    />
                  </Modal>
                </Card>
              </Col>
            </Row> */}
          {/* <Row className="mb-2">
              <Col span={24}>
                <Card title="Sliders" bordered={true}>
                  <Spin spinning={sliderLoading}>
                    <div>
                      <Upload
                        action={`${API_URL}/image-upload`}
                        listType="picture-card"
                        fileList={fileList}
                        onPreview={handlePreview}
                        onRemove={handleRemovePlayerSlider}
                        onChange={handleChange}
                        accept={"image/*"}
                        maxCount={8}
                        multiple={true}
                        showUploadList={{
                          showPreviewIcon: true,
                          showRemoveIcon: true,
                          showDownloadIcon: true,
                        }}
                      >
                        {fileList.length >= 8 ? null : uploadButton}
                      </Upload>
                      <Modal
                        open={previewOpen}
                        footer={null}
                        onCancel={handleCancel}
                      >
                        <img
                          alt="slider"
                          style={{ width: "100%" }}
                          src={previewImage}
                        />
                      </Modal>
                    </div>
                  </Spin>
                </Card>
              </Col>
            </Row> */}
          {/* </Col> */}
        </Row>
      </Form>
    </>
  );
}

export default Player;
