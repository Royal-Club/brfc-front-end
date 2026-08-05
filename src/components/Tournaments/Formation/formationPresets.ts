import type { PositionGroup } from "../../../utils/playerStatsUtils";

/**
 * Formation shapes a captain can pick, keyed by players per side.
 *
 * A shape lists only the outfield lines back to front — `[2, 2, 1]` is "2-2-1":
 * two at the back, two in midfield, one up top, plus the keeper. Co-ordinates
 * are derived from that, so a shape can never drift out of step with its name.
 *
 * This mirrors `FormationPresets.java` on the server; if the geometry changes,
 * change both or saved line-ups will not line up with fresh ones.
 */
const SHAPES_BY_TEAM_SIZE: Record<number, number[][]> = {
    4: [[1, 1, 1], [2, 1], [1, 2]],
    5: [[1, 2, 1], [2, 1, 1], [2, 2]],
    6: [[2, 2, 1], [2, 1, 2], [1, 2, 2], [1, 3, 1], [3, 1, 1]],
    7: [[2, 3, 1], [3, 2, 1], [2, 2, 2]],
    8: [[3, 3, 1], [3, 2, 2], [2, 3, 2], [1, 3, 3]],
    9: [[3, 3, 2], [4, 3, 1], [3, 4, 1]],
    10: [[4, 3, 2], [3, 4, 2], [4, 4, 1]],
    11: [[4, 3, 3], [4, 4, 2], [3, 5, 2]],
};

const GK_X = 50;
const GK_Y = 90;
const BACK_LINE_Y = 74;
const FRONT_LINE_Y = 18;
const SINGLE_LINE_Y = 48;
const MAX_SPACING = 30;
const USABLE_WIDTH = 76;

export const DEFAULT_TEAM_SIZE = 6;
export const SUPPORTED_TEAM_SIZES = Object.keys(SHAPES_BY_TEAM_SIZE)
    .map(Number)
    .sort((a, b) => a - b);

export interface PresetSlot {
    slotIndex: number;
    positionGroup: PositionGroup;
    slotLabel: string;
    x: number;
    y: number;
}

const shapeName = (shape: number[]): string => shape.join("-");

const groupForLine = (line: number, lineCount: number): PositionGroup => {
    if (lineCount === 1) return "MID";
    if (line === 0) return "DEF";
    return line === lineCount - 1 ? "FWD" : "MID";
};

const lineY = (line: number, lineCount: number): number => {
    if (lineCount === 1) return SINGLE_LINE_Y;
    const step = (BACK_LINE_Y - FRONT_LINE_Y) / (lineCount - 1);
    return BACK_LINE_Y - line * step;
};

/** Spreads a line evenly around the centre, never wider than the pitch box. */
const seatX = (seat: number, inLine: number): number => {
    if (inLine <= 1) return 50;
    const spacing = Math.min(MAX_SPACING, USABLE_WIDTH / inLine);
    return 50 + (seat - (inLine - 1) / 2) * spacing;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const isSupportedTeamSize = (teamSize?: number | null): boolean =>
    teamSize != null && SHAPES_BY_TEAM_SIZE[teamSize] !== undefined;

/** Falls back to the club's usual futsal format for anything unrecognised. */
export const normalizeTeamSize = (teamSize?: number | null): number =>
    isSupportedTeamSize(teamSize) ? (teamSize as number) : DEFAULT_TEAM_SIZE;

export const presetNames = (teamSize?: number | null): string[] =>
    (SHAPES_BY_TEAM_SIZE[normalizeTeamSize(teamSize)] || []).map(shapeName);

export const defaultPresetName = (teamSize?: number | null): string =>
    presetNames(teamSize)[0];

/** Pitch slots for a preset, goalkeeper first then back to front. */
export const presetSlots = (
    teamSize: number | null | undefined,
    preset: string | null | undefined
): PresetSlot[] => {
    const shapes = SHAPES_BY_TEAM_SIZE[normalizeTeamSize(teamSize)] || [];
    const shape = shapes.find((candidate) => shapeName(candidate) === preset?.trim());
    if (!shape) return [];

    const slots: PresetSlot[] = [
        { slotIndex: 0, positionGroup: "GK", slotLabel: "GK", x: GK_X, y: GK_Y },
    ];

    let slotIndex = 1;
    shape.forEach((inLine, line) => {
        const group = groupForLine(line, shape.length);
        const y = round2(lineY(line, shape.length));
        for (let seat = 0; seat < inLine; seat += 1) {
            slots.push({
                slotIndex: slotIndex++,
                positionGroup: group,
                slotLabel: inLine > 1 ? `${group} ${seat + 1}` : group,
                x: round2(seatX(seat, inLine)),
                y,
            });
        }
    });

    return slots;
};
