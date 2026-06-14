import { useEffect, useMemo, useState } from "react";
import { Empty, Image, Segmented, Spin } from "antd";
import { ApartmentOutlined, PictureOutlined } from "@ant-design/icons";
import { useGetTournamentStructureQuery } from "../../state/features/manualFixtures/manualFixturesSlice";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import TournamentFlowVisualization from "../Tournaments/Fixtures/ManualFixtures/TournamentFlowVisualization";
import { toAbsoluteLogoUrl } from "./teamLogoUtils";
import styles from "./ViewerTournamentFlowTab.module.css";

interface ViewerTournamentFlowTabProps {
  tournamentId: number;
  isActive?: boolean;
}

export default function ViewerTournamentFlowTab({
  tournamentId,
  isActive = false,
}: ViewerTournamentFlowTabProps) {
  const { data: structureData, isLoading } = useGetTournamentStructureQuery(
    { tournamentId },
    { skip: !tournamentId }
  );

  const { data: fixturesData } = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive }
  );

  const { data: tournamentSummary } = useGetTournamentSummaryQuery({ tournamentId });

  const tournamentStructure = structureData?.content;
  const fixtures = useMemo(() => fixturesData?.content || [], [fixturesData]);
  const roadmapImageUrl = tournamentSummary?.content?.[0]?.roadmapImageUrl;

  const [view, setView] = useState<"image" | "flow">("image");

  useEffect(() => {
    setView(roadmapImageUrl ? "image" : "flow");
  }, [roadmapImageUrl]);

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  const hasFlowChart = !!tournamentStructure && tournamentStructure.rounds.length > 0;

  if (!roadmapImageUrl && !hasFlowChart) {
    return (
      <Empty
        description="Roadmap not available yet"
        className={styles.emptyWrap}
      />
    );
  }

  return (
    <div className={styles.flowTabWrap}>
      {roadmapImageUrl && hasFlowChart && (
        <div className={styles.toggleWrap}>
          <Segmented
            value={view}
            onChange={(value) => setView(value as "image" | "flow")}
            options={[
              { label: "Roadmap Image", value: "image", icon: <PictureOutlined /> },
              { label: "Flow Chart", value: "flow", icon: <ApartmentOutlined /> },
            ]}
          />
        </div>
      )}

      {view === "image" && roadmapImageUrl ? (
        <div className={styles.imageWrap}>
          <Image
            src={toAbsoluteLogoUrl(roadmapImageUrl)}
            alt="Tournament Roadmap"
            className={styles.roadmapImage}
          />
        </div>
      ) : hasFlowChart ? (
        <div className={styles.flowWrap}>
          <TournamentFlowVisualization
            tournamentStructure={tournamentStructure!}
            fixtures={fixtures}
          />
        </div>
      ) : (
        <Empty
          description="Roadmap not available yet"
          className={styles.emptyWrap}
        />
      )}
    </div>
  );
}
