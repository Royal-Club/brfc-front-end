import React, { useState } from "react";
import { Tabs, Empty, Spin, Row, Col } from "antd";
import { TrophyOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";
import { useGetTournamentPrizesQuery } from "../../../state/features/prizes/prizesSlice";
import {
  TournamentPrize,
  PrizeType,
} from "../../../state/features/prizes/prizeTypes";
import PrizeCard from "./PrizeCard";
import CreatePrizeModal from "./CreatePrizeModal";

interface PrizesListProps {
  tournamentId: number;
  isAdmin?: boolean;
}

export default function PrizesList({
  tournamentId,
  isAdmin,
}: PrizesListProps) {
  const [selectedPrize, setSelectedPrize] = useState<TournamentPrize | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    data: prizesData,
    isLoading,
    isFetching,
  } = useGetTournamentPrizesQuery({ tournamentId });

  const handleEdit = (prize: TournamentPrize) => {
    setSelectedPrize(prize);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedPrize(undefined);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  const prizes = prizesData?.content || [];
  const teamPrizes = prizes.filter((p) => p.prizeType === PrizeType.TEAM);
  const playerPrizes = prizes.filter((p) => p.prizeType === PrizeType.PLAYER);

  const renderPrizesList = (prizesList: TournamentPrize[]) => {
    if (prizesList.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No prizes awarded yet"
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {prizesList.map((prize) => (
          <Col xs={24} sm={24} md={12} lg={8} key={prize.id}>
            <PrizeCard prize={prize} isAdmin={isAdmin} onEdit={handleEdit} />
          </Col>
        ))}
      </Row>
    );
  };

  const tabItems = [
    {
      key: "team",
      label: (
        <span>
          <TeamOutlined /> Team Prizes ({teamPrizes.length})
        </span>
      ),
      children: renderPrizesList(teamPrizes),
    },
    {
      key: "player",
      label: (
        <span>
          <UserOutlined /> Player Prizes ({playerPrizes.length})
        </span>
      ),
      children: renderPrizesList(playerPrizes),
    },
  ];

  return (
    <>
      <Tabs items={tabItems} defaultActiveKey="team" />

      {isModalVisible && (
        <CreatePrizeModal
          tournamentId={tournamentId}
          prize={selectedPrize}
          isVisible={isModalVisible}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
