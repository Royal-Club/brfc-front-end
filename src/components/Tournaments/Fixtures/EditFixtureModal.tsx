import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  TimePicker,
  Select,
  Spin,
  Input,
} from "antd";
import moment from "moment";
import { useUpdateFixtureMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";

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

  const venues = venuesData?.content || [];

  useEffect(() => {
    if (fixture && isModalVisible) {
      form.setFieldsValue({
        matchTime: fixture.matchDate ? moment.utc(fixture.matchDate).local() : null,
        venueId: fixture.venueId,
      });
    }
  }, [fixture, isModalVisible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const matchTime = values.matchTime;

      if (!matchTime) {
        message.error("Please select a valid time");
        return;
      }

      if (!fixture) {
        message.error("No fixture data available");
        return;
      }

      // Combine the existing date with the new time
      const existingDate = moment.utc(fixture.matchDate).local();
      const updatedDateTime = existingDate
        .clone()
        .set({
          hour: matchTime.hour(),
          minute: matchTime.minute(),
          second: 0,
        });

      // Convert local time to UTC for API
      await updateFixture({
        matchId: fixture.id,
        matchDate: updatedDateTime.utc().format("YYYY-MM-DDTHH:mm:ss"),
        venueId: values.venueId,
      }).unwrap();

      message.success("Fixture updated successfully");
      handleSetIsModalVisible(false);
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update fixture:", error);
      message.error("Failed to update fixture");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    handleSetIsModalVisible(false);
  };

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
          <Form.Item label="Match Date">
            <Input
              disabled
              value={fixture ? moment(fixture.matchDate).format("DD-MMM-YYYY") : ""}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Match Time"
            name="matchTime"
            rules={[{ required: true, message: "Please select a match time" }]}
          >
            <TimePicker style={{ width: "100%" }} format="HH:mm" />
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
            >
              {venues.map((venue) => (
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
        </Form>
      </Spin>
    </Modal>
  );
}
