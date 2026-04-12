export type AlertOperator = "above" | "below";

export interface AlertCondition {
  id: string;
  ticker: string;
  operator: AlertOperator;
  price: number;
  enabled?: boolean;
  lastFiredAt?: number;
}

