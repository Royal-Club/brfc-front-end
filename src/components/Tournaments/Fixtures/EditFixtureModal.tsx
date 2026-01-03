import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  DatePicker,
  Select,
  Spin,
  Divider,
  Row,
  Col,
  Typography,
  Card,
} from "antd";
import { CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import moment from "moment";
import { useUpdateFixtureMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";

const { Text } = Typography;

interface EditFixtureModalProps {
  fixture: IFixture | null;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  onSuccess?: () => void;
}

export default function EditFixtureModal({
  fixture,
  isModalVisible,
  handleSetIsModalVisible,
  onSuccess,
}: EditFixtureModalProps) {
  const [form] = Form.useForm();
  const [updateFixture, { isLoading }] = useUpdateFixtureMutation();
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
  const [newDateTime, setNewDateTime] = useState<moment.Moment | null>(null);
  const [newVenueId, setNewVenueId] = useState<number | null>(null);

  const venues = venuesData?.content || [];

  // Parse current match date from server (UTC to local)
  const currentDateTime = fixture?.matchDate
    ? moment.utc(fixture.matchDate).local()
    : null;

  useEffect(() => {
    if (fixture && isModalVisible) {
      // Set venue as initial value only
      form.setFieldsValue({
        venueId: fixture.venueId,
      });
      setNewVenueId(fixture.venueId);
    }
  }, [fixture, isModalVisible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (!fixture) {
        message.error("No fixture data available");
        return;
      }

      // Use new date/time if provided, otherwise keep current
      const dateTimeToSend = newDateTime || currentDateTime;

      if (!dateTimeToSend) {
        message.error("Please select a valid date and time");
        return;
      }

      // Convert local time to UTC for API
      await updateFixture({
        matchId: fixture.id,
        matchDate: dateTimeToSend.utc().format("YYYY-MM-DDTHH:mm:ss"),
        venueId: values.venueId,
      }).unwrap();

      message.success("Fixture updated successfully");
      handleSetIsModalVisible(false);
      form.resetFields();
      setNewDateTime(null);
      setNewVenueId(null);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update fixture:", error);
      message.error("Failed to update fixture");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setNewDateTime(null);
    setNewVenueId(null);
    handleSetIsModalVisible(false);
  };

  // Get venue name by ID
  const getVenueName = (venueId: number | null) => {
    if (!venueId) return "Not set";
    const venue = venues.find((v: any) => v.id === venueId);
    return venue?.name || "Unknown";
  };

  // Check if there are any changes
  const hasChanges = newDateTime !== null || (newVenueId !== null && newVenueId !== fixture?.venueId);

  if (!fixture) return null;

  return (
    <Modal
      title={`Edit Fixture: ${fixture.homeTeamName} vs ${fixture.awayTeamName}`}
      open={isModalVisible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="update"
          type="primary"
          loading={isLoading}
          onClick={handleOk}
        >
          Update
        </Button>,
      ]}
    >
      <Spin spinning={isVenuesLoading}>
        <Form form={form} layout="vertical">
          {/* Current Values Section */}
          <Card
            size="small"
            title={
              <Text strong>
                <CalendarOutlined /> Current Match Details
              </Text>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Current Date & Time:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>
                    {currentDateTime
                      ? currentDateTime.format("YYYY-MM-DD HH:mm")
                      : "Not set"}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Current Venue:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>{getVenueName(fixture.venueId)}</Text>
                </div>
              </Col>
            </Row>
          </Card>

          <Divider>Update Match Details</Divider>

          {/* New Values Input Section */}
          <Form.Item label="New Match Date & Time (Optional - leave empty to keep current)">
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              placeholder="Select new date and time"
              value={newDateTime}
              onChange={(value) => setNewDateTime(value)}
            />
          </Form.Item>

          <Form.Item
            label="Venue"
            name="venueId"
            rules={[{ required: true, message: "Please select a venue" }]}
          >
            <Select
              placeholder="Select a venue"
              loading={isVenuesLoading}
              optionLabelProp="label"
              onChange={(value) => setNewVenueId(value)}
            >
              {venues.map((venue: any) => (
                <Select.Option key={venue.id} value={venue.id} label={venue.name}>
                  <div>
                    <div>{venue.name}</div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {venue.address}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Preview Section */}
          {hasChanges && (
            <>
              <Divider>Preview Changes</Divider>
              <Card
                size="small"
                type="inner"
              >
                {newDateTime && (
                  <Row gutter={16} style={{ marginBottom: 8 }}>
                    <Col span={24}>
                      <Text type="secondary">Date & Time:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text delete>
                          {currentDateTime?.format("YYYY-MM-DD HH:mm")}
                        </Text>
                        <ArrowRightOutlined
                          style={{ margin: "0 8px" }}
                        />
                        <Text strong type="success">
                          {newDateTime.format("YYYY-MM-DD HH:mm")}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                )}
                {newVenueId !== null && newVenueId !== fixture.venueId && (
                  <Row gutter={16}>
                    <Col span={24}>
                      <Text type="secondary">Venue:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text delete>{getVenueName(fixture.venueId)}</Text>
                        <ArrowRightOutlined
                          style={{ margin: "0 8px" }}
                        />
                        <Text strong type="success">
                          {getVenueName(newVenueId)}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card>
            </>
          )}
        </Form>
      </Spin>
    </Modal>
  );
}
