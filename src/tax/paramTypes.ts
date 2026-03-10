export interface NLBracket {
  from: number;
  to: number;
  rate: number;
}

export interface AKStage {
  from: number;
  to: number;
  baseAmount: number;
  /** Rate applied to (income - from). Negative for phase-out. */
  rate: number;
}

export interface NLYearParams {
  /** Income-tax-only brackets (social premiums excluded). */
  incomeTaxBrackets: NLBracket[];
  /** Volksverzekeringen rate applied to min(grossSalary, socialPremiumMax). */
  socialPremiumRate: number;
  /** Maximum income subject to social premiums (equals bracket 1 ceiling). */
  socialPremiumMax: number;
  ahkMax: number;
  ahkPhaseOutStart: number;
  ahkPhaseOutRate: number;
  ahkPhaseOutEnd: number;
  akStages: AKStage[];
}

export interface BEBracket {
  from: number;
  to: number;
  rate: number;
}

export interface BEYearParams {
  brackets: BEBracket[];
  baseBelastingvrijeSom: number;
  /** Cumulative extra allowance per number of dependent children; index = child count (0–4). */
  childExtraAmounts: number[];
  extraPerChildAbove4: number | null;
  forfaitRate: number;
  forfaitMax: number;
  /** Federal reduction rate: hoofdsom × gereduceerdRate = gereduceerde belasting staat. */
  gereduceerdRate: number;
  /** Regional supplement: gereduceerde × gewestelijkeRate = gewestelijke belasting. */
  gewestelijkeRate: number;
}
