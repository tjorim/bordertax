import { Link } from "@tanstack/react-router";
import { Accordion, Col, Container, Navbar, Row, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles.css";
import * as m from "../paraglide/messages.js";
import {
  BeBadge,
  NlBadge,
  SectionCard,
  StatRow,
  TipBox,
  WarnBox,
} from "./reference/components.js";
import { AppNavbar, BackBrand } from "../components/AppNavbar";
import { PageFooter } from "../components/PageFooter";

function Formula({ children }: { children: React.ReactNode }) {
  return <pre className="p-3 rounded mb-0 ref-formula">{children}</pre>;
}

// ── Main page ────────────────────────────────────────────────────

export default function SalarySplitReference() {
  return (
    <>
      <AppNavbar>
        <BackBrand />
        <Navbar.Text className="fw-semibold ref-nav-text">
          <i className="bi bi-book-fill me-2" style={{ color: "var(--bt-be-light)" }} />
          {m.ref_ss_nav_title()}
        </Navbar.Text>
      </AppNavbar>

      <Container fluid="lg" className="pb-5">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="text-center mb-5 mt-2">
          <h1 className="mb-2 ref-hero-title">🇧🇪&thinsp;🇳🇱&nbsp; {m.ref_ss_hero_title()}</h1>
          <p className="ref-hero-subtitle">{m.ref_ss_hero_subtitle()}</p>
        </div>

        {/* ── Alert: geen neutralisatieregeling ─────────────────── */}
        <WarnBox>
          <strong>{m.ref_ss_tax_vs_ss_title()}</strong> {m.ref_ss_tax_vs_ss_body()}
        </WarnBox>

        <Row className="g-4">
          <Col lg={7}>
            {/* ── 1. Hoofdregel ──────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s1_title()} icon="bi-flag-fill" accent="neutral">
              <p className="mb-3 ref-text-sub">{m.ref_ss_s1_intro()}</p>
              <Formula>{m.ref_ss_s1_formula()}</Formula>
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <TipBox>{m.ref_ss_s1_tip_20pct()}</TipBox>
              </div>
              <TipBox>{m.ref_ss_s1_tip_60_40()}</TipBox>
              <WarnBox>{m.ref_ss_s1_warn_qualification()}</WarnBox>
            </SectionCard>

            {/* ── 2. Dagentelling ────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s2_title()} icon="bi-calendar3" accent="neutral">
              <p className="mb-3 ref-text-sub">{m.ref_ss_s2_intro()}</p>
              <Table responsive className="mb-3 ref-table-ref">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_component()}</th>
                    <th>
                      <NlBadge>{m.ref_ss_col_nl()}</NlBadge>
                    </th>
                    <th>
                      <BeBadge>{m.ref_ss_col_be()}</BeBadge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "row1", comp: m.ref_ss_s2_row1_comp(), nl: m.ref_ss_s2_row1_nl(), be: m.ref_ss_s2_row1_be() },
                    { id: "row2", comp: m.ref_ss_s2_row2_comp(), nl: m.ref_ss_s2_row2_nl(), be: m.ref_ss_s2_row2_be() },
                    { id: "row3", comp: m.ref_ss_s2_row3_comp(), nl: m.ref_ss_s2_row3_nl(), be: m.ref_ss_s2_row3_be() },
                    { id: "row4", comp: m.ref_ss_s2_row4_comp(), nl: m.ref_ss_s2_row4_nl(), be: m.ref_ss_s2_row4_be() },
                  ].map(({ id, comp, nl, be }) => (
                    <tr key={id} className="ref-tr">
                      <td className="ref-td-label">{comp}</td>
                      <td>{nl}</td>
                      <td>{be}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <WarnBox>{m.ref_ss_s2_warn()}</WarnBox>
              <TipBox>{m.ref_ss_s2_tip()}</TipBox>
            </SectionCard>

            {/* ── 3. FOD Berekeningsformule ──────────────────────── */}
            <SectionCard title={m.ref_ss_s3_title()} icon="bi-calculator-fill" accent="be">
              <p className="mb-3 ref-text-sub">{m.ref_ss_s3_intro()}</p>
              <Formula>{m.ref_ss_be_formula()}</Formula>
              <div className="mt-3">
                <p className="mb-2 small ref-text-sub">{m.ref_ss_be_codes_title()}</p>
                <Table size="sm" className="ref-table-sm">
                  <tbody>
                    <tr className="ref-tr">
                      <td className="ref-td-mono-be">1250 / 2250</td>
                      <td>{m.ref_ss_s3_code_1250()}</td>
                    </tr>
                    <tr className="ref-tr">
                      <td className="ref-td-mono-be">Vak IV O.1</td>
                      <td>{m.ref_ss_s3_code_vak4_o1()}</td>
                    </tr>
                    <tr className="ref-tr">
                      <td className="ref-td-mono-be">Vak IV O.2</td>
                      <td>{m.ref_ss_s3_code_vak4_o2()}</td>
                    </tr>
                    <tr className="ref-tr">
                      <td className="ref-td-mono-be">*254 / *255</td>
                      <td>{m.ref_ss_s3_code_254()}</td>
                    </tr>
                    <tr className="ref-tr">
                      <td className="ref-td-mono-be">*257</td>
                      <td>{m.ref_ss_s3_code_257()}</td>
                    </tr>
                  </tbody>
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
          </Col>

          <Col lg={5}>
            {/* ── 4. NL Belastingtarieven 2026 ──────────────────── */}
            <SectionCard title={m.ref_ss_s4_title()} icon="bi-percent" accent="nl">
              <Table size="sm" responsive className="ref-table-sm">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_bracket()}</th>
                    <th>{m.ref_table_rate()}</th>
                    <th>{m.ref_table_buildup()}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s4_bracket1()}</td>
                    <td className="ref-td-mono-nl">{m.ref_ss_s4_rate1()}</td>
                    <td className="ref-td-sub">{m.ref_ss_s4_buildup1()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s4_bracket2()}</td>
                    <td className="ref-td-mono-nl">{m.ref_ss_s4_rate2()}</td>
                    <td className="ref-td-sub">{m.ref_ss_s4_enkel_lb()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s4_bracket3()}</td>
                    <td className="ref-td-mono-nl">{m.ref_ss_s4_rate3()}</td>
                    <td className="ref-td-sub">{m.ref_ss_s4_enkel_lb()}</td>
                  </tr>
                </tbody>
              </Table>
              <p className="mt-3 mb-2 small ref-text-sub">{m.ref_ss_heffingskortingen_title()}</p>
              <Table size="sm" className="ref-table-sm">
                <tbody>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_ahk()}</td>
                    <td className="ref-td-mono-success text-end">{m.ref_ss_s4_ahk_max()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td className="ref-td-indent">{m.ref_ss_ahk_expires()}</td>
                    <td />
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_arbeidskorting()}</td>
                    <td className="ref-td-mono-success text-end">
                      {m.ref_ss_s4_arbeidskorting_max()}
                    </td>
                  </tr>
                  <tr className="ref-tr">
                    <td className="ref-td-indent">{m.ref_ss_arbeidskorting_zero()}</td>
                    <td />
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_combinatiekorting()}</td>
                    <td className="ref-td-mono-success text-end">
                      {m.ref_ss_s4_combinatiekorting_max()}
                    </td>
                  </tr>
                </tbody>
              </Table>
              <p className="mt-2 small ref-footnote">{m.ref_ss_vv_footnote()}</p>
            </SectionCard>

            {/* ── 5. Kaderovereenkomst Telewerk (SZ) ────────────── */}
            <SectionCard title={m.ref_ss_s5_title()} icon="bi-house-check-fill" accent="neutral">
              <p className="mb-3 ref-section-intro">{m.ref_ss_s5_intro()}</p>
              <Table size="sm" className="ref-table-sm">
                <tbody>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s5_row_effective()}</td>
                    <td className="ref-td-mono">{m.ref_ss_s5_effective_date_value()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s5_row_max_telework()}</td>
                    <td className="ref-td-mono-success fw-bold">49%</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s5_row_a1_validity()}</td>
                    <td className="ref-td-mono">{m.ref_ss_s5_a1_validity_value()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s5_row_apply_at()}</td>
                    <td>{m.ref_ss_s5_apply_at_value()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_ss_s5_row_retro()}</td>
                    <td className="ref-td-mono">{m.ref_ss_s5_retro_value()}</td>
                  </tr>
                </tbody>
              </Table>
              <p className="mt-2 mb-1 small fw-semibold">{m.ref_ss_conditions()}</p>
              <ul className="mb-0 small ref-list-sub">
                <li>{m.ref_ss_s5_cond1()}</li>
                <li>{m.ref_ss_s5_cond2()}</li>
                <li>{m.ref_ss_s5_cond3()}</li>
                <li>{m.ref_ss_s5_cond4()}</li>
              </ul>
            </SectionCard>

            {/* ── 6. Bewijslast ─────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s6_title()} icon="bi-folder2-open" accent="neutral">
              <p className="mb-2 ref-section-intro">{m.ref_ss_s6_intro()}</p>
              <Accordion flush>
                <Accordion.Item eventKey="0" className="ref-accordion-item">
                  <Accordion.Header>
                    <span className="small fw-semibold">{m.ref_ss_strong_evidence()}</span>
                  </Accordion.Header>
                  <Accordion.Body className="ref-accordion-body">
                    <ul className="mb-0 ref-list-sub">
                      <li>{m.ref_ss_s6_ev1()}</li>
                      <li>{m.ref_ss_s6_ev2()}</li>
                      <li>{m.ref_ss_s6_ev3()}</li>
                      <li>{m.ref_ss_s6_ev4()}</li>
                      <li>{m.ref_ss_s6_ev5()}</li>
                      <li>{m.ref_ss_s6_ev6()}</li>
                      <li>{m.ref_ss_s6_ev7()}</li>
                    </ul>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item
                  eventKey="1"
                  className="ref-accordion-item"
                  style={{ marginTop: 2 }}
                >
                  <Accordion.Header>
                    <span className="small fw-semibold">{m.ref_ss_insufficient_evidence()}</span>
                  </Accordion.Header>
                  <Accordion.Body className="ref-accordion-body">
                    <ul className="mb-0 ref-list-muted">
                      <li>{m.ref_ss_s6_insuf1()}</li>
                      <li>{m.ref_ss_s6_insuf2()}</li>
                      <li>{m.ref_ss_s6_insuf3()}</li>
                    </ul>
                    <p className="mt-2 mb-0 ref-footnote">{m.ref_ss_s6_source_note()}</p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </SectionCard>
          </Col>
        </Row>

        {/* ── 7. Worked Examples ──────────────────────────────────── */}
        <SectionCard title={m.ref_ss_s7_title()} icon="bi-calculator" accent="be">
          <p className="mb-3 ref-section-intro">{m.ref_ss_s7_intro()}</p>
          <Row className="g-3">
            {/* Basisdata */}
            <Col md={4}>
              <div className="p-3 rounded h-100 ref-example-block">
                <h6 className="mb-3 small fw-semibold ref-subsection-label">
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
            </Col>

            {/* Scenario A: geen ziektedagen */}
            <Col md={4}>
              <div className="ref-scenario-panel-nl p-3 rounded h-100">
                <h6 className="mb-3 small fw-semibold ref-subsection-label ref-text-nl">
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
                <div className="mt-3 ref-scenario-divider">
                  <h6 className="mb-2 small fw-semibold ref-subsection-label ref-text-be">
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
                <div className="ref-scenario-result-success mt-3 p-2 rounded text-center">
                  <span className="ref-td-mono-success fw-bold">{m.ref_ss_netto_voordeel_a()}</span>
                  <div className="ref-footnote">{m.ref_ss_netto_voordeel_a_sub()}</div>
                </div>
              </div>
            </Col>

            {/* Scenario B: 25 ziektedagen */}
            <Col md={4}>
              <div className="ref-scenario-panel-be p-3 rounded h-100">
                <h6 className="mb-3 small fw-semibold ref-subsection-label ref-text-warning">
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
                <div className="mt-3 ref-scenario-divider">
                  <h6 className="mb-2 small fw-semibold ref-subsection-label ref-text-be">
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
                <div className="ref-scenario-result-warning mt-3 p-2 rounded text-center">
                  <span className="ref-td-mono-warning">{m.ref_ss_netto_voordeel_b()}</span>
                  <div className="ref-footnote">{m.ref_ss_netto_voordeel_b_sub()}</div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Vergelijking tabel */}
          <div className="mt-4">
            <h6 className="mb-3 small fw-semibold ref-subsection-label">
              {m.ref_ss_comparison_all()}
            </h6>
            <Table responsive className="ref-table-ref">
              <thead className="ref-thead">
                <tr>
                  <th>{m.ref_table_scenario()}</th>
                  <th>{m.ref_table_be_payable()}</th>
                  <th>{m.ref_table_nl_refund()}</th>
                  <th>{m.ref_table_net_diff()}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="ref-tr">
                  <td>{m.ref_ss_scenario_100pct_office()}</td>
                  <td className="ref-td-mono">€600</td>
                  <td className="ref-td-mono">€0</td>
                  <td className="ref-text-muted">—</td>
                </tr>
                <tr className="ref-tr">
                  <td>{m.ref_ss_scenario_50_no_sick()}</td>
                  <td className="ref-td-mono">€3.277</td>
                  <td className="ref-td-mono-success">+€4.314</td>
                  <td className="ref-td-mono-success fw-bold">+€1.037 ✓</td>
                </tr>
                <tr className="ref-tr">
                  <td>{m.ref_ss_scenario_50_25_sick()}</td>
                  <td className="ref-td-mono">€3.600</td>
                  <td className="ref-td-mono-success">+€4.314</td>
                  <td className="ref-td-mono-warning">+€714 ⚠️</td>
                </tr>
              </tbody>
            </Table>
            <p className="small mb-0 ref-footnote">{m.ref_ss_s7_footnote()}</p>
          </div>
        </SectionCard>

        {/* ── Bronbestanden ───────────────────────────────────────── */}
        <SectionCard title={m.ref_ss_s8_title()} icon="bi-file-earmark-pdf-fill" accent="neutral">
          <p className="mb-3 ref-section-intro">{m.ref_ss_s8_intro()}</p>
          <Row className="g-3">
            <Col sm={6}>
              <a
                href="/docs/ACV-Checklist-Grensarbeiders-2026.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-decoration-none"
              >
                <div className="ref-link-card ref-link-card-body p-3 rounded d-flex align-items-center gap-3">
                  <i
                    className="bi bi-file-earmark-pdf-fill fs-2"
                    style={{ color: "#e74c3c", flexShrink: 0 }}
                  />
                  <div>
                    <div className="fw-semibold small ref-text">{m.ref_ss_doc1_title()}</div>
                    <div className="ref-footnote">{m.ref_ss_doc1_sub()}</div>
                  </div>
                  <i
                    className="bi bi-box-arrow-up-right ms-auto ref-icon-muted-sm"
                    aria-hidden="true"
                  />
                </div>
              </a>
            </Col>
            <Col sm={6}>
              <a
                href="/docs/ACV-Telewerk-Infosessie-2026.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-decoration-none"
              >
                <div className="ref-link-card ref-link-card-body p-3 rounded d-flex align-items-center gap-3">
                  <i
                    className="bi bi-file-earmark-pdf-fill fs-2"
                    style={{ color: "#e74c3c", flexShrink: 0 }}
                  />
                  <div>
                    <div className="fw-semibold small ref-text">{m.ref_ss_doc2_title()}</div>
                    <div className="ref-footnote">{m.ref_ss_doc2_sub()}</div>
                  </div>
                  <i
                    className="bi bi-box-arrow-up-right ms-auto ref-icon-muted-sm"
                    aria-hidden="true"
                  />
                </div>
              </a>
            </Col>
          </Row>
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
      </Container>
    </>
  );
}
