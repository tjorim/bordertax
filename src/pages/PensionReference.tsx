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
import { AppNavbar } from "../components/AppNavbar";

// ── Main page ────────────────────────────────────────────────────

export default function PensionReference() {
  return (
    <>
      <AppNavbar>
        <Navbar.Brand as={Link} to="/" className="text-decoration-none ref-nav-brand">
          <i className="bi bi-arrow-left me-2" />
          {m.ref_nav_back_to_calculator()}
        </Navbar.Brand>
        <Navbar.Text className="fw-semibold ref-nav-text">
          <i className="bi bi-piggy-bank-fill me-2" style={{ color: "var(--bt-be-light)" }} />
          {m.ref_pension_nav_title()}
        </Navbar.Text>
      </AppNavbar>

      <Container fluid="lg" className="pb-5">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="text-center mb-5 mt-2">
          <h1 className="mb-2 ref-hero-title">🇧🇪&thinsp;🇳🇱&nbsp; {m.ref_pension_hero_title()}</h1>
          <p className="ref-hero-subtitle">{m.ref_pension_hero_subtitle()}</p>
        </div>

        {/* ── 3-pijler overzicht ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s1_title()} icon="bi-layers-fill" accent="neutral">
          <Row className="g-3">
            {[
              {
                pijler: m.ref_pension_p1_pillar(),
                nl: m.ref_pension_p1_nl(),
                be: m.ref_pension_p1_be(),
                color: "var(--bt-info)",
              },
              {
                pijler: m.ref_pension_p2_pillar(),
                nl: m.ref_pension_p2_nl(),
                be: m.ref_pension_p2_be(),
                color: "var(--bt-success)",
              },
              {
                pijler: m.ref_pension_p3_pillar(),
                nl: m.ref_pension_p3_nl(),
                be: m.ref_pension_p3_be(),
                color: "var(--bt-warning)",
              },
            ].map(({ pijler, nl, be, color }) => (
              <Col md={4} key={pijler}>
                <div
                  className="p-3 rounded h-100 ref-pillar-card"
                  style={{ border: `1px solid ${color}40` }}
                >
                  <div className="fw-bold mb-2 small ref-pillar-label" style={{ color }}>
                    {pijler}
                  </div>
                  <div className="mb-2">
                    <NlBadge>🇳🇱 NL</NlBadge> <span className="small ref-text-sub">{nl}</span>
                  </div>
                  <div>
                    <BeBadge>🇧🇪 BE</BeBadge> <span className="small ref-text-sub">{be}</span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          <WarnBox>
            <strong>{m.ref_pension_term_confusion_title()}</strong>{" "}
            {m.ref_pension_term_confusion_body()}
          </WarnBox>
        </SectionCard>

        <Row className="g-4">
          <Col lg={6}>
            {/* ── AOW ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_aow()} icon="bi-flag-fill" accent="nl">
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

              <div className="mt-4 mb-2 small fw-semibold ref-subsection-label">
                {m.ref_pension_max_amounts()}
              </div>
              <Table size="sm" className="ref-table-sm">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_type()}</th>
                    <th>{m.ref_table_pct()}</th>
                    <th>{m.ref_table_gross_monthly()}</th>
                    <th>{m.ref_table_holiday_pay()}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="ref-tr">
                    <td>{m.ref_pension_aow_ongehuwd()}</td>
                    <td className="ref-td-mono-nl">70%</td>
                    <td className="ref-td-mono">{m.ref_pension_aow_ongehuwd_monthly()}</td>
                    <td className="ref-td-mono">{m.ref_pension_aow_ongehuwd_holiday()}</td>
                  </tr>
                  <tr className="ref-tr">
                    <td>{m.ref_pension_aow_gehuwd()}</td>
                    <td className="ref-td-mono-nl">50%</td>
                    <td className="ref-td-mono">{m.ref_pension_aow_gehuwd_monthly()}</td>
                    <td className="ref-td-mono">{m.ref_pension_aow_gehuwd_holiday()}</td>
                  </tr>
                </tbody>
              </Table>

              <div className="mt-3 p-3 rounded ref-example-block">
                <div className="small fw-semibold mb-2 ref-text-muted">
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

              <div className="mt-3">
                <TipBox>{m.ref_pension_tip_partner()}</TipBox>
                <TipBox>{m.ref_pension_tip_aanvragen()}</TipBox>
              </div>

              <Accordion flush className="mt-2">
                <Accordion.Item eventKey="aow-history" className="ref-accordion-item">
                  <Accordion.Header>
                    <span className="small fw-semibold">{m.ref_pension_aow_history()}</span>
                  </Accordion.Header>
                  <Accordion.Body className="ref-accordion-body">
                    <Table size="sm" className="ref-table-sub">
                      <tbody>
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
                          <tr key={yr} className="ref-tr">
                            <td>{yr}</td>
                            <td className="ref-td-mono">{age}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </SectionCard>

            {/* ── ANW ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_anw()} icon="bi-heart-pulse-fill" accent="nl">
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

              <div className="mt-3 small fw-semibold mb-2 ref-subsection-label">
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
            <SectionCard
              title={m.ref_pension_s_aow_work()}
              icon="bi-exclamation-diamond-fill"
              accent="nl"
            >
              <WarnBox>{m.ref_pension_aow_work_warn()}</WarnBox>
              <ul className="small mb-0 ref-list-sub">
                <li>{m.ref_pension_aow_work_li1()}</li>
                <li>{m.ref_pension_aow_work_li2()}</li>
                <li>{m.ref_pension_aow_work_li3()}</li>
              </ul>
              <TipBox>{m.ref_pension_aow_work_tip()}</TipBox>
            </SectionCard>
          </Col>

          <Col lg={6}>
            {/* ── Aanvullend pensioen NL ─────────────────────────── */}
            <SectionCard
              title={m.ref_pension_s_supplementary()}
              icon="bi-building-fill"
              accent="nl"
            >
              <p className="small mb-3 ref-text-sub">{m.ref_pension_sup_intro()}</p>
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

              <div className="mt-2 mb-2 small fw-semibold ref-subsection-label">
                {m.ref_pension_wtp_title()}
              </div>
              <ul className="small mb-3 ref-list-sub">
                <li>{m.ref_pension_wtp_li1()}</li>
                <li>{m.ref_pension_wtp_li2()}</li>
                <li>{m.ref_pension_wtp_li3()}</li>
                <li>{m.ref_pension_wtp_li4()}</li>
                <li>{m.ref_pension_wtp_li5()}</li>
              </ul>

              <div className="mt-2 mb-2 small fw-semibold ref-subsection-label">
                {m.ref_pension_divorce()}
              </div>
              <p className="small mb-1 ref-text-sub">{m.ref_pension_divorce_p()}</p>
              <WarnBox>{m.ref_pension_divorce_warn()}</WarnBox>
            </SectionCard>

            {/* ── RVU ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_rvu()} icon="bi-door-open-fill" accent="nl">
              <p className="small mb-3 ref-text-sub">{m.ref_pension_rvu_intro()}</p>
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
              <ul className="small mt-3 mb-0 ref-list-sub">
                <li>{m.ref_pension_rvu_li1()}</li>
                <li>{m.ref_pension_rvu_li2()}</li>
                <li>{m.ref_pension_rvu_li3()}</li>
                <li>{m.ref_pension_rvu_li4()}</li>
              </ul>
              <TipBox>{m.ref_pension_rvu_tip()}</TipBox>
            </SectionCard>

            {/* ── Inhoudingen op pensioen ────────────────────────── */}
            <SectionCard
              title={m.ref_pension_s_deductions()}
              icon="bi-dash-circle-fill"
              accent="nl"
            >
              <p className="small mb-3 ref-text-sub">{m.ref_pension_ded_intro()}</p>
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
          </Col>
        </Row>

        {/* ── Belgisch rustpensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_be()} icon="bi-flag-fill" accent="be">
          <Row className="g-4">
            <Col md={4}>
              <div className="small fw-semibold mb-2 ref-subsection-label">
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
            </Col>

            <Col md={4}>
              <div className="small fw-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_earliest()}
              </div>
              <Table size="sm" className="ref-table-sm">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_age()}</th>
                    <th>{m.ref_table_career()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [m.ref_pension_be_age_60(), m.ref_pension_be_career_60()],
                    [m.ref_pension_be_age_61_62(), m.ref_pension_be_career_61_62()],
                    [m.ref_pension_be_age_63_64(), m.ref_pension_be_career_63_64()],
                  ].map(([age, career]) => (
                    <tr key={age} className="ref-tr">
                      <td className="ref-td-mono-be">{age}</td>
                      <td className="ref-td-sub">{career}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <TipBox>{m.ref_pension_be_tip_nl_years()}</TipBox>
            </Col>

            <Col md={4}>
              <div className="small fw-semibold mb-2 ref-subsection-label">
                {m.ref_pension_be_ziv()}
              </div>
              <p className="small mb-2 ref-text-sub">
                <strong>{m.ref_pension_ziv_alleenstaand()}</strong>
              </p>
              <Table size="sm" className="ref-table-xs">
                <tbody>
                  {[
                    ["< €2.078,46/mnd", m.ref_pension_ziv_rule_geen1()],
                    ["€2.078,46 – €2.154,94", m.ref_pension_ziv_rule_prog1()],
                    ["> €2.154,94/mnd", m.ref_pension_ziv_rule_355_1()],
                  ].map(([range, rule]) => (
                    <tr key={range} className="ref-tr">
                      <td className="ref-td-mono-be-xs">{range}</td>
                      <td className="ref-td-sub">{rule}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="small mt-3 mb-2 ref-text-sub">
                <strong>{m.ref_pension_ziv_gezin()}</strong>
              </p>
              <Table size="sm" className="ref-table-xs">
                <tbody>
                  {[
                    ["< €2.463,25/mnd", m.ref_pension_ziv_rule_geen2()],
                    ["€2.463,25 – €2.553,89", m.ref_pension_ziv_rule_prog2()],
                    ["> €2.553,89/mnd", m.ref_pension_ziv_rule_355_2()],
                  ].map(([range, rule]) => (
                    <tr key={range} className="ref-tr">
                      <td className="ref-td-mono-be-xs">{range}</td>
                      <td className="ref-td-sub">{rule}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <WarnBox>{m.ref_pension_ziv_warn()}</WarnBox>
            </Col>
          </Row>
        </SectionCard>

        {/* ── Hervorming 2027 + Malus/Bonus ───────────────────────── */}
        <Row className="g-4">
          <Col md={4}>
            <SectionCard
              title={m.ref_pension_s_be_2027()}
              icon="bi-calendar-check-fill"
              accent="be"
            >
              <p className="small mb-3 ref-text-sub">{m.ref_pension_be2027_intro()}</p>
              <Table size="sm" className="ref-table-sm">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_age()}</th>
                    <th>{m.ref_table_career_156()}</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={String(age) + String(career)} className="ref-tr">
                        <td className="ref-td-mono-be">{age}</td>
                        <td className="ref-td-sub">{career}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </SectionCard>
          </Col>

          <Col md={4}>
            <SectionCard
              title={m.ref_pension_s_malus()}
              icon="bi-arrow-down-circle-fill"
              accent="be"
            >
              <p className="small mb-3 ref-text-sub">{m.ref_pension_malus_intro()}</p>
              <Table size="sm" className="ref-table-ref">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_birth_year()}</th>
                    <th>{m.ref_table_malus_per_year()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [m.ref_pension_malus_1961(), "2%"],
                    [m.ref_pension_malus_1966(), "4%"],
                    [m.ref_pension_malus_1975(), "5%"],
                  ].map(([yr, malus]) => (
                    <tr key={yr} className="ref-tr">
                      <td className="ref-td-sub">{yr}</td>
                      <td className="ref-td-mono-danger">{malus}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </SectionCard>
          </Col>

          <Col md={4}>
            <SectionCard title={m.ref_pension_s_bonus()} icon="bi-arrow-up-circle-fill" accent="be">
              <p className="small mb-3 ref-text-sub">{m.ref_pension_bonus_intro()}</p>
              <Table size="sm" className="ref-table-ref">
                <thead className="ref-thead">
                  <tr>
                    <th>{m.ref_table_birth_year()}</th>
                    <th>{m.ref_table_bonus_per_year()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [m.ref_pension_bonus_1962(), "2%"],
                    [m.ref_pension_bonus_1963(), "4%"],
                    [m.ref_pension_bonus_1973(), "5%"],
                  ].map(([yr, bonus]) => (
                    <tr key={yr} className="ref-tr">
                      <td className="ref-td-sub">{yr}</td>
                      <td className="ref-td-mono-success fw-bold">{bonus}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </SectionCard>
          </Col>
        </Row>

        {/* ── Inkomenshiaat & grensarbeiderspensioen ──────────────── */}
        <Row className="g-4">
          <Col md={6}>
            <SectionCard title={m.ref_pension_s_gap()} icon="bi-hourglass-split" accent="neutral">
              <p className="small mb-3 ref-text-sub">{m.ref_pension_gap_intro()}</p>
              <ul className="small mb-3 ref-list-sub">
                <li>{m.ref_pension_gap_li1()}</li>
                <li>{m.ref_pension_gap_li2()}</li>
                <li>{m.ref_pension_gap_li3()}</li>
              </ul>

              <div className="small fw-semibold mb-2 ref-subsection-label">
                {m.ref_pension_art64()}
              </div>
              <p className="small mb-2 ref-text-sub">{m.ref_pension_art64_intro()}</p>
              <ol className="small mb-0 ref-list-sub">
                <li>{m.ref_pension_art64_li1()}</li>
                <li>{m.ref_pension_art64_li2()}</li>
              </ol>
              <WarnBox>{m.ref_pension_art64_warn()}</WarnBox>
            </SectionCard>
          </Col>

          <Col md={6}>
            <SectionCard title={m.ref_pension_s_border()} icon="bi-archive-fill" accent="be">
              <p className="small mb-3 ref-text-sub">{m.ref_pension_border_intro()}</p>
              <ul className="small mb-3 ref-list-sub">
                <li>{m.ref_pension_border_li1()}</li>
                <li>{m.ref_pension_border_li2()}</li>
                <li>{m.ref_pension_border_li3()}</li>
                <li>{m.ref_pension_border_li4()}</li>
                <li>{m.ref_pension_border_li5()}</li>
              </ul>
              <TipBox>{m.ref_pension_border_tip()}</TipBox>
            </SectionCard>
          </Col>
        </Row>

        {/* ── Overlevingspensioen BE ───────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_survivor()} icon="bi-heart-fill" accent="be">
          <Row className="g-3">
            <Col md={6}>
              <div className="small fw-semibold mb-2 ref-subsection-label">
                {m.ref_pension_conditions()}
              </div>
              <ul className="small ref-list-sub">
                <li>{m.ref_pension_survivor_li1()}</li>
                <li>{m.ref_pension_survivor_li2()}</li>
                <li>{m.ref_pension_survivor_li3()}</li>
                <li>{m.ref_pension_survivor_li4()}</li>
                <li>{m.ref_pension_survivor_li5()}</li>
                <li>{m.ref_pension_survivor_li6()}</li>
              </ul>
            </Col>
            <Col md={6}>
              <div className="small fw-semibold mb-2 ref-subsection-label">
                {m.ref_pension_special_situations()}
              </div>
              <ul className="small mb-0 ref-list-sub">
                <li>{m.ref_pension_survivor_sp_li1()}</li>
                <li>{m.ref_pension_survivor_sp_li2()}</li>
              </ul>
            </Col>
          </Row>
        </SectionCard>

        {/* ── Arbeidsongeschiktheid & AOW ──────────────────────────── */}
        <SectionCard title={m.ref_pension_s_disability()} icon="bi-bandaid-fill" accent="nl">
          <Row className="g-3">
            <Col md={6}>
              <p className="small mb-2 ref-text-sub">{m.ref_pension_disability_intro1()}</p>
              <ul className="small ref-list-sub">
                <li>{m.ref_pension_disability_li1()}</li>
                <li>{m.ref_pension_disability_li2()}</li>
              </ul>
            </Col>
            <Col md={6}>
              <p className="small mb-2 ref-text-sub">{m.ref_pension_disability_intro2()}</p>
              <ul className="small mb-0 ref-list-sub">
                <li>{m.ref_pension_disability_li3()}</li>
                <li>{m.ref_pension_disability_li4()}</li>
                <li>{m.ref_pension_disability_li5()}</li>
              </ul>
            </Col>
          </Row>
        </SectionCard>

        {/* ── Belasting op pensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_tax()} icon="bi-receipt-cutoff" accent="neutral">
          <p className="small mb-3 ref-text-sub">{m.ref_pension_tax_intro()}</p>
          <Row className="g-3">
            <Col md={6}>
              <div className="small fw-semibold mb-2 ref-subsection-label">
                {m.ref_pension_exception_nl()}
              </div>
              <ul className="small mb-0 ref-list-sub">
                <li>{m.ref_pension_tax_exc_li1()}</li>
                <li>{m.ref_pension_tax_exc_li2()}</li>
                <li>{m.ref_pension_tax_exc_li3()}</li>
                <li>{m.ref_pension_tax_exc_li4()}</li>
              </ul>
            </Col>
            <Col md={6}>
              <TipBox>{m.ref_pension_tax_tip1()}</TipBox>
              <TipBox>{m.ref_pension_tax_tip2()}</TipBox>
            </Col>
          </Row>
        </SectionCard>

        {/* ── Bronbestand ─────────────────────────────────────────── */}
        <SectionCard
          title={m.ref_pension_s_source()}
          icon="bi-file-earmark-pdf-fill"
          accent="neutral"
        >
          <a
            href="/docs/ACV-Pensioen-Infosessie-2026.pdf"
            target="_blank"
            rel="noreferrer"
            className="text-decoration-none"
          >
            <div
              className="ref-link-card ref-link-card-body p-3 rounded d-flex align-items-center gap-3"
              style={{ maxWidth: 480 }}
            >
              <i
                className="bi bi-file-earmark-pdf-fill fs-2"
                style={{ color: "#e74c3c", flexShrink: 0 }}
              />
              <div>
                <div className="fw-semibold small ref-text">{m.ref_pension_source_doc_title()}</div>
                <div className="ref-footnote">{m.ref_pension_source_doc_sub()}</div>
              </div>
              <i
                className="bi bi-box-arrow-up-right ms-auto ref-icon-muted-sm"
                aria-hidden="true"
              />
            </div>
          </a>
        </SectionCard>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="text-center small py-3 mt-2 ref-page-footer">
          {m.ref_pension_footer()}&nbsp;|&nbsp;
          <a
            href="https://www.acvgrensarbeiders.be"
            target="_blank"
            rel="noreferrer"
            className="ref-text-info"
          >
            acvgrensarbeiders.be
          </a>
        </footer>
      </Container>
    </>
  );
}
