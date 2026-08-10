import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, Result, Space, Spin, Typography } from "antd";
import {
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
    RsvpVoteContent,
    RsvpVoteStatus,
    usePreviewRsvpQuery,
    useSubmitRsvpMutation,
} from "../../state/features/rsvp/rsvpSlice";

dayjs.extend(utc);

const { Title, Text, Paragraph } = Typography;

/**
 * Landing page for the Yes/No links in RSVP emails.
 *
 * Loading this page only previews the answer — nothing is recorded until the member presses the
 * confirm button. That is deliberate: corporate mail scanners follow links in transit, and a page
 * that voted on load would fill the squad list with answers nobody gave.
 */
export default function RsvpPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";

    const { data, isLoading, isError } = usePreviewRsvpQuery(
        { token },
        { skip: !token }
    );
    const [submitRsvp, { isLoading: isSubmitting }] = useSubmitRsvpMutation();
    const [result, setResult] = useState<RsvpVoteContent | null>(null);

    const preview = data?.content;

    useEffect(() => {
        document.title = "Confirm your answer | Royal Club Football";
    }, []);

    const handleConfirm = async () => {
        try {
            const response = await submitRsvp({ token }).unwrap();
            setResult(response.content);
        } catch {
            setResult({
                status: "INVALID",
                attending: false,
                message: "We could not record your answer. Please try again.",
            });
        }
    };

    const kickoff = useMemo(() => {
        const raw = result?.tournamentDate ?? preview?.tournamentDate;
        // Backend sends UTC; render it in the reader's own timezone.
        return raw ? dayjs.utc(raw).local().format("dddd, DD MMM YYYY [at] hh:mm A") : null;
    }, [result?.tournamentDate, preview?.tournamentDate]);

    const shell = (children: React.ReactNode) => (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
            }}
        >
            <Card style={{ maxWidth: 520, width: "100%" }}>{children}</Card>
        </div>
    );

    if (!token) {
        return shell(
            <Result
                status="warning"
                title="Missing link"
                subTitle="This page needs the link from your invitation email."
            />
        );
    }

    if (isLoading) {
        return shell(
            <div style={{ textAlign: "center", padding: 32 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (isError || !preview) {
        return shell(
            <Result
                status="error"
                title="Something went wrong"
                subTitle="We could not open this link. Please try again in a moment."
            />
        );
    }

    // Once the vote is in, or when the link itself is unusable, show the outcome instead of the form.
    const blocking: RsvpVoteStatus[] = [
        "INVALID",
        "EXPIRED",
        "TOURNAMENT_CANCELLED",
        "TOURNAMENT_STARTED",
    ];
    const outcome = result ?? (blocking.includes(preview.status) ? preview : null);

    if (outcome) {
        const settled = outcome.status === "RECORDED" || outcome.status === "UPDATED";
        return shell(
            <Result
                status={settled ? "success" : "warning"}
                icon={
                    settled ? (
                        outcome.attending ? (
                            <CheckCircleOutlined style={{ color: "#0b8043" }} />
                        ) : (
                            <CloseCircleOutlined style={{ color: "#c5221f" }} />
                        )
                    ) : undefined
                }
                title={
                    settled
                        ? outcome.attending
                            ? "You are in"
                            : "Marked as not playing"
                        : titleFor(outcome.status)
                }
                subTitle={outcome.message}
            />
        );
    }

    return shell(
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
                <Text type="secondary">Hi {preview.playerName},</Text>
                <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>
                    {preview.tournamentName}
                </Title>
            </div>

            <Space direction="vertical" size="small">
                {kickoff && (
                    <Text>
                        <CalendarOutlined /> {kickoff}
                    </Text>
                )}
                {preview.venueName && (
                    <Text>
                        <EnvironmentOutlined /> {preview.venueName}
                    </Text>
                )}
            </Space>

            <Paragraph style={{ marginBottom: 0 }}>
                You are about to answer{" "}
                <Text strong>{preview.attending ? "YES, I am playing" : "NO, I cannot make it"}</Text>.
            </Paragraph>

            <Button
                type="primary"
                size="large"
                block
                loading={isSubmitting}
                onClick={handleConfirm}
                danger={!preview.attending}
            >
                {preview.attending ? "Confirm — I am playing" : "Confirm — I cannot make it"}
            </Button>

            <Text type="secondary" style={{ fontSize: 12 }}>
                You can change your answer any time before kickoff by opening the other link in your email.
            </Text>
        </Space>
    );
}

function titleFor(status: RsvpVoteStatus): string {
    switch (status) {
        case "EXPIRED":
            return "This link has expired";
        case "TOURNAMENT_CANCELLED":
            return "Tournament cancelled";
        case "TOURNAMENT_STARTED":
            return "Tournament already started";
        default:
            return "This link is not valid";
    }
}
