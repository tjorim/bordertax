import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Accordion,
  Button,
  Col,
  Container,
  Navbar,
  Row,
  Table,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles.css";
import * as m from "../paraglide/messages.js";
import { getLocale, setLocale } from "../paraglide/runtime.js";
import { BeBadge, NlBadge, SectionCard, TipBox, WarnBox } from "./reference/components.js";

function StatRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="d-flex justify-content-between align-items-baseline py-2 px-3"
      style={{
        borderBottom: "1px solid var(--bt-border-soft)",
        background: highlight ? "var(--bt-surface-4)" : "transparent",
        borderRadius: highlight ? "var(--bt-r-sm)" : undefined,
      }}
    >
      <span style={{ color: "var(--bt-text-sub)", fontSize: "0.875rem" }}>{label}</span>
      <div className="text-end">
        <span
          style={{
            fontFamily: "var(--bt-font-mono)",
            fontWeight: highlight ? 700 : 500,
            color: highlight ? "var(--bt-text)" : "var(--bt-text-sub)",
            fontSize: "0.9rem",
          }}
        >
          {value}
        </span>
        {sub && <div style={{ color: "var(--bt-text-muted)", fontSize: "0.75rem" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────

export default function PensionReference() {
  const [locale, setLocaleState] = useState(getLocale());
  const nextLangLabel = locale === "en" ? m.lang_nl() : m.lang_en();

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Navbar.Brand style={{ fontSize: "0.95rem", opacity: 0.8 }}>
              <i className="bi bi-arrow-left me-2" />
              {m.ref_nav_back_to_calculator()}
            </Navbar.Brand>
          </Link>
          <Navbar.Text className="fw-semibold" style={{ color: "var(--bt-text)" }}>
            <i className="bi bi-piggy-bank-fill me-2" style={{ color: "var(--bt-be-light)" }} />
            {m.ref_pension_nav_title()}
          </Navbar.Text>
          <Link to="/reference/salary-split" style={{ textDecoration: "none" }} className="ms-3">
            <span className="text-light small opacity-75">
              <i className="bi bi-book me-1" />
              {m.ref_pension_nav_ss_link()}
            </span>
          </Link>
          <Button
            variant="outline-light"
            size="sm"
            className="ms-3"
            onClick={() => {
              const nextLocale = locale === "en" ? "nl" : "en";
              setLocale(nextLocale, { reload: false });
              setLocaleState(nextLocale);
            }}
            aria-label={nextLangLabel}
          >
            {nextLangLabel}
          </Button>
        </Container>
      </Navbar>

      <Container fluid="lg" className="pb-5">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="text-center mb-5 mt-2">
          <h1 className="mb-2" style={{ fontFamily: "var(--bt-font-display)", fontSize: "2.4rem" }}>
            🇧🇪&thinsp;🇳🇱&nbsp; {m.ref_pension_hero_title()}
          </h1>
          <p style={{ color: "var(--bt-text-sub)", maxWidth: 640, margin: "0 auto" }}>
            {m.ref_pension_hero_subtitle()}
          </p>
        </div>

        {/* ── 3-pijler overzicht ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s1_title()} icon="bi-layers-fill" accent="neutral">
          <Row className="g-3">
            {[
              {
                pijler: "1e pijler",
                nl: "AOW (ouderdom) + ANW (overlijden)",
                be: "Wettelijk rustpensioen + overlevingspensioen",
                color: "var(--bt-info)",
              },
              {
                pijler: "2e pijler",
                nl: "Aanvullend pensioen via werkgever / bedrijfstak",
                be: "Aanvullend pensioen (groepsverzekering, IPT…)",
                color: "var(--bt-success)",
              },
              {
                pijler: "3e pijler",
                nl: "Eigen voorziening (lijfrente, pensioensparen)",
                be: "Pensioensparen, levensverzekering",
                color: "var(--bt-warning)",
              },
            ].map(({ pijler, nl, be, color }) => (
              <Col md={4} key={pijler}>
                <div
                  className="p-3 rounded h-100"
                  style={{
                    background: "var(--bt-surface-3)",
                    border: `1px solid ${color}40`,
                  }}
                >
                  <div
                    className="fw-bold mb-2 small"
                    style={{ color, textTransform: "uppercase", letterSpacing: "0.05em" }}
                  >
                    {pijler}
                  </div>
                  <div className="mb-2">
                    <NlBadge>🇳🇱 NL</NlBadge>{" "}
                    <span className="small" style={{ color: "var(--bt-text-sub)" }}>
                      {nl}
                    </span>
                  </div>
                  <div>
                    <BeBadge>🇧🇪 BE</BeBadge>{" "}
                    <span className="small" style={{ color: "var(--bt-text-sub)" }}>
                      {be}
                    </span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          <WarnBox>
            <strong>
              {locale === "en" ? "Term confusion:" : "Begripsverwarring:"}
            </strong>{" "}
            {locale === "en"
              ? `"Pension" in the Netherlands = supplementary to AOW (2nd pillar). "Pension" in Belgium = the statutory pension. Don't confuse this when talking to HR or pension funds.`
              : `"Pensioen" in Nederland = aanvullend op AOW (2e pijler). "Pensioen" in België = het wettelijk pensioen. Niet verwarren bij gesprekken met HR of pensioenfondsen.`}
          </WarnBox>
        </SectionCard>

        <Row className="g-4">
          <Col lg={6}>
            {/* ── AOW ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_aow()} icon="bi-flag-fill" accent="nl">
              <StatRow label="Opbouw per verzekerd jaar" value="2%" />
              <StatRow label="Volledige AOW" value="50 jaar = 100%" />
              <StatRow
                label="Premie 2026"
                value="17,9%"
                sub="over max €38.883, vervat in loonheffing"
              />
              <StatRow label="AOW-leeftijd 2024–2027" value="67 jaar" highlight />
              <StatRow label="AOW-leeftijd 2028–2031" value="67 jaar 3 maanden" />
              <StatRow label="Regeerakkoord (toekomst)" value="70 jaar…" />
              <StatRow label="Uitvoering" value="Sociale Verzekeringsbank (SVB)" />
              <StatRow label="Betaling" value="24e van de maand" />

              <div
                className="mt-4 mb-2 small fw-semibold"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_max_amounts()}
              </div>
              <Table size="sm" style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_type()}</th>
                    <th>{m.ref_table_pct()}</th>
                    <th>{m.ref_table_gross_monthly()}</th>
                    <th>{m.ref_table_holiday_pay()}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Ongehuwd / alleenstaand</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-nl-light)" }}>
                      70%
                    </td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>€1.637,57</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>€106,55 × 12</td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Gehuwd / samenwonend</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-nl-light)" }}>
                      50%
                    </td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>€1.122,12</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>€76,10 × 12</td>
                  </tr>
                </tbody>
              </Table>

              <div
                className="mt-3 p-3 rounded"
                style={{ background: "var(--bt-surface-3)", border: "1px solid var(--bt-border)" }}
              >
                <div className="small fw-semibold mb-2" style={{ color: "var(--bt-text-muted)" }}>
                  {m.ref_pension_example_30yr()}
                </div>
                <StatRow label="Opgebouwde AOW" value="60%" sub="30 × 2%" />
                <StatRow label="Alleenstaand" value="±€982/mnd" sub="+ vakantiegeld mei" />
                <StatRow label="Gehuwd" value="±€673/mnd" sub="+ vakantiegeld mei" />
              </div>

              <div className="mt-3">
                <TipBox>
                  <strong>Partner meeverzekeren:</strong> Echtgeno(o)t(e) zonder inkomen bouwt mee
                  AOW op — aanmelden bij SVB <strong>binnen het jaar</strong> na aanvang arbeid in
                  Nederland.
                </TipBox>
                <TipBox>
                  AOW aanvragen: via gemeente → FPD → SVB, of via{" "}
                  <strong>pensioenaanvraag.be</strong> of tel. 1765. Uiterlijk{" "}
                  <strong>8 maanden</strong> voor ingangsdatum. Tijdvakken controleren op{" "}
                  <strong>mijnsvb.nl</strong> (DigiD of Belgische eID).
                </TipBox>
              </div>

              <Accordion flush className="mt-2">
                <Accordion.Item
                  eventKey="aow-history"
                  style={{
                    background: "var(--bt-surface-3)",
                    border: "1px solid var(--bt-border)",
                  }}
                >
                  <Accordion.Header>
                    <span className="small fw-semibold">{m.ref_pension_aow_history()}</span>
                  </Accordion.Header>
                  <Accordion.Body style={{ background: "var(--bt-surface-3)" }}>
                    <Table size="sm" style={{ fontSize: "0.78rem", color: "var(--bt-text-sub)" }}>
                      <tbody>
                        {[
                          ["2012", "65 jaar"],
                          ["2013", "65 jaar + 1 maand"],
                          ["2014–2015", "65j + 2–3 maanden"],
                          ["2016", "65 jaar + 6 maanden"],
                          ["2017", "65 jaar + 9 maanden"],
                          ["2018", "66 jaar"],
                          ["2019–2021", "66 jaar + 4 maanden"],
                          ["2022", "66 jaar + 7 maanden"],
                          ["2023", "66 jaar + 10 maanden"],
                          ["2024–2027", "67 jaar"],
                          ["2028–2031", "67 jaar + 3 maanden"],
                        ].map(([yr, age]) => (
                          <tr key={yr} style={{ borderColor: "var(--bt-border)" }}>
                            <td>{yr}</td>
                            <td style={{ fontFamily: "var(--bt-font-mono)" }}>{age}</td>
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
              <StatRow label="Uitkering bruto/mnd" value="€1.668,49" sub="70% netto minimumloon" />
              <StatRow label="Vakantiegeld" value="€128,18/mnd" />
              <StatRow label="Voorwaarden" value="< AOW-leeftijd + kind < 18j of ≥ 45% AO" />
              <StatRow
                label="Wezenuitkering"
                value="kind < 21 jaar"
                sub="bij overlijden beide ouders"
              />

              <div
                className="mt-3 small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_extra_earnings_anw()}
              </div>
              <StatRow label="Vrijgesteld" value="eerste €1.147/mnd" />
              <StatRow label="Daarboven meegerekend" value="voor 2/3" />
              <StatRow label="Geen recht meer bij inkomsten >" value="€3.617/mnd" />
              <StatRow
                label="Geen ANW bij uitkeringen >"
                value="€1.646/mnd"
                sub="WW, ZW, buitenlands pensioen enz."
              />

              <WarnBox>
                ANW eindigt bij samenwonen met een partner of als niet meer voldaan wordt aan de
                basisvoorwaarden (bijv. kind wordt 18).
              </WarnBox>
            </SectionCard>

            {/* ── Bijverdienen bij AOW ───────────────────────────── */}
            <SectionCard
              title={m.ref_pension_s_aow_work()}
              icon="bi-exclamation-diamond-fill"
              accent="nl"
            >
              <WarnBox>
                <strong>Knipperlichtsituatie:</strong> wie AOW + Belgisch pensioen + NL 2e
                pijlerpensioen ontvangt én gaat bijverdienen in Nederland, wordt opnieuw{" "}
                <strong>ziekenfondsverzekerde in NL</strong>. Gevolg:
              </WarnBox>
              <ul
                className="small mb-0"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>Wereldinkomen telt mee voor inkomensafhankelijke bijdrage ZVW</li>
                <li>Premie volksverzekeringen opnieuw verschuldigd</li>
                <li>Belastingdruk op Belgisch pensioen stijgt door progressievoorbehoud</li>
              </ul>
              <TipBox>Bijverdienen bij AOW is op zich onbeperkt toegestaan.</TipBox>
            </SectionCard>
          </Col>

          <Col lg={6}>
            {/* ── Aanvullend pensioen NL ─────────────────────────── */}
            <SectionCard
              title={m.ref_pension_s_supplementary()}
              icon="bi-building-fill"
              accent="nl"
            >
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Nederland verkozen tot{" "}
                <strong style={{ color: "var(--bt-nl-light)" }}>
                  beste pensioenstelsel ter wereld
                </strong>{" "}
                (Mercer 2025, NL #1 — BE #20).
              </p>
              <StatRow label="Pensioenpot" value="€1.300 miljard" />
              <StatRow label="Bedrijfstakpensioenfondsen" value="±200 actief" />
              <StatRow label="Afkoop mogelijk als pensioen <" value="€632/jaar" />
              <StatRow
                label="Partnerpensioen"
                value="70% van ouderdomspensioen"
                sub="kan worden uitgeruild"
              />
              <StatRow
                label="UPO (pensioenoverzicht)"
                value="jaarlijks"
                sub="aanvragen bij uitvoerder, ≥ 4 mnd op voorhand"
              />

              <TipBox>
                Pensioenopbouw raadplegen op <strong>mijnpensioenoverzicht.nl</strong> (DigiD of
                Belgische eID / Itsme). Oudere BSN? Laat sofinummer omzetten.
              </TipBox>

              <div
                className="mt-2 mb-2 small fw-semibold"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_wtp_title()}
              </div>
              <ul
                className="small mb-3"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>Eindloon- en middelloonregelingen worden afgeschaft</li>
                <li>
                  Alle regelingen worden <strong>premieregelingen</strong>
                </li>
                <li>Gelijke, leeftijdsonafhankelijke premie voor iedereen</li>
                <li>Partnerpensioen als vast percentage verzekerd</li>
                <li>
                  10% van de waarde kan als <strong>bedrag ineens</strong> opgenomen worden
                </li>
              </ul>

              <div
                className="mt-2 mb-2 small fw-semibold"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_divorce()}
              </div>
              <p className="small mb-1" style={{ color: "var(--bt-text-sub)" }}>
                Wet verevening pensioen bij scheiding: ex-partner heeft wettelijk recht op de helft
                van het opgebouwde pensioen tijdens het huwelijk.
              </p>
              <WarnBox>
                Doorgeven aan pensioenuitvoerder binnen <strong>2 jaar</strong> via
                "Mededelingsformulier verdeling ouderdomspensioen bij echtscheiding". Niet doorgeven
                = aanspraak ex-partner blijft bestaan!
              </WarnBox>
            </SectionCard>

            {/* ── RVU ────────────────────────────────────────────── */}
            <SectionCard title={m.ref_pension_s_rvu()} icon="bi-door-open-fill" accent="nl">
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Opvolger van de VUT, voor zware/fysiek belastende beroepen.
              </p>
              <StatRow label="Maximum RVU-bedrag 2026" value="€2.357/mnd" highlight />
              <StatRow label="Vroegst mogelijk" value="36 maanden voor AOW-leeftijd" />
              <StatRow label="Uitbetaling" value="periodiek of bedrag ineens" />
              <ul
                className="small mt-3 mb-0"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>
                  Werknemer neemt zelf ontslag → <strong>geen recht op WW</strong>
                </li>
                <li>Combinatie met Belgisch rustpensioen toegestaan</li>
                <li>Combinatie met naar voren gehaald 2e pijlerpensioen toegestaan</li>
                <li>Terugkeren naar werk in principe verboden</li>
              </ul>
              <TipBox>
                <strong>Belasting RVU:</strong> belastbaar in België (woonland), tenzij je ambtenaar
                bent geweest met NL nationaliteit. Niet vergeten: vrijstelling loonbelasting
                aanvragen!
              </TipBox>
            </SectionCard>

            {/* ── Inhoudingen op pensioen ────────────────────────── */}
            <SectionCard
              title={m.ref_pension_s_deductions()}
              icon="bi-dash-circle-fill"
              accent="nl"
            >
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Als postactief grensarbeider (wonen BE, pensioen uit NL):
              </p>
              <StatRow label="Zorgverzekering" value="via CAK (niet meer zorgverzekeraar)" />
              <StatRow label="Verdragsbijdrage woonlandfactor 2026" value="0,8165" />
              <StatRow label="Inkomensafh. bijdrage ZVW" value="4,85%" sub="over max €79.409" />
              <StatRow label="Nominale bijdrage" value="€128,19/mnd" />
              <StatRow label="WLZ-premie" value="9,65%" sub="over max €38.883" />
              <TipBox>Recht op zorg in zowel Nederland als België blijft behouden.</TipBox>
            </SectionCard>
          </Col>
        </Row>

        {/* ── Belgisch rustpensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_be()} icon="bi-flag-fill" accent="be">
          <Row className="g-4">
            <Col md={4}>
              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_be_params()}
              </div>
              <StatRow
                label="Wettelijke pensioenleeftijd"
                value="66 jaar"
                sub="vanaf 2030: 67 jaar"
                highlight
              />
              <StatRow
                label="Volledige loopbaan"
                value="14.040 dagen"
                sub="104 dagen = 1 loopbaanjaar"
              />
              <StatRow label="Vroegst mogelijk" value="60 jaar" sub="bij 44 loopbaanjaren" />
              <StatRow label="Loonplafond opbouw" value="€82.608/jaar" />
              <StatRow label="Max. bruto pensioen gezin" value="€4.077/mnd" highlight />
              <StatRow label="Max. bruto pensioen alleenstaand" value="€3.262/mnd" highlight />
              <StatRow label="Aanvraag mogelijk" value="12 mnd op voorhand" />
              <StatRow label="Geen terugwerkende kracht" value="= dag van aanvraag" />

              <WarnBox>
                Geen automatisch onderzoek bij einde loopbaan in Nederland. Aanvraag doen is
                verplicht als je vóór 66 jaar wil gaan.
              </WarnBox>
            </Col>

            <Col md={4}>
              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_be_earliest()}
              </div>
              <Table size="sm" style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_age()}</th>
                    <th>{m.ref_table_career()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["60 jaar", "44 loopbaanjaren"],
                    ["61 of 62 jaar", "43 loopbaanjaren"],
                    ["63 of 64 jaar", "42 loopbaanjaren"],
                  ].map(([age, career]) => (
                    <tr key={age} style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                      >
                        {age}
                      </td>
                      <td style={{ color: "var(--bt-text-sub)" }}>{career}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <TipBox>
                NL gewerkte jaren tellen mee voor de Belgische loopbaaneis.{" "}
                <strong>104 dagen in 1 jaar</strong> = 1 volledig loopbaanjaar (t/m 2026).
              </TipBox>
            </Col>

            <Col md={4}>
              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_be_ziv()}
              </div>
              <p className="small mb-2" style={{ color: "var(--bt-text-sub)" }}>
                <strong>Alleenstaande</strong> (3,55% inhouding):
              </p>
              <Table size="sm" style={{ fontSize: "0.78rem", color: "var(--bt-text)" }}>
                <tbody>
                  {[
                    ["< €2.078,46/mnd", "Geen inhouding"],
                    ["€2.078,46 – €2.154,94", "Progressief (bruto − €2.078,45)"],
                    ["> €2.154,94/mnd", "3,55% van brutobedrag"],
                  ].map(([range, rule]) => (
                    <tr key={range} style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{
                          fontFamily: "var(--bt-font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--bt-be-light)",
                        }}
                      >
                        {range}
                      </td>
                      <td style={{ color: "var(--bt-text-sub)" }}>{rule}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="small mt-3 mb-2" style={{ color: "var(--bt-text-sub)" }}>
                <strong>Gezinshoofd</strong> (3,55% inhouding):
              </p>
              <Table size="sm" style={{ fontSize: "0.78rem", color: "var(--bt-text)" }}>
                <tbody>
                  {[
                    ["< €2.463,25/mnd", "Geen inhouding"],
                    ["€2.463,25 – €2.553,89", "Progressief (bruto − €2.463,24)"],
                    ["> €2.553,89/mnd", "3,55% van brutobedrag"],
                  ].map(([range, rule]) => (
                    <tr key={range} style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{
                          fontFamily: "var(--bt-font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--bt-be-light)",
                        }}
                      >
                        {range}
                      </td>
                      <td style={{ color: "var(--bt-text-sub)" }}>{rule}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <WarnBox>
                AOW + Belgisch pensioen worden <strong>samengeteld</strong> voor de ZIV-drempel. Ook
                solidariteitsbijdrage: 0,5–2% bij pensioen &gt; €3.682 (alleenstaand) / €4.212
                (gezin).
              </WarnBox>
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
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Loopbaaneis per jaar stijgt van <strong>104 → 156 effectieve werkdagen</strong>{" "}
                (uitzondering: 1e loopbaanjaar + 5 reservedagen).
              </p>
              <Table size="sm" style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_age()}</th>
                    <th>{m.ref_table_career_156()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["60 jaar", "44 loopbaanjaren"],
                    ["60 jaar", "42 jr + 234 eff. werkdagen"],
                    ["61 jaar", "43 loopbaanjaren"],
                    ["62 jaar", "43 loopbaanjaren"],
                    ["63 jaar", "42 loopbaanjaren"],
                    ["64 jaar", "42 loopbaanjaren"],
                    ["65 jaar", "42 loopbaanjaren"],
                  ].map((row) => {
                    const [age, career] = row;
                    return (
                      <tr
                        key={String(age) + String(career)}
                        style={{ borderColor: "var(--bt-border)" }}
                      >
                        <td
                          style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                        >
                          {age}
                        </td>
                        <td style={{ color: "var(--bt-text-sub)" }}>{career}</td>
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
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Van toepassing als <strong>niet voldaan</strong> aan: 35 jaar × minstens 156 dagen +
                totaal 7.020 gepresteerde/gelijkgestelde dagen.
              </p>
              <Table size="sm" style={{ fontSize: "0.85rem", color: "var(--bt-text)" }}>
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_birth_year()}</th>
                    <th>{m.ref_table_malus_per_year()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1961–1965", "2%"],
                    ["1966–1974", "4%"],
                    ["1975 en later", "5%"],
                  ].map(([yr, malus]) => (
                    <tr key={yr} style={{ borderColor: "var(--bt-border)" }}>
                      <td style={{ color: "var(--bt-text-sub)" }}>{yr}</td>
                      <td
                        style={{
                          fontFamily: "var(--bt-font-mono)",
                          color: "var(--bt-danger)",
                          fontWeight: 700,
                        }}
                      >
                        {malus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </SectionCard>
          </Col>

          <Col md={4}>
            <SectionCard title={m.ref_pension_s_bonus()} icon="bi-arrow-up-circle-fill" accent="be">
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Voor wie <strong>langer werkt</strong> dan wettelijke pensioenleeftijd. Vereist:
                loopbaan ≥ 35 jaar + 7.020 dagen.
              </p>
              <Table size="sm" style={{ fontSize: "0.85rem", color: "var(--bt-text)" }}>
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_birth_year()}</th>
                    <th>{m.ref_table_bonus_per_year()}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1962 of vroeger", "2%"],
                    ["1963–1972", "4%"],
                    ["1973 en later", "5%"],
                  ].map(([yr, bonus]) => (
                    <tr key={yr} style={{ borderColor: "var(--bt-border)" }}>
                      <td style={{ color: "var(--bt-text-sub)" }}>{yr}</td>
                      <td
                        style={{
                          fontFamily: "var(--bt-font-mono)",
                          color: "var(--bt-success)",
                          fontWeight: 700,
                        }}
                      >
                        {bonus}
                      </td>
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
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Wie lang in Nederland heeft gewerkt, staat voor een specifiek probleem:
              </p>
              <ul
                className="small mb-3"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>
                  Belgische pensioenleeftijd: <strong>66 jaar</strong> (2026), maar AOW-leeftijd:{" "}
                  <strong>67 jaar</strong>
                </li>
                <li>Lange NL-loopbaan → gering Belgisch pensioen, vervroeging AOW onmogelijk</li>
                <li>Belgische werkloosheidsuitkering stopt in principe op 66 jaar</li>
              </ul>

              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_art64()}
              </div>
              <p className="small mb-2" style={{ color: "var(--bt-text-sub)" }}>
                Werkloosheidsuitkering kan doorlopen tot AOW-leeftijd als:
              </p>
              <ol
                className="small mb-0"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>
                  Minstens <strong>15 jaar grensarbeid</strong> bewezen
                </li>
                <li>
                  Géén pensioen ontvangen: tijdelijk afzien van Belgisch rustpensioen <em>én</em> 2e
                  pijlerpensioen niet laten ingaan
                </li>
              </ol>
              <WarnBox>
                Regeling dekt niet alle gevallen: wie geen 15 jaar grensarbeid bewijst, of wiens 2e
                pijlerpensioen niet uitgesteld kan worden, valt buiten de regeling.
              </WarnBox>
            </SectionCard>
          </Col>

          <Col md={6}>
            <SectionCard title={m.ref_pension_s_border()} icon="bi-archive-fill" accent="be">
              <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Het "grensarbeiderspensioen" berekende een Belgisch pensioen alsof men in België had
                gewerkt en paste het verschil bij. Inmiddels sterk ingeperkt:
              </p>
              <ul
                className="small mb-3"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>
                  <strong>Geen nieuwe instroom</strong> meer voor grensarbeiders die na{" "}
                  <strong>1 januari 2015</strong> voor het eerst grensarbeider worden
                </li>
                <li>
                  Vervroegde ingangsdatum niet meer mogelijk — onderzoek gelijk met wettelijke
                  pensioenleeftijd werkland
                </li>
                <li>
                  Niet alleen wettelijk NL pensioen (AOW) wordt afgetrokken, ook{" "}
                  <strong>bovenwettelijk (2e pijler)</strong>
                </li>
                <li>
                  Overlevingspensioen t.l.v. BE blijft, maar ook met aftrek ANW en 2e pijlerpensioen
                </li>
                <li>
                  <strong>Bestaande rechten (vóór 2015) zijn vastgeklikt</strong>
                </li>
              </ul>
              <TipBox>
                Begon je met grensarbeid vóór 1/1/2015? Controleer bij FPD of je rechten op het
                grensarbeiderspensioen behouden zijn.
              </TipBox>
            </SectionCard>
          </Col>
        </Row>

        {/* ── Overlevingspensioen BE ───────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_survivor()} icon="bi-heart-fill" accent="be">
          <Row className="g-3">
            <Col md={6}>
              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_conditions()}
              </div>
              <ul className="small" style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}>
                <li>
                  Rechthebbende in 2026: minstens <strong>51 jaar</strong>
                </li>
                <li>
                  Minstens <strong>1 jaar gehuwd</strong>
                </li>
                <li>Automatische berekening als overledene al met pensioen was</li>
                <li>Zo niet: aanvraag doen</li>
                <li>
                  Recht vervalt bij <strong>nieuw huwelijk</strong>
                </li>
                <li>Combinatie met NL ANW / 2e pijlerpensioen is mogelijk</li>
              </ul>
            </Col>
            <Col md={6}>
              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_special_situations()}
              </div>
              <ul
                className="small mb-0"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>
                  Jonger dan 51: <strong>overgangsuitkering</strong> (beperkt in tijd)
                </li>
                <li>
                  Gedurende max <strong>12 maanden</strong>: combinatie met vervangingsinkomen
                  mogelijk
                </li>
              </ul>
            </Col>
          </Row>
        </SectionCard>

        {/* ── Arbeidsongeschiktheid & AOW ──────────────────────────── */}
        <SectionCard title={m.ref_pension_s_disability()} icon="bi-bandaid-fill" accent="nl">
          <Row className="g-3">
            <Col md={6}>
              <p className="small mb-2" style={{ color: "var(--bt-text-sub)" }}>
                Bij <strong>WAO/WIA uitkering</strong>: niet meer automatisch verzekerd voor
                ouderdom &amp; overlijden.
              </p>
              <ul className="small" style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}>
                <li>
                  <strong>AOW vrijwillige verzekering</strong> afsluiten bij SVB —{" "}
                  <strong>binnen het jaar</strong> na toekenning WIA/WAO
                </li>
                <li>
                  Of: <strong>regularisatiebijdragen</strong> betalen aan Federale Pensioendienst
                  (BE) — af te sluiten <strong>binnen 3 jaar</strong>
                </li>
              </ul>
            </Col>
            <Col md={6}>
              <p className="small mb-2" style={{ color: "var(--bt-text-sub)" }}>
                Bij <strong>pro rata uitkering</strong> (gewerkt in meerdere landen):
              </p>
              <ul
                className="small mb-0"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>Belgische wachttijd: 180 dagen gewerkt in 12 mnd vóór 1e ziektedag</li>
                <li>Bij pro rata uitkering: Belgische pensioenopbouw loopt gewoon door</li>
                <li>Samenloop BE invaliditeitsuitkering: Belgisch recht primeert</li>
              </ul>
            </Col>
          </Row>
        </SectionCard>

        {/* ── Belasting op pensioen ────────────────────────────────── */}
        <SectionCard title={m.ref_pension_s_tax()} icon="bi-receipt-cutoff" accent="neutral">
          <p className="small mb-3" style={{ color: "var(--bt-text-sub)" }}>
            Hoofdregel verdrag BE–NL voor postactieve grensarbeiders: belasting in het{" "}
            <strong>woonland (België)</strong>.
          </p>
          <Row className="g-3">
            <Col md={6}>
              <div
                className="small fw-semibold mb-2"
                style={{
                  color: "var(--bt-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.ref_pension_exception_nl()}
              </div>
              <ul
                className="small mb-0"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>ABP-pensioen (ambtenaar) mits NL nationaliteit</li>
                <li>WAO/WIA in samenloop met nog uitgeoefende dienstbetrekking</li>
                <li>Nawerking 1 jaar bij gedeeltelijke AO (WGA) + dienstbetrekking loopt nog</li>
                <li>Bovenwettelijke aanvullingen die geen overbrugging naar pensioen zijn</li>
              </ul>
            </Col>
            <Col md={6}>
              <TipBox>
                <strong>RVU:</strong> belastbaar in België tenzij ambtenaar met NL nationaliteit. In
                aangifte op te geven als "opzegvergoeding". Vrijstelling loonbelasting niet vergeten
                aan te vragen!
              </TipBox>
              <TipBox>
                <strong>AOW altijd belastbaar in België</strong> (woonland). 2e pijlerpensioen ook,
                tenzij ambtenaar met uitsluitend NL nationaliteit.
              </TipBox>
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
            style={{ textDecoration: "none" }}
          >
            <div
              className="p-3 rounded d-flex align-items-center gap-3"
              style={{
                background: "var(--bt-surface-3)",
                border: "1px solid var(--bt-border)",
                transition: "border-color 0.15s",
                cursor: "pointer",
                maxWidth: 480,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--bt-border-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--bt-border)")
              }
            >
              <i
                className="bi bi-file-earmark-pdf-fill fs-2"
                style={{ color: "#e74c3c", flexShrink: 0 }}
              />
              <div>
                <div className="fw-semibold small" style={{ color: "var(--bt-text)" }}>
                  ACV Infosessie Grensarbeiders &amp; Pensioen
                </div>
                <div style={{ color: "var(--bt-text-muted)", fontSize: "0.75rem" }}>
                  Presentatie 24 maart 2026, Pelt · 47 slides
                </div>
              </div>
              <i
                className="bi bi-box-arrow-up-right ms-auto"
                style={{ color: "var(--bt-text-muted)", fontSize: "0.8rem" }}
              />
            </div>
          </a>
        </SectionCard>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer
          className="text-center small py-3 mt-2"
          style={{ color: "var(--bt-text-muted)", borderTop: "1px solid var(--bt-border)" }}
        >
          {m.ref_pension_footer()}&nbsp;|&nbsp;
          <a
            href="https://www.acvgrensarbeiders.be"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--bt-info)" }}
          >
            acvgrensarbeiders.be
          </a>
        </footer>
      </Container>
    </>
  );
}
