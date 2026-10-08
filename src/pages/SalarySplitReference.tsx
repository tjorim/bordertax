import { Accordion } from "@/components/ui/accordion";
import {
  BookOpen,
  Calculator,
  Calendar,
  FileText,
  Flag,
  FolderOpen,
  House,
  Percent,
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

function Formula({ children }: { children: React.ReactNode }) {
  return <pre className="tw:p-4 tw:rounded-md tw:mb-0 ref-formula">{children}</pre>;
}

// ── Main page ────────────────────────────────────────────────────

export default function SalarySplitReference() {
  return (
    <>
      <AppNavbar>
        <span className="ref-nav-text tw:font-mono tw:text-xs tw:font-semibold tw:tracking-wide tw:text-text-muted">
          <BookOpen
            aria-hidden="true"
            className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2 tw:text-be-light"
          />
          {m.ref_ss_nav_title()}
        </span>
      </AppNavbar>

      <div className="tw:mx-auto tw:w-full tw:max-w-6xl tw:px-5 tw:pb-12">
        <PageHero title={m.ref_ss_hero_title()} subtitle={m.ref_ss_hero_subtitle()} />

        {/* ── Alert: geen neutralisatieregeling ─────────────────── */}
        <WarnBox>
          <strong>{m.ref_ss_tax_vs_ss_title()}</strong> {m.ref_ss_tax_vs_ss_body()}
        </WarnBox>

        <div className="tw:grid tw:grid-cols-12 tw:gap-6">
          <div className="tw:col-span-12 tw:shell:col-span-7">
            {/* ── 1. Hoofdregel ──────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s1_title()} icon={Flag} accent="neutral">
              <p className="tw:mb-4 ref-text-sub">{m.ref_ss_s1_intro()}</p>
              <Formula>{m.ref_ss_s1_formula()}</Formula>
              <div className="tw:mt-4 tw:flex tw:gap-2 tw:flex-wrap">
                <TipBox>{m.ref_ss_s1_tip_20pct()}</TipBox>
              </div>
              <TipBox>{m.ref_ss_s1_tip_60_40()}</TipBox>
              <WarnBox>{m.ref_ss_s1_warn_qualification()}</WarnBox>
            </SectionCard>

            {/* ── 2. Dagentelling ────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s2_title()} icon={Calendar} accent="neutral">
              <p className="tw:mb-4 ref-text-sub">{m.ref_ss_s2_intro()}</p>
              <Table responsive className="tw:mb-3 tw:text-table-reference-md">
                <TableHeader className="tw:bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_component()}</TableHead>
                    <TableHead>
                      <NlBadge>{m.ref_ss_col_nl()}</NlBadge>
                    </TableHead>
                    <TableHead>
                      <BeBadge>{m.ref_ss_col_be()}</BeBadge>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      id: "row1",
                      comp: m.ref_ss_s2_row1_comp(),
                      nl: m.ref_ss_s2_row1_nl(),
                      be: m.ref_ss_s2_row1_be(),
                    },
                    {
                      id: "row2",
                      comp: m.ref_ss_s2_row2_comp(),
                      nl: m.ref_ss_s2_row2_nl(),
                      be: m.ref_ss_s2_row2_be(),
                    },
                    {
                      id: "row3",
                      comp: m.ref_ss_s2_row3_comp(),
                      nl: m.ref_ss_s2_row3_nl(),
                      be: m.ref_ss_s2_row3_be(),
                    },
                    {
                      id: "row4",
                      comp: m.ref_ss_s2_row4_comp(),
                      nl: m.ref_ss_s2_row4_nl(),
                      be: m.ref_ss_s2_row4_be(),
                    },
                  ].map(({ id, comp, nl, be }) => (
                    <TableRow key={id}>
                      <TableCell className="tw:text-text tw:font-medium">{comp}</TableCell>
                      <TableCell>{nl}</TableCell>
                      <TableCell>{be}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <WarnBox>{m.ref_ss_s2_warn()}</WarnBox>
              <TipBox>{m.ref_ss_s2_tip()}</TipBox>
            </SectionCard>

            {/* ── 3. FOD Berekeningsformule ──────────────────────── */}
            <SectionCard title={m.ref_ss_s3_title()} icon={Calculator} accent="be">
              <p className="tw:mb-4 ref-text-sub">{m.ref_ss_s3_intro()}</p>
              <Formula>{m.ref_ss_be_formula()}</Formula>
              <div className="tw:mt-4">
                <p className="tw:mb-2 tw:text-sm ref-text-sub">{m.ref_ss_be_codes_title()}</p>
                <Table className="tw:text-table-reference">
                  <TableBody>
                    <TableRow>
                      <TableCell className="tw:font-mono tw:text-text">1250 / 2250</TableCell>
                      <TableCell>{m.ref_ss_s3_code_1250()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="tw:font-mono tw:text-text">Vak IV O.1</TableCell>
                      <TableCell>{m.ref_ss_s3_code_vak4_o1()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="tw:font-mono tw:text-text">Vak IV O.2</TableCell>
                      <TableCell>{m.ref_ss_s3_code_vak4_o2()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="tw:font-mono tw:text-text">*254 / *255</TableCell>
                      <TableCell>{m.ref_ss_s3_code_254()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="tw:font-mono tw:text-text">*257</TableCell>
                      <TableCell>{m.ref_ss_s3_code_257()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <WarnBox>
                {m.ref_ss_s3_warn()}{" "}
                <a
                  href="https://financien.belgium.be/nl/particulieren/buitenland/motiv"
                  target="_blank"
                  rel="noreferrer"
                  className="ref-text-info"
                >
                  MOTIV (fgov.be)
                </a>{" "}
                {m.ref_ss_s3_consult_specialist()}
              </WarnBox>
            </SectionCard>
          </div>

          <div className="tw:col-span-12 tw:shell:col-span-5">
            {/* ── 4. NL Belastingtarieven 2026 ──────────────────── */}
            <SectionCard title={m.ref_ss_s4_title()} icon={Percent} accent="nl">
              <Table responsive className="tw:text-table-reference">
                <TableHeader className="tw:bg-surface-3">
                  <TableRow>
                    <TableHead>{m.ref_table_bracket()}</TableHead>
                    <TableHead>{m.ref_table_rate()}</TableHead>
                    <TableHead>{m.ref_table_buildup()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{m.ref_ss_s4_bracket1()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text">
                      {m.ref_ss_s4_rate1()}
                    </TableCell>
                    <TableCell className="tw:text-text">{m.ref_ss_s4_buildup1()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_s4_bracket2()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text">
                      {m.ref_ss_s4_rate2()}
                    </TableCell>
                    <TableCell className="tw:text-text">{m.ref_ss_s4_enkel_lb()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_s4_bracket3()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text">
                      {m.ref_ss_s4_rate3()}
                    </TableCell>
                    <TableCell className="tw:text-text">{m.ref_ss_s4_enkel_lb()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="tw:mt-4 tw:mb-2 tw:text-sm ref-text-sub">
                {m.ref_ss_heffingskortingen_title()}
              </p>
              <Table className="tw:text-table-reference">
                <TableBody>
                  <TableRow>
                    <TableCell>{m.ref_ss_ahk()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text tw:text-end">
                      {m.ref_ss_s4_ahk_max()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="tw:text-text tw:text-xs">
                      {m.ref_ss_ahk_expires()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_arbeidskorting()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text tw:text-end">
                      {m.ref_ss_s4_arbeidskorting_max()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="tw:text-text tw:text-xs">
                      {m.ref_ss_arbeidskorting_zero()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_combinatiekorting()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text tw:text-end">
                      {m.ref_ss_s4_combinatiekorting_max()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="tw:mt-2 tw:text-sm ref-footnote">{m.ref_ss_vv_footnote()}</p>
            </SectionCard>

            {/* ── 5. Kaderovereenkomst Telewerk (SZ) ────────────── */}
            <SectionCard title={m.ref_ss_s5_title()} icon={House} accent="neutral">
              <p className="tw:mb-4 ref-section-intro">{m.ref_ss_s5_intro()}</p>
              <Table className="tw:text-table-reference">
                <TableBody>
                  <TableRow>
                    <TableCell>{m.ref_ss_s5_row_effective()}</TableCell>
                    <TableCell className="tw:font-mono">
                      {m.ref_ss_s5_effective_date_value()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_s5_row_max_telework()}</TableCell>
                    <TableCell className="tw:font-mono tw:text-text tw:font-bold">49%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_s5_row_a1_validity()}</TableCell>
                    <TableCell className="tw:font-mono">
                      {m.ref_ss_s5_a1_validity_value()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_s5_row_apply_at()}</TableCell>
                    <TableCell>{m.ref_ss_s5_apply_at_value()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{m.ref_ss_s5_row_retro()}</TableCell>
                    <TableCell className="tw:font-mono">{m.ref_ss_s5_retro_value()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="tw:mt-2 tw:mb-1 tw:text-sm tw:font-semibold">{m.ref_ss_conditions()}</p>
              <ul className="tw:mb-0 tw:text-sm ref-list-sub">
                <li>{m.ref_ss_s5_cond1()}</li>
                <li>{m.ref_ss_s5_cond2()}</li>
                <li>{m.ref_ss_s5_cond3()}</li>
                <li>{m.ref_ss_s5_cond4()}</li>
              </ul>
            </SectionCard>

            {/* ── 6. Bewijslast ─────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s6_title()} icon={FolderOpen} accent="neutral">
              <p className="tw:mb-2 ref-section-intro">{m.ref_ss_s6_intro()}</p>
              <Accordion>
                <RefAccordionItem value="0" title={m.ref_ss_strong_evidence()}>
                  <ul className="tw:mb-0 ref-list-sub">
                    <li>{m.ref_ss_s6_ev1()}</li>
                    <li>{m.ref_ss_s6_ev2()}</li>
                    <li>{m.ref_ss_s6_ev3()}</li>
                    <li>{m.ref_ss_s6_ev4()}</li>
                    <li>{m.ref_ss_s6_ev5()}</li>
                    <li>{m.ref_ss_s6_ev6()}</li>
                    <li>{m.ref_ss_s6_ev7()}</li>
                  </ul>
                </RefAccordionItem>
                <RefAccordionItem
                  value="1"
                  title={m.ref_ss_insufficient_evidence()}
                  className="tw:mt-0.5"
                >
                  <ul className="tw:mb-0 ref-list-muted">
                    <li>{m.ref_ss_s6_insuf1()}</li>
                    <li>{m.ref_ss_s6_insuf2()}</li>
                    <li>{m.ref_ss_s6_insuf3()}</li>
                  </ul>
                  <p className="tw:mt-2 tw:mb-0 ref-footnote">{m.ref_ss_s6_source_note()}</p>
                </RefAccordionItem>
              </Accordion>
            </SectionCard>
          </div>
        </div>

        {/* ── 7. Worked Examples ──────────────────────────────────── */}
        <SectionCard title={m.ref_ss_s7_title()} icon={Calculator} accent="be">
          <p className="tw:mb-4 ref-section-intro">{m.ref_ss_s7_intro()}</p>
          <div className="tw:grid tw:grid-cols-12 tw:gap-4">
            {/* Basisdata */}
            <div className="tw:col-span-12 tw:md:col-span-4">
              <div className="tw:p-4 tw:rounded-md tw:h-full ref-example-block">
                <h6 className="tw:mb-4 tw:text-sm tw:font-semibold ref-subsection-label">
                  {m.ref_ss_base_data()}
                </h6>
                <StatRow label={m.ref_ss_label_fiscal_loon_nl()} value="€53.299" />
                <StatRow label={m.ref_ss_label_loonheffing()} value="€12.902" />
                <StatRow label={m.ref_ss_label_reiskosten()} value="€3.889" />
                <StatRow label={m.ref_ss_label_zorgpremie()} value="€1.560" />
                <StatRow label={m.ref_ss_label_werkdagen_nl()} value="181 / 231" />
                <StatRow label={m.ref_ss_label_werkdagen_be()} value="50" />
                <StatRow label={m.ref_ss_label_breuk_be()} value="180 / 230" />
              </div>
            </div>

            {/* Scenario A: geen ziektedagen */}
            <div className="tw:col-span-12 tw:md:col-span-4">
              <div className="ref-scenario-panel-nl tw:p-4 tw:rounded-md tw:h-full">
                <h6 className="tw:mb-4 tw:text-sm tw:font-semibold ref-subsection-label ref-text-nl">
                  {m.ref_ss_scenario_a_title()}
                </h6>
                <StatRow
                  label={m.ref_ss_label_nl_belastbaar_a()}
                  value="€41.763"
                  sub={m.ref_ss_example_sub_a_nl()}
                />
                <StatRow
                  label={m.ref_ss_label_be_deel_bruto()}
                  value="€11.536"
                  sub={m.ref_ss_example_sub_be_share()}
                />
                <StatRow label={m.ref_ss_label_nl_teruggaaf()} value="€4.314" highlight />
                <div className="tw:mt-4 ref-scenario-divider">
                  <h6 className="tw:mb-2 tw:text-sm tw:font-semibold ref-subsection-label ref-text-be">
                    {m.ref_ss_be_declaration()}
                  </h6>
                  <StatRow
                    label={m.ref_ss_label_w_grondslag()}
                    value="€44.711"
                    sub={m.ref_ss_example_sub_w_base()}
                  />
                  <StatRow label={m.ref_ss_label_y_o1()} value="€10.310" />
                  <StatRow label={m.ref_ss_label_z_o2()} value="€34.401" />
                  <StatRow label={m.ref_ss_label_be_te_betalen()} value="€3.277" highlight />
                </div>
                <div className="ref-scenario-result-success tw:mt-4 tw:p-2 tw:rounded-md tw:text-center">
                  <span className="tw:font-mono tw:text-success tw:font-bold">
                    {m.ref_ss_netto_voordeel_a()}
                  </span>
                  <div className="ref-footnote">{m.ref_ss_netto_voordeel_a_sub()}</div>
                </div>
              </div>
            </div>

            {/* Scenario B: 25 ziektedagen */}
            <div className="tw:col-span-12 tw:md:col-span-4">
              <div className="ref-scenario-panel-be tw:p-4 tw:rounded-md tw:h-full">
                <h6 className="tw:mb-4 tw:text-sm tw:font-semibold ref-subsection-label ref-text-warning">
                  {m.ref_ss_scenario_b_title()}
                </h6>
                <StatRow
                  label={m.ref_ss_label_breuk_nl_be()}
                  value="155 / 205"
                  sub={m.ref_ss_example_sub_fraction_b()}
                />
                <StatRow
                  label={m.ref_ss_label_be_aandeel_stijgt()}
                  value="50/205 = 24,4%"
                  sub={m.ref_ss_example_sub_be_share_b()}
                />
                <StatRow
                  label={m.ref_ss_label_nl_teruggaaf()}
                  value="€4.314"
                  sub={m.ref_ss_example_unchanged()}
                />
                <div className="tw:mt-4 ref-scenario-divider">
                  <h6 className="tw:mb-2 tw:text-sm tw:font-semibold ref-subsection-label ref-text-be">
                    {m.ref_ss_be_declaration()}
                  </h6>
                  <StatRow
                    label={m.ref_ss_label_w_grondslag()}
                    value="€44.711"
                    sub={m.ref_ss_example_unchanged()}
                  />
                  <StatRow label={m.ref_ss_label_y_o1()} value="€11.561" />
                  <StatRow label={m.ref_ss_label_z_o2()} value="€33.150" />
                  <StatRow label={m.ref_ss_label_be_te_betalen()} value="€3.600" highlight />
                </div>
                <div className="ref-scenario-result-warning tw:mt-4 tw:p-2 tw:rounded-md tw:text-center">
                  <span className="tw:font-mono tw:text-warning tw:font-bold">
                    {m.ref_ss_netto_voordeel_b()}
                  </span>
                  <div className="ref-footnote">{m.ref_ss_netto_voordeel_b_sub()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vergelijking tabel */}
          <div className="tw:mt-6">
            <h6 className="tw:mb-4 tw:text-sm tw:font-semibold ref-subsection-label">
              {m.ref_ss_comparison_all()}
            </h6>
            <Table responsive className="tw:text-table-reference-md">
              <TableHeader className="tw:bg-surface-3">
                <TableRow>
                  <TableHead>{m.ref_table_scenario()}</TableHead>
                  <TableHead>{m.ref_table_be_payable()}</TableHead>
                  <TableHead>{m.ref_table_nl_refund()}</TableHead>
                  <TableHead>{m.ref_table_net_diff()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{m.ref_ss_scenario_100pct_office()}</TableCell>
                  <TableCell className="tw:font-mono">€600</TableCell>
                  <TableCell className="tw:font-mono">€0</TableCell>
                  <TableCell className="tw:text-text">—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{m.ref_ss_scenario_50_no_sick()}</TableCell>
                  <TableCell className="tw:font-mono">€3.277</TableCell>
                  <TableCell className="tw:font-mono tw:text-text">+€4.314</TableCell>
                  <TableCell className="tw:font-mono tw:text-text tw:font-bold">
                    +€1.037 ✓
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{m.ref_ss_scenario_50_25_sick()}</TableCell>
                  <TableCell className="tw:font-mono">€3.600</TableCell>
                  <TableCell className="tw:font-mono tw:text-text">+€4.314</TableCell>
                  <TableCell className="tw:font-mono tw:text-text tw:font-bold">+€714 ⚠️</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="tw:text-sm tw:mb-0 ref-footnote">{m.ref_ss_s7_footnote()}</p>
          </div>
        </SectionCard>

        {/* ── Bronbestanden ───────────────────────────────────────── */}
        <SectionCard title={m.ref_ss_s8_title()} icon={FileText} accent="neutral">
          <p className="tw:mb-4 ref-section-intro">{m.ref_ss_s8_intro()}</p>
          <div className="tw:grid tw:grid-cols-12 tw:gap-4">
            <div className="tw:col-span-12 tw:table:col-span-6">
              <DocLink
                href="/docs/ACV-Checklist-Grensarbeiders-2026.pdf"
                title={m.ref_ss_doc1_title()}
                sub={m.ref_ss_doc1_sub()}
              />
            </div>
            <div className="tw:col-span-12 tw:table:col-span-6">
              <DocLink
                href="/docs/ACV-Telewerk-Infosessie-2026.pdf"
                title={m.ref_ss_doc2_title()}
                sub={m.ref_ss_doc2_sub()}
              />
            </div>
          </div>
        </SectionCard>

        <PageFooter>
          {m.ref_ss_footer()}&nbsp; |&nbsp;{" "}
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
