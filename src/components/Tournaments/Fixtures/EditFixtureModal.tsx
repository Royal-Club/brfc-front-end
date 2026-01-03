import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  DatePicker,
  TimePicker,
  Select,
  Spin,
  Divider,
  Row,
  Col,
  Typography,
  Card,
} from "antd";
import { CalendarOutlined, ArrowRightOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useUpdateFixtureMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";

dayjs.extend(utc);

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
  const [newDate, setNewDate] = useState<dayjs.Dayjs | null>(null);
  const [newTime, setNewTime] = useState<dayjs.Dayjs | null>(null);
  const [newVenueId, setNewVenueId] = useState<number | null>(null);

  const venues = venuesData?.content || [];

  // Parse current match date from server (UTC to local)
  const currentDateTime = fixture?.matchDate
    ? dayjs.utc(fixture.matchDate).local()
    : null;

  useEffect(() => {
    if (fixture && isModalVisible) {
      // Set current date/time and venue as initial values
      // Parse the fixture date fresh in the effect to avoid dependency issues
      const currentLocal = fixture.matchDate
        ? dayjs.utc(fixture.matchDate).local()
        : null;

      form.setFieldsValue({
        venueId: fixture.venueId,
      });

      setNewDate(currentLocal);
      setNewTime(currentLocal);
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

      if (!newDate || !newTime) {
        message.error("Please select both date and time");
        return;
      }

      // Combine date and time as LOCAL time first
      const localDateTime = newDate.clone()
        .hour(newTime.hour())
        .minute(newTime.minute())
        .second(0)
        .millisecond(0);

      // Convert local time to UTC for API
      await updateFixture({
        matchId: fixture.id,
        matchDate: localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss"),
        venueId: values.venueId,
      }).unwrap();

      message.success("Fixture updated successfully");
      handleSetIsModalVisible(false);
      form.resetFields();
      setNewDate(null);
      setNewTime(null);
      setNewVenueId(null);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update fixture:", error);
      message.error("Failed to update fixture");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setNewDate(null);
    setNewTime(null);
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
  const hasDateTimeChanges = newDate && newTime && currentDateTime && (
    newDate.format("YYYY-MM-DD") !== currentDateTime.format("YYYY-MM-DD") ||
    newTime.format("HH:mm") !== currentDateTime.format("HH:mm")
  );
  const hasVenueChanges = newVenueId !== null && newVenueId !== fixture?.venueId;
  const hasChanges = hasDateTimeChanges || hasVenueChanges;

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
                      ? currentDateTime.format("YYYY-MM-DD h:mm A")
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
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    <CalendarOutlined /> Match Date
                  </span>
                }
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                  placeholder="Select date"
                  value={newDate}
                  onChange={(value) => setNewDate(value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    <ClockCircleOutlined /> Match Time
                  </span>
                }
              >
                <TimePicker
                  format="h:mm A"
                  use12Hours
                  style={{ width: "100%" }}
                  placeholder="Select time"
                  value={newTime}
                  onChange={(value) => setNewTime(value)}
                />
              </Form.Item>
            </Col>
          </Row>

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
                {hasDateTimeChanges && newDate && newTime && (
                  <Row gutter={16} style={{ marginBottom: 8 }}>
                    <Col span={24}>
                      <Text type="secondary">Date & Time:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text delete>
                          {currentDateTime?.format("YYYY-MM-DD h:mm A")}
                        </Text>
                        <ArrowRightOutlined
                          style={{ margin: "0 8px" }}
                        />
                        <Text strong type="success">
                          {newDate.format("YYYY-MM-DD")} {newTime.format("h:mm A")}
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
