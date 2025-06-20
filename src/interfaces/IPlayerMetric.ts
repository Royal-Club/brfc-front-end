// src/types/playerMetric.ts

export interface YearMonthAmount {
  [month: string]: number;
}

export interface YearAmounts {
  [year: string]: YearMonthAmount;
}

interface PlayerMetric {
  playerId: number;
  playerName: string;
  active: boolean;
  yearMonthAmount: YearAmounts;
}

export default PlayerMetric