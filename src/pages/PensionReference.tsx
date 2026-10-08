import { cn } from "@/lib/utils";
import { Accordion } from "@/components/ui/accordion";
import {
  Archive,
  Bandage,
  Building,
  CalendarCheck,
  CircleArrowDown,
  CircleArrowUp,
  CircleMinus,
  BadgeAlert,
  DoorOpen,
  FileText,
  Flag,
  Heart,
  HeartPulse,
  Hourglass,
  Layers,
  PiggyBank,
  Receipt,
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
  SectionCard,
  StatRow,
  TipBox,
  WarnBox,
} from "./reference/components.js";
import { AppNavbar } from "../components/AppNavbar";
import { PageHero } from "../components/PageHero";
import { PageFooter } from "../components/PageFooter";

// ── Main page ────────────────────────────────────────────────────

export default function PensionReference() {
  return (
    <>
      <AppNavbar>
        <span className="ref-nav-text font-mono text-xs font-semibold tracking-wide text-text-muted">
          <PiggyBank
            aria-hidden="true"
            className="inline size-4 shrink-0 align-text-bottom me-2 text-be-light"
          />
          {m.ref_pension_nav_title()}
        </span>
      </AppNavbar>

      <div className="mx-auto w-full max-w-6xl px-5 pb-12">
        <PageHero title={m.ref_pension_hero_title()} subtitle={m.ref_pension_hero_subtitle()} />

        {/* ── 3-pijler overzicht ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s1_title()} icon={Layers} accent="neutral">
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
            <SectionCard title={m.ref_pension_s_aow()} icon={Flag} accent="nl">
              <StatRow label={m.ref_pension_aow_opbouw()} value="2%" />
              <StatRow
                label={m.ref_pension_aow_volledig()}
                value={m.ref_pension_aow_volledig_value()}
              />
              <StatRow
                label={m.ref_pension_aow_premie()}
                value={m.ref_pension_aow_premie_value()}
                sub={m.ref_pension_aow_premie_sub()}
              />
              <StatRow
                label={m.ref_pension_aow_age_2024()}
                value={m.ref_pension_aow_age_2024_value()}
                highlight
              />
              <StatRow
                label={m.ref_pension_aow_age_2028()}
                value={m.ref_pension_aow_age_2028_value()}
              />
              <StatRow
                label={m.ref_pension_aow_age_future()}
                value={m.ref_pension_aow_age_future_value()}
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
                {m.ref_pension_max_amounts()}
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
                    <TableCell className="font-mono text-text">70%</TableCell>
                    <TableCell className="font-mono">
                      {m.ref_pension_aow_ongehuwd_monthly()}
                    </TableCell>
                    <TableCell className="font-mono">
                      {m.ref_pension_aow_ongehuwd_holiday()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_pension_aow_gehuwd()}</TableCell>
                    <TableCell className="font-mono text-text">50%</TableCell>
                    <TableCell className="font-mono">
                      {m.ref_pension_aow_gehuwd_monthly()}
                    </TableCell>
                    <TableCell className="font-mono">
                      {m.ref_pension_aow_gehuwd_holiday()}
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
                  value="60%"
                  sub={m.ref_pension_ex_opgebouwd_sub()}
                />
                <StatRow
                  label={m.ref_pension_ex_alleenstaand()}
                  value={m.ref_pension_ex_alleenstaand_value()}
                  sub={m.ref_pension_ex_alleenstaand_sub()}
                />
                <StatRow
                  label={m.ref_pension_ex_gehuwd()}
                  value={m.ref_pension_ex_gehuwd_value()}
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
                      {[
                        ["2012", m.ref_pension_aow_h2012()],
                        ["2013", m.ref_pension_aow_h2013()],
                        ["2014–2015", m.ref_pension_aow_h2014_2015()],
                        ["2016", m.ref_pension_aow_h2016()],
                        ["2017", m.ref_pension_aow_h2017()],
                        ["2018", m.ref_pension_aow_h2018()],
                        ["2019–2021", m.ref_pension_aow_h2019_2021()],
                        ["2022", m.ref_pension_aow_h2022()],
                        ["2023", m.ref_pension_aow_h2023()],
                        ["2024–2027", m.ref_pension_aow_h2024_2027()],
                        ["2028–2031", m.ref_pension_aow_h2028_2031()],
                      ].map(([yr, age]) => (
                        <TableRow key={yr}>
                          <TableCell>{yr}</TableCell>
                          <TableCell className="font-mono">{age}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </RefAccordionItem>
              </Accordion>
            </SectionCard>

            {/* ── ANW ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_anw()} icon={HeartPulse} accent="nl">
              <StatRow
                label={m.ref_pension_anw_uitkering()}
                value={m.ref_pension_anw_uitkering_value()}
                sub={m.ref_pension_anw_uitkering_sub()}
              />
              <StatRow
                label={m.ref_pension_anw_vakantiegeld()}
                value={m.ref_pension_anw_vakantiegeld_value()}
              />
              <StatRow
                label={m.ref_pension_anw_voorwaarden()}
                value={m.ref_pension_anw_voorwaarden_value()}
              />
              <StatRow
                label={m.ref_pension_anw_wezen()}
                value={m.ref_pension_anw_wezen_value()}
                sub={m.ref_pension_anw_wezen_sub()}
              />

              <div className="mt-4 text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_extra_earnings_anw()}
              </div>
              <StatRow
                label={m.ref_pension_anw_vrijgesteld()}
                value={m.ref_pension_anw_vrijgesteld_value()}
              />
              <StatRow
                label={m.ref_pension_anw_daarboven()}
                value={m.ref_pension_anw_daarboven_value()}
              />
              <StatRow
                label={m.ref_pension_anw_geen_recht()}
                value={m.ref_pension_anw_geen_recht_value()}
              />
              <StatRow
                label={m.ref_pension_anw_geen_anw()}
                value={m.ref_pension_anw_geen_anw_value()}
                sub={m.ref_pension_anw_geen_anw_sub()}
              />

              <WarnBox>{m.ref_pension_anw_warn()}</WarnBox>
            </SectionCard>

            {/* ── Bijverdienen bij AOW ───────────────────────────── */}
            <SectionCard title={m.ref_pension_s_aow_work()} icon={BadgeAlert} accent="nl">
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
            <SectionCard title={m.ref_pension_s_supplementary()} icon={Building} accent="nl">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_sup_intro()}</p>
              <StatRow
                label={m.ref_pension_sup_pensioenpot()}
                value={m.ref_pension_sup_pensioenpot_value()}
              />
              <StatRow
                label={m.ref_pension_sup_fondsen()}
                value={m.ref_pension_sup_fondsen_value()}
              />
              <StatRow
                label={m.ref_pension_sup_afkoop()}
                value={m.ref_pension_sup_afkoop_value()}
              />
              <StatRow
                label={m.ref_pension_sup_partner()}
                value={m.ref_pension_sup_partner_value()}
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
            <SectionCard title={m.ref_pension_s_rvu()} icon={DoorOpen} accent="nl">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_rvu_intro()}</p>
              <StatRow
                label={m.ref_pension_rvu_max()}
                value={m.ref_pension_rvu_max_value()}
                highlight
              />
              <StatRow
                label={m.ref_pension_rvu_vroegst()}
                value={m.ref_pension_rvu_vroegst_value()}
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
            <SectionCard title={m.ref_pension_s_deductions()} icon={CircleMinus} accent="nl">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_ded_intro()}</p>
              <StatRow label={m.ref_pension_ded_zorg()} value={m.ref_pension_ded_zorg_value()} />
              <StatRow
                label={m.ref_pension_ded_verdrag()}
                value={m.ref_pension_ded_verdrag_value()}
              />
              <StatRow
                label={m.ref_pension_ded_zvw()}
                value={m.ref_pension_ded_zvw_value()}
                sub={m.ref_pension_ded_zvw_sub()}
              />
              <StatRow
                label={m.ref_pension_ded_nominaal()}
                value={m.ref_pension_ded_nominaal_value()}
              />
              <StatRow
                label={m.ref_pension_ded_wlz()}
                value={m.ref_pension_ded_wlz_value()}
                sub={m.ref_pension_ded_wlz_sub()}
              />
              <TipBox>{m.ref_pension_ded_tip()}</TipBox>
            </SectionCard>
          </div>
        </div>

        {/* ── Belgisch rustpensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_be()} icon={Flag} accent="be">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_params()}
              </div>
              <StatRow
                label={m.ref_pension_be_wet_pensioen()}
                value={m.ref_pension_be_wet_pensioen_value()}
                sub={m.ref_pension_be_wet_pensioen_sub()}
                highlight
              />
              <StatRow
                label={m.ref_pension_be_volledig()}
                value={m.ref_pension_be_volledig_value()}
                sub={m.ref_pension_be_volledig_sub()}
              />
              <StatRow
                label={m.ref_pension_be_vroegst()}
                value={m.ref_pension_be_vroegst_value()}
                sub={m.ref_pension_be_vroegst_sub()}
              />
              <StatRow
                label={m.ref_pension_be_loonplafond()}
                value={m.ref_pension_be_loonplafond_value()}
              />
              <StatRow
                label={m.ref_pension_be_max_gezin()}
                value={m.ref_pension_be_max_gezin_value()}
                highlight
              />
              <StatRow
                label={m.ref_pension_be_max_alleenst()}
                value={m.ref_pension_be_max_alleenst_value()}
                highlight
              />
              <StatRow
                label={m.ref_pension_be_aanvraag()}
                value={m.ref_pension_be_aanvraag_value()}
              />
              <StatRow
                label={m.ref_pension_be_geen_terugw()}
                value={m.ref_pension_be_geen_terugw_value()}
              />

              <WarnBox>{m.ref_pension_be_warn_aanvraag()}</WarnBox>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_earliest()}
              </div>
              <Table className="text-table-reference">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_age()}</TableHead>
                    <TableHead>{m.ref_table_career()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [m.ref_pension_be_age_60(), m.ref_pension_be_career_60()],
                    [m.ref_pension_be_age_61_62(), m.ref_pension_be_career_61_62()],
                    [m.ref_pension_be_age_63_64(), m.ref_pension_be_career_63_64()],
                  ].map(([age, career]) => (
                    <TableRow key={age}>
                      <TableCell className="font-mono text-text">{age}</TableCell>
                      <TableCell className="text-text">{career}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TipBox>{m.ref_pension_be_tip_nl_years()}</TipBox>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="text-sm font-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_ziv()}
              </div>
              <p className="text-sm mb-2 ref-text-sub">
                <strong>{m.ref_pension_ziv_alleenstaand()}</strong>
              </p>
              <Table className="text-table-reference-xs">
                <TableBody>
                  {[
                    ["< €2.078,46/mnd", m.ref_pension_ziv_rule_geen1()],
                    ["€2.078,46 – €2.154,94", m.ref_pension_ziv_rule_prog1()],
                    ["> €2.154,94/mnd", m.ref_pension_ziv_rule_355_1()],
                  ].map(([range, rule]) => (
                    <TableRow key={range}>
                      <TableCell className="font-mono text-text text-xs">{range}</TableCell>
                      <TableCell className="text-text">{rule}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm mt-4 mb-2 ref-text-sub">
                <strong>{m.ref_pension_ziv_gezin()}</strong>
              </p>
              <Table className="text-table-reference-xs">
                <TableBody>
                  {[
                    ["< €2.463,25/mnd", m.ref_pension_ziv_rule_geen2()],
                    ["€2.463,25 – €2.553,89", m.ref_pension_ziv_rule_prog2()],
                    ["> €2.553,89/mnd", m.ref_pension_ziv_rule_355_2()],
                  ].map(([range, rule]) => (
                    <TableRow key={range}>
                      <TableCell className="font-mono text-text text-xs">{range}</TableCell>
                      <TableCell className="text-text">{rule}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <WarnBox>{m.ref_pension_ziv_warn()}</WarnBox>
            </div>
          </div>
        </SectionCard>

        {/* ── Hervorming 2027 + Malus/Bonus ───────────────────────── */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <SectionCard title={m.ref_pension_s_be_2027()} icon={CalendarCheck} accent="be">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_be2027_intro()}</p>
              <Table className="text-table-reference">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_age()}</TableHead>
                    <TableHead>{m.ref_table_career_156()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [m.ref_pension_be2027_age_60(), m.ref_pension_be2027_row_60_a()],
                    [m.ref_pension_be2027_age_60(), m.ref_pension_be2027_row_60_b()],
                    [m.ref_pension_be2027_age_61(), m.ref_pension_be2027_row_61()],
                    [m.ref_pension_be2027_age_62(), m.ref_pension_be2027_row_62()],
                    [m.ref_pension_be2027_age_63(), m.ref_pension_be2027_row_63()],
                    [m.ref_pension_be2027_age_64(), m.ref_pension_be2027_row_64()],
                    [m.ref_pension_be2027_age_65(), m.ref_pension_be2027_row_65()],
                  ].map((row) => {
                    const [age, career] = row;
                    return (
                      <TableRow key={String(age) + String(career)}>
                        <TableCell className="font-mono text-text">{age}</TableCell>
                        <TableCell className="text-text">{career}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <SectionCard title={m.ref_pension_s_malus()} icon={CircleArrowDown} accent="be">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_malus_intro()}</p>
              <Table className="text-table-reference-md">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_birth_year()}</TableHead>
                    <TableHead>{m.ref_table_malus_per_year()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [m.ref_pension_malus_1961(), "2%"],
                    [m.ref_pension_malus_1966(), "4%"],
                    [m.ref_pension_malus_1975(), "5%"],
                  ].map(([yr, malus]) => (
                    <TableRow key={yr}>
                      <TableCell className="text-text">{yr}</TableCell>
                      <TableCell className="font-mono text-text font-bold">{malus}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>

          <div className="col-span-12 md:col-span-4">
            <SectionCard title={m.ref_pension_s_bonus()} icon={CircleArrowUp} accent="be">
              <p className="text-sm mb-4 ref-text-sub">{m.ref_pension_bonus_intro()}</p>
              <Table className="text-table-reference-md">
                <TableHeader className="bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_birth_year()}</TableHead>
                    <TableHead>{m.ref_table_bonus_per_year()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [m.ref_pension_bonus_1962(), "2%"],
                    [m.ref_pension_bonus_1963(), "4%"],
                    [m.ref_pension_bonus_1973(), "5%"],
                  ].map(([yr, bonus]) => (
                    <TableRow key={yr}>
                      <TableCell className="text-text">{yr}</TableCell>
                      <TableCell className="font-mono text-text font-bold">{bonus}</TableCell>
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
            <SectionCard title={m.ref_pension_s_gap()} icon={Hourglass} accent="neutral">
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
            <SectionCard title={m.ref_pension_s_border()} icon={Archive} accent="be">
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
        <SectionCard title={m.ref_pension_s_survivor()} icon={Heart} accent="be">
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
        <SectionCard title={m.ref_pension_s_disability()} icon={Bandage} accent="nl">
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
        <SectionCard title={m.ref_pension_s_tax()} icon={Receipt} accent="neutral">
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
        <SectionCard title={m.ref_pension_s_source()} icon={FileText} accent="neutral">
          <DocLink
            href="/docs/ACV-Pensioen-Infosessie-2026.pdf"
            title={m.ref_pension_source_doc_title()}
            sub={m.ref_pension_source_doc_sub()}
            className="max-w-lg"
          />
        </SectionCard>

        <PageFooter>
          {m.ref_pension_footer()}&nbsp;|&nbsp;
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
