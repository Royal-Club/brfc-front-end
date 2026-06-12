import React from "react";
import { Card, Empty, Spin } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import styles from "./ViewerRulesTab.module.css";

interface ViewerRulesTabProps {
  tournamentId: number;
}

export default function ViewerRulesTab({ tournamentId }: ViewerRulesTabProps) {
  const { data, isLoading } = useGetTournamentSummaryQuery({ tournamentId });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tournament = data?.content?.[0];
  const rules = tournament?.rules;

  if (!rules || !rules.trim()) {
    return <Empty description="No rules have been added for this tournament" style={{ padding: 48 }} />;
  }

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 34,
        background: "linear-gradient(135deg, rgba(14,18,34,0.96) 0%, rgba(19,27,46,0.92) 100%)",
        boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      bodyStyle={{ padding: "22px 22px 18px" }}
    >
      <div className={styles.rulesContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rules}</ReactMarkdown>
      </div>
    </Card>
  );
}
