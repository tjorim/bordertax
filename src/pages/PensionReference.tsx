import { cn } from "@/lib/utils";
import { Accordion } from "@/components/ui/accordion";
import {
  ArchiveIcon,
  BadgeAlertIcon,
  BandageIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  CircleMinusIcon,
  DoorOpenIcon,
  FileTextIcon,
  FlagIcon,
  HeartIcon,
  HeartPulseIcon,
  HourglassIcon,
  LayersIcon,
  PiggyBankIcon,
  ReceiptIcon,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import * as m from "../paraglide/messages.js";
import {
  BeBadge,
  DocLink,
  NlBadge,
  RefAccordionItem,
  ReferenceMeta,
  SectionCard,
  StatRow,
  TipBox,
  WarnBox,
} from "./reference/components.js";
import { AppNavbar } from "../components/AppNavbar";
import { PageHero } from "../components/PageHero";
import { PageFooter } from "../components/PageFooter";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import {
  fmt,
  fmtAge,
  fmtAmount,
  fmtDate,
  fmtNumber,
  fmtPercent,
  fmtPercentRange,
} from "../components/format";
import {
  ACV_SESSION,
  ANW,
  AOW,
  BE_PENSION,
  DEDUCTIONS,
  REFERENCE_INCOME_YEAR,
  RVU,
  SUPPLEMENTARY,
  aowExample,
  nlReferenceRates,
  type CareerRow,
  type PeriodRow,
} from "../tax/reference";

const wholePercent = (n: number) => fmtPercent(n, { digits: 0 });
const twoDecimalPercent = (n: number) => fmtPercent(n, { fixed: true });

/** "2014–2015" or "2012"; years are labels, not quantities, so no digit grouping. */
const fmtPeriod = ({ from, to }: PeriodRow) => (to ? `${from}–${to}` : String(from));

function birthLabel({ from, to }: PeriodRow) {
  if (from !== undefined && to !== undefined) return m.ref_birth_range({ from, to });
  if (from !== undefined) return m.ref_birth_from({ from });
  return m.ref_birth_until({ to: to ?? 0 });
}

function ZivTable({
  bands,
  none,
  progressive,
  flat,
}: {
  bands: { lowerMonthly: number; upperMonthly: number };
  none: string;
  progressive: string;
  flat: string;
}) {
  const rows = [
    [m.ref_amount_below_per_month({ amount: fmtAmount(bands.lowerMonthly) }), none],
    [
      m.ref_amount_range({
        from: fmtAmount(bands.lowerMonthly),
        to: fmtAmount(bands.upperMonthly),
      }),
      progressive,
    ],
    [m.ref_amount_above_per_month({ amount: fmtAmount(bands.upperMonthly) }), flat],
  ];
  return (
    <Table className="text-table-reference-xs">
      <TableBody>
        {rows.map(([range, rule]) => (
          <TableRow key={range}>
            <TableCell className="font-mono text-text text-xs">{range}</TableCell>
            <TableCell className="text-text">{rule}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function careerAge(age: CareerRow["age"]) {
  return typeof age === "number"
    ? fmtAge({ years: age })
    : m.ref_pension_age_either({ first: age[0], second: age[1] });
}

function careerRequirement({ careerYears, extraDays }: CareerRow) {
  return extraDays === undefined
    ? m.ref_pension_career_years({ years: careerYears })
    : m.ref_pension_career_years_days({ years: careerYears, days: extraDays });
}

// ── Main page ────────────────────────────────────────────────────

export default function PensionReference() {
  const year = REFERENCE_INCOME_YEAR;
  const rates = nlReferenceRates(year);
  const sessionDate = fmtDate(ACV_SESSION.date);
  const example = aowExample();
  useDocumentTitle(`${m.ref_pension_hero_title()} · ${m.document_title_suffix()}`);
  return (
    <>
      <AppNavbar>
        <span className="ref-nav-text font-mono text-xs font-semibold tracking-wide text-text-muted">
          <PiggyBankIcon
            aria-hidden="true"
            className="inline size-4 shrink-0 align-text-bottom me-2 text-brand-light"
          />
          {m.ref_pension_nav_title()}
        </span>
      </AppNavbar>

      <div className="w-full px-3 pb-12">
        <PageHero
          title={m.ref_pension_hero_title()}
          subtitle={m.ref_pension_hero_subtitle({ date: sessionDate })}
        />
        <ReferenceMeta year={year} />

        {/* ── 3-pijler overzicht ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s1_title()} icon={LayersIcon} accent="neutral">
          <div className="grid grid-cols-12 gap-4">
            {[
              {
                pijler: m.ref_pension_p1_pillar(),
                nl: m.ref_pension_p1_nl(),
                be: m.ref_pension_p1_be(),
                colorClass: "text-info",
                borderClass: "border-info/25",
              },
              {
                pijler: m.ref_pension_p2_pillar(),
                nl: m.ref_pension_p2_nl(),
                be: m.ref_pension_p2_be(),
                colorClass: "text-success",
                borderClass: "border-success/25",
              },
              {
                pijler: m.ref_pension_p3_pillar(),
                nl: m.ref_pension_p3_nl(),
                be: m.ref_pension_p3_be(),
                colorClass: "text-warning",
                borderClass: "border-warning/25",
              },
            ].map(({ pijler, nl, be, colorClass, borderClass }) => (
              <div key={pijler} className="col-span-12 md:col-span-4">
                <div className={cn("p-4 rounded-sm h-full border bg-surface-3", borderClass)}>
                  <div className={cn("font-bold mb-2 text-sm ref-pillar-label", colorClass)}>
                    {pijler}
                  </div>
                  <div className="mb-2">
                    <NlBadge>🇳🇱 NL</NlBadge> <span className="text-sm ref-text-sub">{nl}</span>
                  </div>
                  <div>
                    <BeBadge>🇧🇪 BE</BeBadge> <span className="text-sm ref-text-sub">{be}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <WarnBox>
            <strong>{m.ref_pension_term_confusion_title()}</strong>{" "}
            {m.ref_pension_term_confusion_body()}
          </WarnBox>
        </SectionCard>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 shell:col-span-6">
            {/* ── AOW ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_aow()} icon={FlagIcon} accent="nl">
              <StatRow
                label={m.ref_pension_aow_opbouw()}
                value={wholePercent(AOW.accrualPerYear)}
              />
              <StatRow
                label={m.ref_pension_aow_volledig()}
                value={m.ref_pension_aow_volledig_value({
                  years: fmtNumber(Math.round(1 / AOW.accrualPerYear)),
                  percent: wholePercent(1),
                })}
              />
              <StatRow
                label={m.ref_pension_aow_premie({ year })}
                value={fmtPercent(AOW.premiumRate, { digits: 1, fixed: true })}
                sub={m.ref_pension_aow_premie_sub({ amount: fmt(rates.premiumCeiling) })}
              />
              <StatRow label={m.ref_pension_aow_age_2024()} value={fmtAge(AOW.ageNow)} highlight />
              <StatRow label={m.ref_pension_aow_age_2028()} value={fmtAge(AOW.ageFrom2028)} />
              <StatRow
                label={m.ref_pension_aow_age_future()}
                value={m.ref_pension_aow_age_future_value({
                  age: fmtAge({ years: AOW.ageFuture }),
                })}
              />
              <StatRow
                label={m.ref_pension_aow_uitvoering()}
                value={m.ref_pension_aow_uitvoering_value()}
              />
              <StatRow
                label={m.ref_pension_aow_betaling()}
                value={m.ref_pension_aow_betaling_value()}
              />

              <div className="mt-6 mb-2 text-sm font-semibold ref-subsection-label">
                {m.ref_pension_max_amounts({ year })}
              </div>
              <Table className="text-table-reference">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_type()}</TableHead>
                    <TableHead>{m.ref_table_pct()}</TableHead>
                    <TableHead>{m.ref_table_gross_monthly()}</TableHead>
                    <TableHead>{m.ref_table_holiday_pay()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{m.ref_pension_aow_ongehuwd()}</TableCell>
                    <TableCell className="font-mono text-text">
                      {wholePercent(AOW.single.share)}
                    </TableCell>
                    <TableCell className="font-mono">{fmtAmount(AOW.single.monthly)}</TableCell>
                    <TableCell className="font-mono">
                      {m.ref_pension_holiday_x12({ amount: fmtAmount(AOW.single.holidayMonthly) })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_pension_aow_gehuwd()}</TableCell>
                    <TableCell className="font-mono text-text">
                      {wholePercent(AOW.couple.share)}
                    </TableCell>
                    <TableCell className="font-mono">{fmtAmount(AOW.couple.monthly)}</TableCell>
                    <TableCell className="font-mono">
                      {m.ref_pension_holiday_x12({ amount: fmtAmount(AOW.couple.holidayMonthly) })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-4 p-4 rounded-md ref-example-block">
                <div className="text-sm font-semibold mb-2 ref-text-muted">
                  {m.ref_pension_example_30yr()}
                </div>
                <StatRow
                  label={m.ref_pension_ex_opgebouwd()}
                  value={wholePercent(example.accrued)}
                  sub={m.ref_pension_ex_opgebouwd_sub({
                    years: example.insuredYears,
                    rate: wholePercent(AOW.accrualPerYear),
                  })}
                />
                <StatRow
                  label={m.ref_pension_ex_alleenstaand()}
                  value={m.ref_amount_approx_per_month({ amount: fmtAmount(example.single) })}
                  sub={m.ref_pension_ex_alleenstaand_sub()}
                />
                <StatRow
                  label={m.ref_pension_ex_gehuwd()}
                  value={m.ref_amount_approx_per_month({ amount: fmtAmount(example.couple) })}
                  sub={m.ref_pension_ex_alleenstaand_sub()}
                />
              </div>

              <div className="mt-4">
                <TipBox>{m.ref_pension_tip_partner()}</TipBox>
                <TipBox>{m.ref_pension_tip_aanvragen()}</TipBox>
              </div>

              <Accordion className="mt-2">
                <RefAccordionItem value="aow-history" title={m.ref_pension_aow_history()}>
                  <Table className="text-table-reference-xs">
                    <TableBody>
                      {AOW.history.map(({ period, age }) => (
                        <TableRow key={period.from}>
                          <TableCell>{fmtPeriod(period)}</TableCell>
                          <TableCell className="font-mono">{fmtAge(age)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </RefAccordionItem>
              </Accordion>
            </SectionCard>

            {/* ── ANW ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_anw()} icon={HeartPulseIcon} accent="nl">
              <StatRow
                label={m.ref_pension_anw_uitkering()}
                value={fmtAmount(ANW.monthly)}
                sub={m.ref_pension_anw_uitkering_sub({
                  percent: wholePercent(ANW.netMinimumWageShare),
                })}
              />
              <StatRow
                label={m.ref_pension_anw_vakantiegeld()}
                value={m.ref_amount_per_month({ amount: fmtAmount(ANW.holidayMonthly) })}
              />
              <StatRow
                label={m.ref_pension_anw_voorwaarden()}
                value={m.ref_pension_anw_voorwaarden_value({
                  childAge: ANW.maxChildAge,
                  disability: wholePercent(ANW.minDisability),
                })}
              />
              <StatRow
                label={m.ref_pension_anw_wezen()}
                value={m.ref_pension_anw_wezen_value({ age: ANW.orphanMaxAge })}
                sub={m.ref_pension_anw_wezen_sub()}
              />

              <div className="mt-4 text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_extra_earnings_anw()}
              </div>
              <StatRow
                label={m.ref_pension_anw_vrijgesteld()}
                value={m.ref_pension_anw_vrijgesteld_value({
                  amount: fmtAmount(ANW.exemptMonthly),
                })}
              />
              <StatRow
                label={m.ref_pension_anw_daarboven()}
                value={m.ref_pension_anw_daarboven_value()}
              />
              <StatRow
                label={m.ref_pension_anw_geen_recht()}
                value={m.ref_amount_per_month({ amount: fmtAmount(ANW.maxIncomeMonthly) })}
              />
              <StatRow
                label={m.ref_pension_anw_geen_anw()}
                value={m.ref_amount_per_month({ amount: fmtAmount(ANW.maxBenefitsMonthly) })}
                sub={m.ref_pension_anw_geen_anw_sub()}
              />

              <WarnBox>{m.ref_pension_anw_warn()}</WarnBox>
            </SectionCard>

            {/* ── Bijverdienen bij AOW ───────────────────────────── */}
            <SectionCard title={m.ref_pension_s_aow_work()} icon={BadgeAlertIcon} accent="nl">
              <WarnBox>{m.ref_pension_aow_work_warn()}</WarnBox>
              <ul className="text-sm mb-0 ref-list-sub">
                <li>{m.ref_pension_aow_work_li1()}</li>
                <li>{m.ref_pension_aow_work_li2()}</li>
                <li>{m.ref_pension_aow_work_li3()}</li>
              </ul>
              <TipBox>{m.ref_pension_aow_work_tip()}</TipBox>
            </SectionCard>
          </div>

          <div className="col-span-12 shell:col-span-6">
            {/* ── Aanvullend pensioen NL ─────────────────────────── */}
            <SectionCard title={m.ref_pension_s_supplementary()} icon={BuildingIcon} accent="nl">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_sup_intro()}</p>
              <StatRow
                label={m.ref_pension_sup_pensioenpot()}
                value={m.ref_pension_sup_pensioenpot_value({
                  amount: fmt(SUPPLEMENTARY.potBillions),
                })}
              />
              <StatRow
                label={m.ref_pension_sup_fondsen()}
                value={m.ref_pension_sup_fondsen_value({
                  count: fmtNumber(SUPPLEMENTARY.industryFunds),
                })}
              />
              <StatRow
                label={m.ref_pension_sup_afkoop()}
                value={m.ref_amount_per_year({
                  amount: fmtAmount(SUPPLEMENTARY.cashOutBelowYearly),
                })}
              />
              <StatRow
                label={m.ref_pension_sup_partner()}
                value={m.ref_pension_sup_partner_value({
                  percent: wholePercent(SUPPLEMENTARY.partnerShare),
                })}
                sub={m.ref_pension_sup_partner_sub()}
              />
              <StatRow
                label={m.ref_pension_sup_upo()}
                value={m.ref_pension_sup_upo_value()}
                sub={m.ref_pension_sup_upo_sub()}
              />

              <TipBox>{m.ref_pension_sup_tip()}</TipBox>

              <div className="mt-2 mb-2 text-sm font-semibold ref-subsection-label">
                {m.ref_pension_wtp_title()}
              </div>
              <ul className="text-sm mb-4 ref-list-sub">
                <li>{m.ref_pension_wtp_li1()}</li>
                <li>{m.ref_pension_wtp_li2()}</li>
                <li>{m.ref_pension_wtp_li3()}</li>
                <li>{m.ref_pension_wtp_li4()}</li>
                <li>{m.ref_pension_wtp_li5()}</li>
              </ul>

              <div className="mt-2 mb-2 text-sm font-semibold ref-subsection-label">
                {m.ref_pension_divorce()}
              </div>
              <p className="text-sm mb-1 ref-text-sub">{m.ref_pension_divorce_p()}</p>
              <WarnBox>{m.ref_pension_divorce_warn()}</WarnBox>
            </SectionCard>

            {/* ── RVU ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_rvu()} icon={DoorOpenIcon} accent="nl">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_rvu_intro()}</p>
              <StatRow
                label={m.ref_pension_rvu_max({ year })}
                value={m.ref_amount_per_month({ amount: fmtAmount(RVU.maxMonthly) })}
                highlight
              />
              <StatRow
                label={m.ref_pension_rvu_vroegst()}
                value={m.ref_pension_rvu_vroegst_value({ months: RVU.monthsBeforeAowAge })}
              />
              <StatRow
                label={m.ref_pension_rvu_uitbetaling()}
                value={m.ref_pension_rvu_uitbetaling_value()}
              />
              <ul className="text-sm mt-4 mb-0 ref-list-sub">
                <li>{m.ref_pension_rvu_li1()}</li>
                <li>{m.ref_pension_rvu_li2()}</li>
                <li>{m.ref_pension_rvu_li3()}</li>
                <li>{m.ref_pension_rvu_li4()}</li>
              </ul>
              <TipBox>{m.ref_pension_rvu_tip()}</TipBox>
            </SectionCard>

            {/* ── Inhoudingen op pensioen ────────────────────────── */}
            <SectionCard title={m.ref_pension_s_deductions()} icon={CircleMinusIcon} accent="nl">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_ded_intro()}</p>
              <StatRow label={m.ref_pension_ded_zorg()} value={m.ref_pension_ded_zorg_value()} />
              <StatRow
                label={m.ref_pension_ded_verdrag({ year })}
                value={fmtNumber(DEDUCTIONS.treatyFactor, 4)}
              />
              <StatRow
                label={m.ref_pension_ded_zvw()}
                value={twoDecimalPercent(DEDUCTIONS.zvwRate)}
                sub={m.ref_pension_ded_zvw_sub({ amount: fmt(DEDUCTIONS.zvwMaxIncome) })}
              />
              <StatRow
                label={m.ref_pension_ded_nominaal()}
                value={m.ref_amount_per_month({ amount: fmtAmount(DEDUCTIONS.nominalMonthly) })}
              />
              <StatRow
                label={m.ref_pension_ded_wlz()}
                value={twoDecimalPercent(DEDUCTIONS.wlzRate)}
                sub={m.ref_pension_ded_wlz_sub({ amount: fmt(rates.premiumCeiling) })}
              />
              <TipBox>{m.ref_pension_ded_tip()}</TipBox>
            </SectionCard>
          </div>
        </div>

        {/* ── Belgisch rustpensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_be({ year })} icon={FlagIcon} accent="be">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_params()}
              </div>
              <StatRow
                label={m.ref_pension_be_wet_pensioen()}
                value={fmtAge({ years: BE_PENSION.statutoryAge })}
                sub={m.ref_pension_be_wet_pensioen_sub({
                  age: fmtAge({ years: BE_PENSION.statutoryAgeFrom2030 }),
                })}
                highlight
              />
              <StatRow
                label={m.ref_pension_be_volledig()}
                value={m.ref_pension_be_volledig_value({
                  days: fmtNumber(BE_PENSION.fullCareerDays),
                })}
                sub={m.ref_pension_be_volledig_sub({ days: BE_PENSION.daysPerCareerYear })}
              />
              <StatRow
                label={m.ref_pension_be_vroegst()}
                value={fmtAge({ years: BE_PENSION.earliestAge })}
                sub={m.ref_pension_be_vroegst_sub({ years: BE_PENSION.earliestCareerYears })}
              />
              <StatRow
                label={m.ref_pension_be_loonplafond()}
                value={m.ref_amount_per_year({ amount: fmtAmount(BE_PENSION.wageCeilingYearly) })}
              />
              <StatRow
                label={m.ref_pension_be_max_gezin()}
                value={m.ref_amount_per_month({ amount: fmtAmount(BE_PENSION.maxFamilyMonthly) })}
                highlight
              />
              <StatRow
                label={m.ref_pension_be_max_alleenst()}
                value={m.ref_amount_per_month({ amount: fmtAmount(BE_PENSION.maxSingleMonthly) })}
                highlight
              />
              <StatRow
                label={m.ref_pension_be_aanvraag()}
                value={m.ref_pension_be_aanvraag_value({
                  months: BE_PENSION.applicationMonthsAhead,
                })}
              />
              <StatRow
                label={m.ref_pension_be_geen_terugw()}
                value={m.ref_pension_be_geen_terugw_value()}
              />

              <WarnBox>{m.ref_pension_be_warn_aanvraag()}</WarnBox>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_earliest({ year })}
              </div>
              <Table className="text-table-reference">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_age()}</TableHead>
                    <TableHead>{m.ref_table_career()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BE_PENSION.earliest2026.map((row) => (
                    <TableRow key={String(row.age)}>
                      <TableCell className="font-mono text-text">{careerAge(row.age)}</TableCell>
                      <TableCell className="text-text">{careerRequirement(row)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TipBox>
                {m.ref_pension_be_tip_nl_years({ days: BE_PENSION.daysPerCareerYear })}
              </TipBox>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_ziv()}
              </div>
              <p className="text-sm mb-2 ref-text-sub">
                <strong>
                  {m.ref_pension_ziv_alleenstaand({
                    percent: twoDecimalPercent(BE_PENSION.ziv.rate),
                  })}
                </strong>
              </p>
              <ZivTable
                bands={BE_PENSION.ziv.single}
                none={m.ref_pension_ziv_rule_geen1()}
                progressive={m.ref_pension_ziv_rule_prog1({
                  amount: fmtAmount(BE_PENSION.ziv.single.subtract),
                })}
                flat={m.ref_pension_ziv_rule_355_1({
                  percent: twoDecimalPercent(BE_PENSION.ziv.rate),
                })}
              />
              <p className="text-sm mt-4 mb-2 ref-text-sub">
                <strong>
                  {m.ref_pension_ziv_gezin({ percent: twoDecimalPercent(BE_PENSION.ziv.rate) })}
                </strong>
              </p>
              <ZivTable
                bands={BE_PENSION.ziv.family}
                none={m.ref_pension_ziv_rule_geen2()}
                progressive={m.ref_pension_ziv_rule_prog2({
                  amount: fmtAmount(BE_PENSION.ziv.family.subtract),
                })}
                flat={m.ref_pension_ziv_rule_355_2({
                  percent: twoDecimalPercent(BE_PENSION.ziv.rate),
                })}
              />
              <WarnBox>
                {m.ref_pension_ziv_warn({
                  rate: fmtPercentRange(
                    BE_PENSION.ziv.solidarityRateFrom,
                    BE_PENSION.ziv.solidarityRateTo,
                  ),
                  single: fmt(BE_PENSION.ziv.solidarityAboveSingleMonthly),
                  family: fmt(BE_PENSION.ziv.solidarityAboveFamilyMonthly),
                })}
              </WarnBox>
            </div>
          </div>
        </SectionCard>

        {/* ── Hervorming 2027 + Malus/Bonus ───────────────────────── */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <SectionCard title={m.ref_pension_s_be_2027()} icon={CalendarCheckIcon} accent="be">
              <p className="text-sm mb-4 ref-text-sub">
                {m.ref_pension_be2027_intro({
                  from: BE_PENSION.daysPerCareerYear,
                  to: BE_PENSION.from2027.daysPerCareerYear,
                })}
              </p>
              <Table className="text-table-reference">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_age()}</TableHead>
                    <TableHead>
                      {m.ref_table_career_156({ days: BE_PENSION.from2027.daysPerCareerYear })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BE_PENSION.from2027.rows.map((row) => (
                    <TableRow key={`${row.age}-${row.careerYears}-${row.extraDays ?? 0}`}>
                      <TableCell className="font-mono text-text">{careerAge(row.age)}</TableCell>
                      <TableCell className="text-text">{careerRequirement(row)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <SectionCard title={m.ref_pension_s_malus()} icon={CircleArrowDownIcon} accent="be">
              <p className="text-sm mb-4 ref-text-sub">
                {m.ref_pension_malus_intro({
                  years: BE_PENSION.malusMinYears,
                  days: BE_PENSION.from2027.daysPerCareerYear,
                  total: fmtNumber(BE_PENSION.malusMinDays),
                })}
              </p>
              <Table className="text-table-reference-md">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_birth_year()}</TableHead>
                    <TableHead>{m.ref_table_malus_per_year()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BE_PENSION.malus.map(({ birth, rate }) => (
                    <TableRow key={birth.from}>
                      <TableCell className="text-text">{birthLabel(birth)}</TableCell>
                      <TableCell className="font-mono text-text font-bold">
                        {wholePercent(rate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <SectionCard title={m.ref_pension_s_bonus()} icon={CircleArrowUpIcon} accent="be">
              <p className="text-sm mb-4 ref-text-sub">
                {m.ref_pension_bonus_intro({
                  years: BE_PENSION.malusMinYears,
                  total: fmtNumber(BE_PENSION.malusMinDays),
                })}
              </p>
              <Table className="text-table-reference-md">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_birth_year()}</TableHead>
                    <TableHead>{m.ref_table_bonus_per_year()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BE_PENSION.bonus.map(({ birth, rate }) => (
                    <TableRow key={birth.from ?? birth.to}>
                      <TableCell className="text-text">{birthLabel(birth)}</TableCell>
                      <TableCell className="font-mono text-text font-bold">
                        {wholePercent(rate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>
        </div>

        {/* ── Inkomenshiaat & grensarbeiderspensioen ──────────────── */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6">
            <SectionCard title={m.ref_pension_s_gap()} icon={HourglassIcon} accent="neutral">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_gap_intro()}</p>
              <ul className="text-sm mb-4 ref-list-sub">
                <li>{m.ref_pension_gap_li1()}</li>
                <li>{m.ref_pension_gap_li2()}</li>
                <li>{m.ref_pension_gap_li3()}</li>
              </ul>

              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_art64()}
              </div>
              <p className="text-sm mb-2 ref-text-sub">{m.ref_pension_art64_intro()}</p>
              <ol className="text-sm mb-0 ref-list-sub">
                <li>{m.ref_pension_art64_li1()}</li>
                <li>{m.ref_pension_art64_li2()}</li>
              </ol>
              <WarnBox>{m.ref_pension_art64_warn()}</WarnBox>
            </SectionCard>
          </div>

          <div className="col-span-12 md:col-span-6">
            <SectionCard title={m.ref_pension_s_border()} icon={ArchiveIcon} accent="be">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_border_intro()}</p>
              <ul className="text-sm mb-4 ref-list-sub">
                <li>{m.ref_pension_border_li1()}</li>
                <li>{m.ref_pension_border_li2()}</li>
                <li>{m.ref_pension_border_li3()}</li>
                <li>{m.ref_pension_border_li4()}</li>
                <li>{m.ref_pension_border_li5()}</li>
              </ul>
              <TipBox>{m.ref_pension_border_tip()}</TipBox>
            </SectionCard>
          </div>
        </div>

        {/* ── Overlevingspensioen BE ───────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_survivor({ year })} icon={HeartIcon} accent="be">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_conditions()}
              </div>
              <ul className="text-sm ref-list-sub">
                <li>{m.ref_pension_survivor_li1()}</li>
                <li>{m.ref_pension_survivor_li2()}</li>
                <li>{m.ref_pension_survivor_li3()}</li>
                <li>{m.ref_pension_survivor_li4()}</li>
                <li>{m.ref_pension_survivor_li5()}</li>
                <li>{m.ref_pension_survivor_li6()}</li>
              </ul>
            </div>
            <div className="col-span-12 md:col-span-6">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_special_situations()}
              </div>
              <ul className="text-sm mb-0 ref-list-sub">
                <li>{m.ref_pension_survivor_sp_li1()}</li>
                <li>{m.ref_pension_survivor_sp_li2()}</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* ── Arbeidsongeschiktheid & AOW ──────────────────────────── */}
        <SectionCard title={m.ref_pension_s_disability()} icon={BandageIcon} accent="nl">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <p className="text-sm mb-2 ref-text-sub">{m.ref_pension_disability_intro1()}</p>
              <ul className="text-sm ref-list-sub">
                <li>{m.ref_pension_disability_li1()}</li>
                <li>{m.ref_pension_disability_li2()}</li>
              </ul>
            </div>
            <div className="col-span-12 md:col-span-6">
              <p className="text-sm mb-2 ref-text-sub">{m.ref_pension_disability_intro2()}</p>
              <ul className="text-sm mb-0 ref-list-sub">
                <li>{m.ref_pension_disability_li3()}</li>
                <li>{m.ref_pension_disability_li4()}</li>
                <li>{m.ref_pension_disability_li5()}</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* ── Belasting op pensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_tax()} icon={ReceiptIcon} accent="neutral">
          <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_tax_intro()}</p>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_exception_nl()}
              </div>
              <ul className="text-sm mb-0 ref-list-sub">
                <li>{m.ref_pension_tax_exc_li1()}</li>
                <li>{m.ref_pension_tax_exc_li2()}</li>
                <li>{m.ref_pension_tax_exc_li3()}</li>
                <li>{m.ref_pension_tax_exc_li4()}</li>
              </ul>
            </div>
            <div className="col-span-12 md:col-span-6">
              <TipBox>{m.ref_pension_tax_tip1()}</TipBox>
              <TipBox>{m.ref_pension_tax_tip2()}</TipBox>
            </div>
          </div>
        </SectionCard>

        {/* ── Bronbestand ─────────────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_source()} icon={FileTextIcon} accent="neutral">
          <DocLink
            href="/docs/ACV-Pensioen-Infosessie-2026.pdf"
            title={m.ref_pension_source_doc_title()}
            sub={m.ref_pension_source_doc_sub({ date: sessionDate })}
            className="max-w-lg"
          />
        </SectionCard>

        <PageFooter>
          {m.ref_pension_footer({ date: sessionDate })}&nbsp;|&nbsp;
          <a
            href="https://www.acvgrensarbeiders.be"
            target="_blank"
            rel="noreferrer"
            className="ref-text-info"
          >
            acvgrensarbeiders.be
          </a>
        </PageFooter>
      </div>
    </>
  );
}
