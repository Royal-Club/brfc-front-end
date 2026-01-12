import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Radio,
  Space,
  message,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import {
  useCreateTournamentPrizeMutation,
  useUpdateTournamentPrizeMutation,
} from "../../../state/features/prizes/prizesSlice";
import {
  PrizeType,
  PrizeCategory,
  TournamentPrize,
} from "../../../state/features/prizes/prizeTypes";
import { useGetTournamentSummaryQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { useGetPlayersQuery } from "../../../state/features/player/playerSlice";

const { TextArea } = Input;
const { Option } = Select;

interface CreatePrizeModalProps {
  tournamentId: number;
  prize?: TournamentPrize;
  isVisible: boolean;
  onClose: () => void;
}

export default function CreatePrizeModal({
  tournamentId,
  prize,
  isVisible,
  onClose,
}: CreatePrizeModalProps) {
  const [form] = Form.useForm();
  const [prizeType, setPrizeType] = useState<PrizeType>(PrizeType.TEAM);

  const [createPrize, { isLoading: isCreating }] = useCreateTournamentPrizeMutation();
  const [updatePrize, { isLoading: isUpdating }] = useUpdateTournamentPrizeMutation();

  // Fetch teams and players for the tournament
  const { data: tournamentData } = useGetTournamentSummaryQuery(
    { tournamentId },
    { skip: !isVisible || prizeType !== PrizeType.TEAM }
  );
  const { data: playersData } = useGetPlayersQuery(
    undefined,
    { skip: !isVisible || prizeType !== PrizeType.PLAYER }
  );

  // Extract teams from tournament data
  const teams = tournamentData?.content?.[0]?.teams || [];

  useEffect(() => {
    if (isVisible && prize) {
      // Editing mode
      setPrizeType(prize.prizeType);
      form.setFieldsValue({
        prizeType: prize.prizeType,
        teamId: prize.teamId,
        playerId: prize.playerId,
        positionRank: prize.positionRank,
        prizeAmount: prize.prizeAmount,
        prizeCategory: prize.prizeCategory,
        description: prize.description,
        imageLinks: prize.imageLinks || [],
      });
    } else if (isVisible) {
      // Create mode
      form.resetFields();
      setPrizeType(PrizeType.TEAM);
    }
  }, [isVisible, prize, form]);

  const handleSubmit = async (values: any) => {
    const payload = {
      tournamentId,
      prizeType: values.prizeType,
      teamId: values.prizeType === PrizeType.TEAM ? values.teamId : undefined,
      playerId: values.prizeType === PrizeType.PLAYER ? values.playerId : undefined,
      positionRank: values.positionRank,
      prizeAmount: values.prizeAmount,
      prizeCategory: values.prizeCategory,
      description: values.description,
      imageLinks: values.imageLinks || [],
    };

    try {
      if (prize) {
        // Update existing prize
        await updatePrize({
          tournamentId,
          prizeId: prize.id,
          data: payload,
        }).unwrap();
        message.success("Prize updated successfully");
      } else {
        // Create new prize
        await createPrize({
          tournamentId,
          data: payload,
        }).unwrap();
        message.success("Prize created successfully");
      }
      form.resetFields();
      onClose();
    } catch (error: any) {
      console.error("Failed to save prize:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const teamPrizeCategories = [
    PrizeCategory.CHAMPION,
    PrizeCategory.RUNNER_UP,
    PrizeCategory.THIRD_PLACE,
    PrizeCategory.FOURTH_PLACE,
    PrizeCategory.CUSTOM,
  ];

  const playerPrizeCategories = [
    PrizeCategory.TOP_SCORER,
    PrizeCategory.GOLDEN_BOOT,
    PrizeCategory.BEST_PLAYER,
    PrizeCategory.PLAYER_OF_TOURNAMENT,
    PrizeCategory.TOP_ASSIST_PROVIDER,
    PrizeCategory.BEST_GOALKEEPER,
    PrizeCategory.BEST_DEFENDER,
    PrizeCategory.FAIR_PLAY_AWARD,
    PrizeCategory.YOUNG_PLAYER_AWARD,
    PrizeCategory.CUSTOM,
  ];

  const formatCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Modal
      title={prize ? "Update Prize" : "Create Prize"}
      open={isVisible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ prizeType: PrizeType.TEAM, imageLinks: [] }}
      >
        {/* Prize Type */}
        <Form.Item
          name="prizeType"
          label="Prize Type"
          rules={[{ required: true, message: "Please select prize type" }]}
        >
          <Radio.Group onChange={(e) => {
            setPrizeType(e.target.value);
            form.setFieldsValue({ teamId: undefined, playerId: undefined });
          }}>
            <Radio value={PrizeType.TEAM}>Team Prize</Radio>
            <Radio value={PrizeType.PLAYER}>Player Prize</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Team Selection (conditional) */}
        {prizeType === PrizeType.TEAM && (
          <Form.Item
            name="teamId"
            label="Team"
            rules={[{ required: true, message: "Please select a team" }]}
          >
            <Select placeholder="Select team" showSearch optionFilterProp="children">
              {teams.map((team: any) => (
                <Option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Player Selection (conditional) */}
        {prizeType === PrizeType.PLAYER && (
          <Form.Item
            name="playerId"
            label="Player"
            rules={[{ required: true, message: "Please select a player" }]}
          >
            <Select placeholder="Select player" showSearch optionFilterProp="children">
              {playersData?.content?.map((player: any) => (
                <Option key={player.id} value={player.id}>
                  {player.name} ({player.employeeId})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Prize Category */}
        <Form.Item
          name="prizeCategory"
          label="Prize Category"
          rules={[{ required: true, message: "Please select prize category" }]}
        >
          <Select placeholder="Select category">
            {(prizeType === PrizeType.TEAM
              ? teamPrizeCategories
              : playerPrizeCategories
            ).map((category) => (
              <Option key={category} value={category}>
                {formatCategoryLabel(category)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Position Rank */}
        <Form.Item
          name="positionRank"
          label="Position Rank"
          rules={[
            { required: true, message: "Please enter position rank" },
            { type: "number", min: 1, message: "Position must be at least 1" },
          ]}
        >
          <InputNumber
            placeholder="Enter position (1, 2, 3...)"
            style={{ width: "100%" }}
            min={1}
          />
        </Form.Item>

        {/* Prize Amount */}
        <Form.Item
          name="prizeAmount"
          label="Prize Amount (Optional)"
          rules={[
            { type: "number", min: 0, message: "Amount must be positive" },
          ]}
        >
          <InputNumber
            placeholder="Enter prize amount"
            style={{ width: "100%" }}
            prefix="$"
            min={0}
          />
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Description (Optional)"
          rules={[
            { max: 500, message: "Description must be less than 500 characters" },
          ]}
        >
          <TextArea
            placeholder="Enter prize description"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Image Links */}
        <Form.List name="imageLinks">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[
                      { type: "url", message: "Please enter a valid URL" },
                      { pattern: /^https?:\/\/.+/, message: "URL must start with http:// or https://" },
                    ]}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <Input placeholder="https://example.com/image.jpg" style={{ width: 400 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Image Link
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Submit Button */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isUpdating}
            >
              {prize ? "Update Prize" : "Create Prize"}
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
