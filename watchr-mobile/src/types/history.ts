import type { AlertOperator } from "./alerts";

export interface HistoryLog {
  ticker: string;
  price: number;
  operator: AlertOperator;
  target: number;
  time: string;
}

