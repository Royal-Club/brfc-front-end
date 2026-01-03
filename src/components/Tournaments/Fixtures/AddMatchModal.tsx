import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  DatePicker,
  TimePicker,
  Select,
  Spin,
  InputNumber,
} from "antd";
import moment from "moment";
import { useCreateMatchMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { ICreateMatchRequest } from "../../../state/features/fixtures/fixtureTypes";

interface AddMatchModalProps {
  tournamentId: number;
  roundId?: number;
  groupId?: number;
  groupName?: string;
  teams: Array<{ teamId: number; teamName: string }>;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  onSuccess?: () => void;
}

export default function AddMatchModal({
  tournamentId,
  roundId,
  groupId,
  groupName,
  teams,
  isModalVisible,
  handleSetIsModalVisible,
  onSuccess,
}: AddMatchModalProps) {
  const [form] = Form.useForm();
  const [createMatch, { isLoading }] = useCreateMatchMutation();
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();

  const venues = venuesData?.content || [];

  useEffect(() => {
    if (isModalVisible) {
      form.resetFields();
      // Set default values
      form.setFieldsValue({
        roundId: roundId,
        groupId: groupId,
      });
    }
  }, [isModalVisible, roundId, groupId, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.matchDate || !values.matchTime) {
        message.error("Please select both date and time");
        return;
      }

      // Combine date and time as LOCAL time first
      const localDateTime = moment({
        year: values.matchDate.year(),
        month: values.matchDate.month(),
        date: values.matchDate.date(),
        hour: values.matchTime.hour(),
        minute: values.matchTime.minute(),
        second: 0,
      });

      // Convert local time to UTC for API
      const matchDate = localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");

      const request: ICreateMatchRequest = {
        tournamentId,
        homeTeamId: values.homeTeamId,
        awayTeamId: values.awayTeamId,
        matchDate,
        venueId: values.venueId,
        matchDurationMinutes: values.matchDurationMinutes,
        roundId: values.roundId || roundId,
        groupId: values.groupId || groupId,
        groupName: groupName || values.groupName,
      };

      await createMatch(request).unwrap();

      message.success("Match created successfully");
      handleSetIsModalVisible(false);
      form.resetFields();
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to create match:", error);
      message.error(error?.data?.message || "Failed to create match");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    handleSetIsModalVisible(false);
  };

  return (
    <Modal
      title="Add New Match"
      open={isModalVisible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={isLoading}
          onClick={handleOk}
        >
          Create Match
        </Button>,
      ]}
    >
      <Spin spinning={isVenuesLoading}>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Home Team"
            name="homeTeamId"
            rules={[{ required: true, message: "Please select home team" }]}
          >
            <Select placeholder="Select home team">
              {teams.map((team) => (
                <Select.Option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Away Team"
            name="awayTeamId"
            rules={[
              { required: true, message: "Please select away team" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("homeTeamId") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Away team must be different from home team")
                  );
                },
              }),
            ]}
          >
            <Select placeholder="Select away team">
              {teams.map((team) => (
                <Select.Option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Match Date"
            name="matchDate"
            rules={[{ required: true, message: "Please select match date" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Match Time"
            name="matchTime"
            rules={[{ required: true, message: "Please select match time" }]}
          >
            <TimePicker style={{ width: "100%" }} format="h:mm A" use12Hours />
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

          <Form.Item
            label="Match Duration (minutes)"
            name="matchDurationMinutes"
            initialValue={90}
            rules={[
              { required: true, message: "Please enter match duration" },
              { type: "number", min: 10, max: 180, message: "Duration must be between 10 and 180 minutes" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={10}
              max={180}
              placeholder="Enter duration (e.g., 90)"
              addonAfter="minutes"
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}

export type { AddMatchModalProps };
