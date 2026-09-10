interface YearMonthAmount {
  [year: string]: {
    [month: string]: number;
  };
}

/** Year to the month numbers a pause excused the player from. */
interface OnHoldYearMonths {
  [year: string]: number[];
}

interface PlayerMetric {
  playerId: number;
  playerName: string;
  yearMonthAmount: YearMonthAmount;
  /** Months the player owes nothing for, so they must never be flagged as Due. */
  onHoldYearMonths?: OnHoldYearMonths;
  active: boolean;
}

interface IPlayerCollectionMetrics {
  metrics: PlayerMetric[];
  years: number[];
}

export default IPlayerCollectionMetrics;
export type { YearMonthAmount, OnHoldYearMonths, PlayerMetric };
