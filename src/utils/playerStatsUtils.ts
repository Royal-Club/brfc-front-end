import type {
    IPlayerStatisticsData,
    IPlayerMatchHistory,
} from "../state/features/statistics/statisticsTypes";

/**
 * Derived views over the aggregated player statistics the API already returns
 * (`/player-statistics`). Nothing here hits the network — it turns the raw
 * goals/assists/cards/appearances rows into the club records, ratings and
 * best-XI selections the Hall of Fame, Comparison and Team-of-the-Tournament
 * screens render.
 */

export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

/** Human label for every `FootballPosition` the backend enum can return. */
export const POSITION_LABEL: Record<string, string> = {
    UNASSIGNED: "Unassigned",
    GOALKEEPER: "Goalkeeper",
    RIGHT_BACK: "Right Back",
    LEFT_BACK: "Left Back",
    CENTER_BACK_1: "Center Back",
    CENTER_BACK_2: "Center Back",
    DEFENSIVE_MIDFIELD: "Defensive Midfield",
    RIGHT_WING_FORWARD: "Right Wing/Forward",
    CENTRAL_MIDFIELD: "Central Midfield",
    STRIKER: "Striker",
    ATTACKING_MIDFIELD: "Attacking Midfield",
    LEFT_WING_FORWARD: "Left Wing/Forward",
};

export const positionLabel = (position?: string | null): string =>
    (position && POSITION_LABEL[position]) || "Unassigned";

const POSITION_GROUP: Record<string, PositionGroup> = {
    GOALKEEPER: "GK",
    RIGHT_BACK: "DEF",
    LEFT_BACK: "DEF",
    CENTER_BACK_1: "DEF",
    CENTER_BACK_2: "DEF",
    DEFENSIVE_MIDFIELD: "MID",
    CENTRAL_MIDFIELD: "MID",
    ATTACKING_MIDFIELD: "MID",
    RIGHT_WING_FORWARD: "FWD",
    LEFT_WING_FORWARD: "FWD",
    STRIKER: "FWD",
};

/** Unassigned/unknown positions fall back to midfield, the neutral slot. */
export const positionGroup = (position?: string | null): PositionGroup =>
    (position && POSITION_GROUP[position]) || "MID";

export const GROUP_LABEL: Record<PositionGroup, string> = {
    GK: "Goalkeeper",
    DEF: "Defence",
    MID: "Midfield",
    FWD: "Attack",
};

/* ------------------------------------------------------------------ */
/* Rating                                                              */
/* ------------------------------------------------------------------ */

/**
 * Per-match contribution score used to rank players inside a position group.
 * Attackers are judged mostly on output, defenders and keepers mostly on
 * turning up and staying disciplined — a centre back with 0 goals should not
 * be ranked below one who happened to score once.
 */
export const playerRating = (player: IPlayerStatisticsData): number => {
    const s = player.statistics;
    const matches = s.matchesPlayed || 0;
    if (matches === 0) return 0;

    const goalWeight = { GK: 2, DEF: 2.5, MID: 1.6, FWD: 1.2 }[
        positionGroup(player.position)
    ];
    const assistWeight = { GK: 1.5, DEF: 1.8, MID: 1.4, FWD: 1 }[
        positionGroup(player.position)
    ];

    const output = s.goalsScored * goalWeight + s.assists * assistWeight;
    const discipline = s.yellowCards * 0.3 + s.redCards * 1.5;

    // Per-match rate, then a mild volume bonus so a 20-match season outranks a
    // single lucky appearance with the same ratio.
    const perMatch = (output - discipline) / matches;
    const volumeBonus = Math.min(matches, 20) / 20;

    return perMatch * 10 + volumeBonus * 2;
};

export const perMatch = (value: number, matches: number): number =>
    matches > 0 ? value / matches : 0;

/* ------------------------------------------------------------------ */
/* Club records                                                        */
/* ------------------------------------------------------------------ */

export interface ClubRecord {
    key: string;
    title: string;
    /** Formatted headline value, e.g. "37" or "1.42". */
    display: string;
    /** Unit rendered under the value, e.g. "goals". */
    unit: string;
    holder?: IPlayerStatisticsData;
    /** Runner-up rows shown when a record card is expanded. */
    chasers: Array<{ player: IPlayerStatisticsData; display: string }>;
    /** Cards where a low number is the achievement (e.g. cleanest record). */
    inverse?: boolean;
}

/** Appearances a player needs before rate-based records consider them. */
export const RATE_RECORD_MIN_MATCHES = 5;

const topBy = (
    rows: IPlayerStatisticsData[],
    value: (p: IPlayerStatisticsData) => number,
    format: (v: number) => string,
    count = 5
) => {
    const ranked = rows
        .map((player) => ({ player, raw: value(player) }))
        .filter((entry) => entry.raw > 0)
        .sort((a, b) => b.raw - a.raw)
        .slice(0, count);

    return {
        holder: ranked[0]?.player,
        display: ranked[0] ? format(ranked[0].raw) : "—",
        chasers: ranked.slice(1).map((entry) => ({
            player: entry.player,
            display: format(entry.raw),
        })),
    };
};

const int = (v: number) => String(Math.round(v));
const rate = (v: number) => v.toFixed(2);

/**
 * The all-time record board. Rate-based records only consider players with at
 * least {@link RATE_RECORD_MIN_MATCHES} appearances so one-game cameos can't
 * hold a club record.
 */
export const buildClubRecords = (
    rows: IPlayerStatisticsData[]
): ClubRecord[] => {
    const qualified = rows.filter(
        (p) => (p.statistics.matchesPlayed || 0) >= RATE_RECORD_MIN_MATCHES
    );

    return [
        {
            key: "goals",
            title: "Most Goals",
            unit: "goals",
            ...topBy(rows, (p) => p.statistics.goalsScored, int),
        },
        {
            key: "assists",
            title: "Most Assists",
            unit: "assists",
            ...topBy(rows, (p) => p.statistics.assists, int),
        },
        {
            key: "contributions",
            title: "Most Contributions",
            unit: "goals + assists",
            ...topBy(rows, (p) => p.statistics.goalsAndAssists, int),
        },
        {
            key: "appearances",
            title: "Most Appearances",
            unit: "matches",
            ...topBy(rows, (p) => p.statistics.matchesPlayed, int),
        },
        {
            key: "goalsPerMatch",
            title: "Best Goals / Match",
            unit: `goals per match (min ${RATE_RECORD_MIN_MATCHES})`,
            ...topBy(
                qualified,
                (p) => perMatch(p.statistics.goalsScored, p.statistics.matchesPlayed),
                rate
            ),
        },
        {
            key: "contributionsPerMatch",
            title: "Best Contributions / Match",
            unit: `G+A per match (min ${RATE_RECORD_MIN_MATCHES})`,
            ...topBy(
                qualified,
                (p) =>
                    perMatch(p.statistics.goalsAndAssists, p.statistics.matchesPlayed),
                rate
            ),
        },
        {
            key: "cards",
            title: "Most Cards",
            unit: "yellow + red",
            ...topBy(
                rows,
                (p) => p.statistics.yellowCards + p.statistics.redCards,
                int
            ),
        },
        {
            key: "cleanest",
            title: "Cleanest Record",
            unit: `matches, no cards (min ${RATE_RECORD_MIN_MATCHES})`,
            inverse: true,
            ...topBy(
                qualified.filter(
                    (p) =>
                        p.statistics.yellowCards === 0 && p.statistics.redCards === 0
                ),
                (p) => p.statistics.matchesPlayed,
                int
            ),
        },
    ];
};

/* ------------------------------------------------------------------ */
/* Best XI                                                             */
/* ------------------------------------------------------------------ */

export interface FormationSlot {
    /** Slot id, unique within the formation. */
    id: string;
    group: PositionGroup;
    /** Percentage coordinates on the pitch (0 = own goal line, 100 = far end). */
    x: number;
    y: number;
}

export interface Formation {
    name: string;
    slots: FormationSlot[];
}

/**
 * Formations are laid out on a vertical pitch: `y` runs from the goalkeeper
 * (bottom) to the attack (top), `x` from left to right touchline.
 */
export const FORMATIONS: Formation[] = [
    {
        name: "4-3-3",
        slots: [
            { id: "gk", group: "GK", x: 50, y: 92 },
            { id: "lb", group: "DEF", x: 15, y: 72 },
            { id: "cb1", group: "DEF", x: 38, y: 76 },
            { id: "cb2", group: "DEF", x: 62, y: 76 },
            { id: "rb", group: "DEF", x: 85, y: 72 },
            { id: "cm1", group: "MID", x: 26, y: 48 },
            { id: "cm2", group: "MID", x: 50, y: 52 },
            { id: "cm3", group: "MID", x: 74, y: 48 },
            { id: "lw", group: "FWD", x: 20, y: 20 },
            { id: "st", group: "FWD", x: 50, y: 14 },
            { id: "rw", group: "FWD", x: 80, y: 20 },
        ],
    },
    {
        name: "4-4-2",
        slots: [
            { id: "gk", group: "GK", x: 50, y: 92 },
            { id: "lb", group: "DEF", x: 15, y: 72 },
            { id: "cb1", group: "DEF", x: 38, y: 76 },
            { id: "cb2", group: "DEF", x: 62, y: 76 },
            { id: "rb", group: "DEF", x: 85, y: 72 },
            { id: "lm", group: "MID", x: 15, y: 46 },
            { id: "cm1", group: "MID", x: 39, y: 50 },
            { id: "cm2", group: "MID", x: 61, y: 50 },
            { id: "rm", group: "MID", x: 85, y: 46 },
            { id: "st1", group: "FWD", x: 36, y: 17 },
            { id: "st2", group: "FWD", x: 64, y: 17 },
        ],
    },
    {
        name: "3-5-2",
        slots: [
            { id: "gk", group: "GK", x: 50, y: 92 },
            { id: "cb1", group: "DEF", x: 25, y: 75 },
            { id: "cb2", group: "DEF", x: 50, y: 78 },
            { id: "cb3", group: "DEF", x: 75, y: 75 },
            { id: "lm", group: "MID", x: 12, y: 48 },
            { id: "cm1", group: "MID", x: 33, y: 52 },
            { id: "cm2", group: "MID", x: 50, y: 44 },
            { id: "cm3", group: "MID", x: 67, y: 52 },
            { id: "rm", group: "MID", x: 88, y: 48 },
            { id: "st1", group: "FWD", x: 36, y: 17 },
            { id: "st2", group: "FWD", x: 64, y: 17 },
        ],
    },
];

export interface BestXiPick {
    slot: FormationSlot;
    player?: IPlayerStatisticsData;
    rating: number;
    /** True when the slot was filled from another position group. */
    outOfPosition: boolean;
}

export interface BestXiResult {
    picks: BestXiPick[];
    bench: IPlayerStatisticsData[];
    /** Slots left empty because no eligible player was available at all. */
    unfilled: number;
}

/**
 * Picks the highest-rated eligible player for every slot in the formation.
 * Slots are filled group by group; if a group runs out of specialists the
 * remaining slots take the best available player from anywhere and are flagged
 * as out of position, so the XI is always complete when the squad allows it.
 */
export const pickBestXi = (
    rows: IPlayerStatisticsData[],
    formation: Formation,
    minMatches = 1
): BestXiResult => {
    const eligible = rows
        .filter((p) => (p.statistics.matchesPlayed || 0) >= minMatches)
        .map((player) => ({ player, rating: playerRating(player) }))
        .sort((a, b) => b.rating - a.rating);

    const taken = new Set<number>();
    const picks: BestXiPick[] = [];

    // Pass 1 — specialists only.
    formation.slots.forEach((slot) => {
        const match = eligible.find(
            (entry) =>
                !taken.has(entry.player.playerId) &&
                positionGroup(entry.player.position) === slot.group
        );
        if (match) taken.add(match.player.playerId);
        picks.push({
            slot,
            player: match?.player,
            rating: match?.rating ?? 0,
            outOfPosition: false,
        });
    });

    // Pass 2 — fill anything still empty with the best player left.
    picks.forEach((pick) => {
        if (pick.player) return;
        const match = eligible.find((entry) => !taken.has(entry.player.playerId));
        if (!match) return;
        taken.add(match.player.playerId);
        pick.player = match.player;
        pick.rating = match.rating;
        pick.outOfPosition = true;
    });

    return {
        picks,
        bench: eligible
            .filter((entry) => !taken.has(entry.player.playerId))
            .slice(0, 7)
            .map((entry) => entry.player),
        unfilled: picks.filter((pick) => !pick.player).length,
    };
};

/* ------------------------------------------------------------------ */
/* Match history                                                       */
/* ------------------------------------------------------------------ */

export interface FormSummary {
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    /** Most recent results first, capped at `size`. */
    recent: Array<"WIN" | "DRAW" | "LOSS">;
    longestWinStreak: number;
    /** Longest run of consecutive matches with a goal or an assist. */
    longestScoringStreak: number;
    bestMatch?: IPlayerMatchHistory;
}

/**
 * Rolls a player's match-by-match history into the win/form numbers the
 * comparison view shows. History arrives newest-first from the API.
 */
export const summariseForm = (
    history: IPlayerMatchHistory[] = [],
    size = 5
): FormSummary => {
    const wins = history.filter((m) => m.result === "WIN").length;
    const draws = history.filter((m) => m.result === "DRAW").length;
    const losses = history.filter((m) => m.result === "LOSS").length;

    // Streaks read oldest-first so a run reflects chronological order.
    const chronological = [...history].reverse();

    let longestWinStreak = 0;
    let currentWinStreak = 0;
    let longestScoringStreak = 0;
    let currentScoringStreak = 0;

    chronological.forEach((match) => {
        currentWinStreak = match.result === "WIN" ? currentWinStreak + 1 : 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);

        const involved = (match.goalsScored || 0) + (match.assists || 0) > 0;
        currentScoringStreak = involved ? currentScoringStreak + 1 : 0;
        longestScoringStreak = Math.max(longestScoringStreak, currentScoringStreak);
    });

    const bestMatch = [...history].sort(
        (a, b) =>
            (b.goalsScored || 0) * 2 +
            (b.assists || 0) -
            ((a.goalsScored || 0) * 2 + (a.assists || 0))
    )[0];

    return {
        wins,
        draws,
        losses,
        winRate: history.length ? (wins / history.length) * 100 : 0,
        recent: history.slice(0, size).map((m) => m.result),
        longestWinStreak,
        longestScoringStreak,
        bestMatch:
            bestMatch && (bestMatch.goalsScored || bestMatch.assists)
                ? bestMatch
                : undefined,
    };
};

export interface HeadToHead {
    /** Matches both players appeared in, on opposing teams. */
    played: number;
    leftWins: number;
    rightWins: number;
    draws: number;
}

/**
 * Finds matches two players contested against each other by intersecting their
 * histories on `matchId` and keeping only the ones where they lined up for
 * different teams.
 */
export const headToHead = (
    left: IPlayerMatchHistory[] = [],
    right: IPlayerMatchHistory[] = []
): HeadToHead => {
    const rightByMatch = new Map(right.map((m) => [m.matchId, m]));
    const result: HeadToHead = { played: 0, leftWins: 0, rightWins: 0, draws: 0 };

    left.forEach((leftMatch) => {
        const rightMatch = rightByMatch.get(leftMatch.matchId);
        if (!rightMatch) return;
        // Same match, same side — a team-mate, not an opponent.
        if (
            leftMatch.teamId != null &&
            rightMatch.teamId != null &&
            leftMatch.teamId === rightMatch.teamId
        ) {
            return;
        }

        result.played += 1;
        if (leftMatch.result === "WIN") result.leftWins += 1;
        else if (leftMatch.result === "LOSS") result.rightWins += 1;
        else result.draws += 1;
    });

    return result;
};
