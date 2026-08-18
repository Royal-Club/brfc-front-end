import React from "react";
import { Button, Modal, Tooltip, message } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import {
    useGetVotingLockStateQuery,
    useLockTournamentVotingMutation,
    useUnlockTournamentVotingMutation,
} from "../../../state/features/tournaments/tournamentsSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import { showBdLocalTime } from "../../../utils/utils";

/**
 * Closes the RSVP before the teams are drawn, so a squad is never picked from a list that can
 * still move underneath it.
 *
 * Locking is destructive in one direction — it records every silent player as a No — so the
 * confirmation spells out how many that is before the coordinator commits.
 */
export default function VotingLockControl({
    tournamentId,
    onChanged,
}: {
    tournamentId: number;
    onChanged?: () => void;
}) {
    const { data, isLoading } = useGetVotingLockStateQuery({ tournamentId });
    const [lockVoting, { isLoading: isLocking }] = useLockTournamentVotingMutation();
    const [unlockVoting, { isLoading: isUnlocking }] = useUnlockTournamentVotingMutation();

    const state = data?.content;
    const busy = isLoading || isLocking || isUnlocking;

    const fail = (error: any, fallback: string) =>
        message.error(normalizeErrorMessage(error, fallback));

    const confirmLock = () => {
        const pending = state?.pendingCount ?? 0;
        Modal.confirm({
            title: "Lock voting for this tournament?",
            okText: "Lock voting",
            cancelText: "Cancel",
            content: (
                <div>
                    <p style={{ marginBottom: 8 }}>
                        Players will no longer be able to set or change their own Yes/No, and
                        reminder emails stop. You can still edit an individual answer on request.
                    </p>
                    <p style={{ margin: 0 }}>
                        {pending > 0 ? (
                            <strong>
                                {pending} player{pending === 1 ? "" : "s"} have not responded and
                                will be recorded as No.
                            </strong>
                        ) : (
                            "Everyone has already answered."
                        )}
                    </p>
                </div>
            ),
            onOk: async () => {
                try {
                    const result = await lockVoting({ tournamentId }).unwrap();
                    const marked = result.content.autoMarkedCount;
                    message.success(
                        marked > 0
                            ? `Voting locked. ${marked} non-responder${marked === 1 ? "" : "s"} recorded as No.`
                            : "Voting locked."
                    );
                    onChanged?.();
                } catch (error) {
                    fail(error, "Failed to lock voting");
                }
            },
        });
    };

    const confirmUnlock = () => {
        Modal.confirm({
            title: "Reopen voting?",
            okText: "Reopen voting",
            cancelText: "Cancel",
            content:
                "Players can answer again, and the No's recorded automatically by the lock go " +
                "back to pending. Answers you edited yourself are kept.",
            onOk: async () => {
                try {
                    const result = await unlockVoting({ tournamentId }).unwrap();
                    const reverted = result.content.autoMarkedCount;
                    message.success(
                        reverted > 0
                            ? `Voting reopened. ${reverted} auto-recorded No${reverted === 1 ? "" : "s"} returned to pending.`
                            : "Voting reopened."
                    );
                    onChanged?.();
                } catch (error) {
                    fail(error, "Failed to reopen voting");
                }
            },
        });
    };

    if (state?.votingLocked) {
        const lockedAt = state.lockedAt ? showBdLocalTime(state.lockedAt) : null;
        const by = state.lockedByName ?? "a coordinator";
        return (
            <Tooltip title={`Locked by ${by}${lockedAt ? ` on ${lockedAt}` : ""}`}>
                <Button icon={<UnlockOutlined />} onClick={confirmUnlock} disabled={busy}>
                    Voting Locked
                </Button>
            </Tooltip>
        );
    }

    return (
        <Tooltip
            title={
                state
                    ? `${state.confirmedCount} in, ${state.declinedCount} out, ${state.pendingCount} yet to answer`
                    : ""
            }
        >
            <Button icon={<LockOutlined />} onClick={confirmLock} disabled={busy}>
                Lock Voting
            </Button>
        </Tooltip>
    );
}
