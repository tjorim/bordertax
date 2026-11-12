/**
 * Shapes of the yearly tax parameters. The engines consume `YearParams` (via `TAX_PARAMS`);
 * year modules are written against the smaller `*Input` shapes and expanded by `defineYear`.
 */

// ─── NL ───────────────────────────────────────────────────────────────────────

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
  /** Volksverzekeringen rate applied to min(taxable wage, socialPremiumMax). */
  socialPremiumRate: number;
  /** Maximum income subject to social premiums (equals bracket 1 ceiling). */
  socialPremiumMax: number;
  ahkMax: number;
  ahkPhaseOutStart: number;
  ahkPhaseOutRate: number;
  ahkPhaseOutEnd: number;
  akStages: AKStage[];
}

// ─── BE ───────────────────────────────────────────────────────────────────────

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
  /**
   * Regional tax reduction rate for dienstencheques (service vouchers), Flemish region.
   * Abolished for cheques purchased from 1 January 2025 onward (income year 2025 / AJ2026+) — 0 from 2025.
   */
  serviceVoucherReductionRate: number;
}

// ─── Home ownership ───────────────────────────────────────────────────────────

/**
 * Ordinary occupied main home, full year. Rates apply to the whole value, not marginal bands:
 * `rates[i]` is the rate for value band `i` (see `EIGENWONINGFORFAIT_BAND_LIMITS`).
 * Above `threshold`: `base + excessRate × (value − threshold)`.
 */
export interface EigenwoningforfaitParams {
  rates: readonly number[];
  threshold: number;
  base: number;
  excessRate: number;
}

// ─── Combined params ──────────────────────────────────────────────────────────

export interface YearParams {
  nl: { under: NLYearParams; over: NLYearParams; mortgageDeductionRateCap: number };
  be: BEYearParams;
}

// ─── Provenance ───────────────────────────────────────────────────────────────

export interface Source {
  name: string;
  /** Only set where the exact page is recorded in the repository. */
  url?: string;
}

export interface Provenance {
  sources: readonly Source[];
  /** What was checked, and against what. Unset when the values were only taken from published tables. */
  verified?: string;
}

export interface YearSources {
  /** Dutch brackets, premiums, algemene heffingskorting and arbeidskorting. */
  nl: Provenance;
  /** `nl.mortgageDeductionRateCap`. */
  mortgageDeductionRateCap: Provenance;
  /** Belgian brackets, belastingvrije som, forfait and the federal/regional rates. */
  be: Provenance;
  /** Eigenwoningforfait table. */
  home: Provenance;
}

// ─── Year module input ────────────────────────────────────────────────────────

/** Per-regime Dutch values; the brackets and the premium ceiling are shared and derived. */
export type NLRegimeInput = Omit<
  NLYearParams,
  "incomeTaxBrackets" | "socialPremiumMax" | "socialPremiumRate"
> & {
  /** Defaults to the statutory rate for the regime (27.65% under AOW age, 9.75% over). */
  socialPremiumRate?: number;
};

export interface NLInput {
  /** Max rate at which mortgage interest may reduce tax (aftrekbeperking); the part of the deduction taxed above it is added back. */
  mortgageDeductionRateCap: number;
  /** Income-tax-only brackets, shared by both regimes. The premium ceiling is the first bracket's `to`. */
  incomeTaxBrackets: readonly NLBracket[];
  under: NLRegimeInput;
  over: NLRegimeInput;
}

/** Belgian rates that did not change over the supported years can be left out. */
export type BEInput = Omit<
  BEYearParams,
  "forfaitRate" | "gereduceerdRate" | "gewestelijkeRate" | "serviceVoucherReductionRate"
> &
  Partial<
    Pick<
      BEYearParams,
      "forfaitRate" | "gereduceerdRate" | "gewestelijkeRate" | "serviceVoucherReductionRate"
    >
  >;

export type HomeInput = Omit<EigenwoningforfaitParams, "excessRate"> &
  Partial<Pick<EigenwoningforfaitParams, "excessRate">>;

export interface YearInput<Y extends number> {
  /** Income year (inkomstenjaar). The Belgian assessment year is this + 1. */
  year: Y;
  nl: NLInput;
  be: BEInput;
  home: HomeInput;
  sources: YearSources;
}

/** A fully expanded year, as exported by each module in `src/tax/years`. */
export interface YearModule<Y extends number = number> {
  year: Y;
  params: YearParams;
  home: EigenwoningforfaitParams;
  sources: YearSources;
}
