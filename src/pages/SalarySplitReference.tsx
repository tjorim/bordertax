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

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="p-3 rounded mb-0"
      style={{
        background: "var(--bt-surface-4)",
        border: "1px solid var(--bt-border)",
        fontFamily: "var(--bt-font-mono)",
        fontSize: "0.85rem",
        color: "var(--bt-text)",
        overflowX: "auto",
      }}
    >
      {children}
    </pre>
  );
}

function ExampleBlock({
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

export default function SalarySplitReference() {
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
            <i className="bi bi-book-fill me-2" style={{ color: "var(--bt-be-light)" }} />
            {m.ref_ss_nav_title()}
          </Navbar.Text>
          <Link to="/reference/pension" style={{ textDecoration: "none" }} className="ms-3">
            <span className="text-light small opacity-75">
              <i className="bi bi-piggy-bank me-1" />
              {m.ref_ss_nav_pension_link()}
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
            🇧🇪&thinsp;🇳🇱&nbsp; {m.ref_ss_hero_title()}
          </h1>
          <p style={{ color: "var(--bt-text-sub)", maxWidth: 620, margin: "0 auto" }}>
            {m.ref_ss_hero_subtitle()}
          </p>
        </div>

        {/* ── Alert: geen neutralisatieregeling ─────────────────── */}
        <WarnBox>
          <strong>{m.ref_ss_tax_vs_ss_title()}</strong>{" "}
          {m.ref_ss_tax_vs_ss_body()}
        </WarnBox>

        <Row className="g-4">
          <Col lg={7}>
            {/* ── 1. Hoofdregel ──────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s1_title()} icon="bi-flag-fill" accent="neutral">
              <p className="mb-3" style={{ color: "var(--bt-text-sub)" }}>
                Op basis van het dubbelbelastingverdrag BE–NL geldt:
              </p>
              <Formula>
                {`Thuiswerkdag in België  →  heffingsrecht: BELGIË
Kantoordag in Nederland →  heffingsrecht: NEDERLAND`}
              </Formula>
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <TipBox>
                  <strong>20%-regel:</strong> Werk je meer dan 20% van een dag thuis, dan telt die
                  dag als een <em>volledige</em> thuiswerkdag voor de Belgische belasting.
                </TipBox>
              </div>
              <TipBox>
                <strong>Veilige verhouding: 60/40</strong> — 60% kantoor (NL) / 40% thuis (BE) is in
                principe "safe": je behoudt het recht op hypotheekrenteaftrek in Nederland (minstens
                90% NL-inkomen vereist).
              </TipBox>
              <WarnBox>
                Verlies je de "kwalificatie" (minder dan 90% NL), dan valt de hypotheekrenteaftrek
                weg in NL. Eventueel nog te benutten via woonbonus (BE, lening vóór 2020).
              </WarnBox>
            </SectionCard>

            {/* ── 2. Dagentelling ────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s2_title()} icon="bi-calendar3" accent="neutral">
              <p style={{ color: "var(--bt-text-sub)" }} className="mb-3">
                Nederland en België hanteren een <strong>verschillende methode</strong> voor het
                berekenen van de tijdsevenredige verdeling.
              </p>
              <Table
                responsive
                className="mb-3"
                style={{ fontSize: "0.875rem", color: "var(--bt-text)" }}
              >
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_component()}</th>
                    <th>
                      <NlBadge>🇳🇱 Nederland</NlBadge>
                    </th>
                    <th>
                      <BeBadge>🇧🇪 België</BeBadge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Noemer (basis)",
                      "Kalender − weekends − feestdagen − vakantie",
                      "Idem, maar ÓÓK min ziektedagen",
                    ],
                    [
                      "Teller (NL-deel)",
                      "Noemer − thuiswerkdagen (BE)",
                      "Idem (NL-deel na aftrek zieke dagen)",
                    ],
                    ["Ziektedagen", "In noemer behouden", "Uit zowel teller als noemer verwijderd"],
                    ["Effect ziektedagen", "Neutral", "BE-aandeel stijgt (zie ⚠️ hieronder)"],
                  ].map(([comp, nl, be]) => (
                    <tr key={comp} style={{ borderColor: "var(--bt-border)" }}>
                      <td style={{ color: "var(--bt-text-sub)", fontWeight: 500 }}>{comp}</td>
                      <td>{nl}</td>
                      <td>{be}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <WarnBox>
                <strong>Ziektedagen verhogen je Belgische belastingaandeel.</strong> Stel: 50
                thuiswerkdagen, 25 ziektedagen → NL-breuk daalt van 180/230 naar 155/205. Het deel
                belastbaar in België stijgt hierdoor proportioneel. Mogelijkheid op dubbele heffing!
              </WarnBox>
              <TipBox>
                Aangifte volgorde: <strong>eerst NL aangifte indienen</strong>, dan de BE aangifte
                berekenen op basis van de werkelijk verschuldigde bedragen.
              </TipBox>
            </SectionCard>

            {/* ── 3. FOD Berekeningsformule ──────────────────────── */}
            <SectionCard title={m.ref_ss_s3_title()} icon="bi-calculator-fill" accent="be">
              <p style={{ color: "var(--bt-text-sub)" }} className="mb-3">
                De FOD Financiën hanteert volgende 3-stappen methode voor de Belgische aangifte bij
                een salary split:
              </p>
              <Formula>
                {`STAP 1 — W (grondslag)
  W = NL fiscaal loon (jaaropgave)
    − werkelijk verschuldigde premies volksverzekeringen (NL SZ)
    − werkelijk verschuldigde inkomstenbelasting (na NL teruggaaf)
    + werknemersdeel pensioenpremie bedrijfspensioen  [code 1285]
    − bijtelling bedrijfswagen (NL normen)
    + bijtelling bedrijfswagen (BE normen)
    + fiscaal uitgeruild brutoloon (cafetariaregeling)

STAP 2 — Y (belastbaar in België)
  Y = W × (dagen gepresteerd in BE ÷ totaal gepresteerde dagen)

STAP 3 — Z (vrij te stellen in België)
  Z = W − Y − [NL belasting × (NL dagen ÷ totaal dagen)]`}
              </Formula>
              <div className="mt-3">
                <p className="mb-2 small" style={{ color: "var(--bt-text-sub)" }}>
                  {m.ref_ss_be_codes_title()}
                </p>
                <Table size="sm" style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                  <tbody>
                    <tr style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                      >
                        1250 / 2250
                      </td>
                      <td>Totaal buitenlands beroepsinkomen (= W, tijdsevenredig)</td>
                    </tr>
                    <tr style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                      >
                        Vak IV O.1
                      </td>
                      <td>Niet vrij te stellen deel (= Y, belastbaar in BE)</td>
                    </tr>
                    <tr style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                      >
                        Vak IV O.2
                      </td>
                      <td>Vrij te stellen deel met progressievoorbehoud (= Z)</td>
                    </tr>
                    <tr style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                      >
                        *254 / *255
                      </td>
                      <td>Reiskosten aftrek / vrijstelling</td>
                    </tr>
                    <tr style={{ borderColor: "var(--bt-border)" }}>
                      <td
                        style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-be-light)" }}
                      >
                        *257
                      </td>
                      <td>Nominale premie NL zorgverzekering + overige aftrekposten</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              <WarnBox>
                <strong>Geen tool beschikbaar.</strong> FOD Financiën voorziet géén hulpmiddel voor
                de BE aangifte bij salary split. Enige leidraad:{" "}
                <a
                  href="https://financien.belgium.be/nl/particulieren/buitenland/motiv"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--bt-info)" }}
                >
                  MOTIV (fgov.be)
                </a>
                . Overweeg een fiscalist.
              </WarnBox>
            </SectionCard>
          </Col>

          <Col lg={5}>
            {/* ── 4. NL Belastingtarieven 2026 ──────────────────── */}
            <SectionCard title={m.ref_ss_s4_title()} icon="bi-percent" accent="nl">
              <Table size="sm" responsive style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                <thead style={{ background: "var(--bt-surface-3)" }}>
                  <tr>
                    <th>{m.ref_table_bracket()}</th>
                    <th>{m.ref_table_rate()}</th>
                    <th>{m.ref_table_buildup()}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>€0 – €38.883</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-nl-light)" }}>
                      35,75%
                    </td>
                    <td style={{ color: "var(--bt-text-sub)" }}>27,65% VV + 8,10% LB</td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>€38.883 – €78.426</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-nl-light)" }}>
                      37,56%
                    </td>
                    <td style={{ color: "var(--bt-text-sub)" }}>enkel loonbelasting</td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>boven €78.426</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-nl-light)" }}>
                      49,50%
                    </td>
                    <td style={{ color: "var(--bt-text-sub)" }}>enkel loonbelasting</td>
                  </tr>
                </tbody>
              </Table>
              <p className="mt-3 mb-2 small" style={{ color: "var(--bt-text-sub)" }}>
                {m.ref_ss_heffingskortingen_title()}
              </p>
              <Table size="sm" style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                <tbody>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Algemene heffingskorting</td>
                    <td
                      style={{
                        fontFamily: "var(--bt-font-mono)",
                        color: "var(--bt-success)",
                        textAlign: "right",
                      }}
                    >
                      max €3.115
                    </td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td
                      style={{
                        color: "var(--bt-text-sub)",
                        paddingLeft: "1rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      Vervalt bij inkomen &gt; €78.426
                    </td>
                    <td />
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Arbeidskorting</td>
                    <td
                      style={{
                        fontFamily: "var(--bt-font-mono)",
                        color: "var(--bt-success)",
                        textAlign: "right",
                      }}
                    >
                      max €5.685
                    </td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td
                      style={{
                        color: "var(--bt-text-sub)",
                        paddingLeft: "1rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      Nul bij inkomen ≥ €132.290
                    </td>
                    <td />
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Combinatiekorting (kind &lt;12j, laagste inkomen)</td>
                    <td
                      style={{
                        fontFamily: "var(--bt-font-mono)",
                        color: "var(--bt-success)",
                        textAlign: "right",
                      }}
                    >
                      max €3.032
                    </td>
                  </tr>
                </tbody>
              </Table>
              <p className="mt-2 small" style={{ color: "var(--bt-text-muted)" }}>
                VV = premie volksverzekeringen (max over €38.883) · LB = loonbelasting
              </p>
            </SectionCard>

            {/* ── 5. Kaderovereenkomst Telewerk (SZ) ────────────── */}
            <SectionCard title={m.ref_ss_s5_title()} icon="bi-house-check-fill" accent="neutral">
              <p style={{ color: "var(--bt-text-sub)", fontSize: "0.875rem" }} className="mb-3">
                Sociale zekerheid ≠ belasting. Voor SZ bestaat wél een regeling:
              </p>
              <Table size="sm" style={{ fontSize: "0.8rem", color: "var(--bt-text)" }}>
                <tbody>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Van kracht</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>1 juli 2023</td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Max telewerk in woonland (BE)</td>
                    <td
                      style={{
                        fontFamily: "var(--bt-font-mono)",
                        color: "var(--bt-success)",
                        fontWeight: 700,
                      }}
                    >
                      49%
                    </td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Geldigheid A1</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>3 jaar (verlengbaar)</td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Aanvraag bij</td>
                    <td>SVB (Nederland)</td>
                  </tr>
                  <tr style={{ borderColor: "var(--bt-border)" }}>
                    <td>Retroactiviteit (na 1/7/2024)</td>
                    <td style={{ fontFamily: "var(--bt-font-mono)" }}>max 3 maanden</td>
                  </tr>
                </tbody>
              </Table>
              <p className="mt-2 mb-1 small fw-semibold">{m.ref_ss_conditions()}</p>
              <ul
                className="mb-0 small"
                style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
              >
                <li>Enkel telewerk (geen andere activiteit in BE)</li>
                <li>Géén zelfstandig bijberoep in België</li>
                <li>Akkoord werknemer verplicht</li>
                <li>Limosa-melding werkgever blijft verplicht</li>
              </ul>
            </SectionCard>

            {/* ── 6. Bewijslast ─────────────────────────────────── */}
            <SectionCard title={m.ref_ss_s6_title()} icon="bi-folder2-open" accent="neutral">
              <p style={{ color: "var(--bt-text-sub)", fontSize: "0.875rem" }} className="mb-2">
                Voor België telt: bewijs dat je <strong>fysiek aanwezig was in het werkland</strong>{" "}
                (NL), niet dat je thuis werkte. Combineer meerdere bewijsmiddelen.
              </p>
              <Accordion flush>
                <Accordion.Item
                  eventKey="0"
                  style={{
                    background: "var(--bt-surface-3)",
                    border: "1px solid var(--bt-border)",
                  }}
                >
                  <Accordion.Header>
                    <span className="small fw-semibold">{m.ref_ss_strong_evidence()}</span>
                  </Accordion.Header>
                  <Accordion.Body style={{ background: "var(--bt-surface-3)", fontSize: "0.8rem" }}>
                    <ul
                      className="mb-0"
                      style={{ color: "var(--bt-text-sub)", paddingLeft: "1.2rem" }}
                    >
                      <li>Persoonlijke tijds-/aanwezigheidsregistratie (fiche)</li>
                      <li>Gedateerde vervoersdocumenten op naam (trein, bus, vliegtuig)</li>
                      <li>Brandstoffacturen (koppelen aan werkkalender)</li>
                      <li>Hotel-/huurauto-facturen op naam</li>
                      <li>Notulen vergaderingen met aanwezigheidslijst</li>
                      <li>Dienstopdrachten met naam belastingplichtige</li>
                      <li>Google Maps tijdlijn (locatiegeschiedenis)</li>
                    </ul>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item
                  eventKey="1"
                  style={{
                    background: "var(--bt-surface-3)",
                    border: "1px solid var(--bt-border)",
                    marginTop: 2,
                  }}
                >
                  <Accordion.Header>
                    <span className="small fw-semibold">{m.ref_ss_insufficient_evidence()}</span>
                  </Accordion.Header>
                  <Accordion.Body style={{ background: "var(--bt-surface-3)", fontSize: "0.8rem" }}>
                    <ul
                      className="mb-0"
                      style={{ color: "var(--bt-text-muted)", paddingLeft: "1.2rem" }}
                    >
                      <li>Arbeidsovereenkomst alleen</li>
                      <li>Loonstaten met ingehouden belasting alleen</li>
                      <li>Aanslagbiljet buitenlandse staat alleen</li>
                    </ul>
                    <p
                      className="mt-2 mb-0"
                      style={{ color: "var(--bt-text-muted)", fontSize: "0.75rem" }}
                    >
                      Bron: Vademecum fysieke aanwezigheid BE–LUX (geldt ook voor NL)
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </SectionCard>
          </Col>
        </Row>

        {/* ── 7. Worked Examples ──────────────────────────────────── */}
        <SectionCard title={m.ref_ss_s7_title()} icon="bi-calculator" accent="be">
          <p style={{ color: "var(--bt-text-sub)", fontSize: "0.875rem" }} className="mb-3">
            Grensarbeider, voltijds, 4 dagen/week NL + 1 dag/week thuis (BE). Jaar 2025. 6
            feestdagen, 25 vakantiedagen, 50 thuiswerkdagen. Fiscaal loon €53.299.
          </p>
          <Row className="g-3">
            {/* Basisdata */}
            <Col md={4}>
              <div
                className="p-3 rounded h-100"
                style={{
                  background: "var(--bt-surface-3)",
                  border: "1px solid var(--bt-border)",
                }}
              >
                <h6
                  className="mb-3 small fw-semibold"
                  style={{
                    color: "var(--bt-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {m.ref_ss_base_data()}
                </h6>
                <ExampleBlock label="Fiscaal loon NL" value="€53.299" />
                <ExampleBlock label="Ingehouden loonheffing" value="€12.902" />
                <ExampleBlock label="Onbelaste reiskosten" value="€3.889" />
                <ExampleBlock label="Nominale premie zorgverzekering" value="€1.560" />
                <ExampleBlock label="Werkdagen NL (breuk NL)" value="181 / 231" />
                <ExampleBlock label="Werkdagen BE (thuiswerk)" value="50" />
                <ExampleBlock label="Breuk BE (zonder ziekte)" value="180 / 230" />
              </div>
            </Col>

            {/* Scenario A: geen ziektedagen */}
            <Col md={4}>
              <div
                className="p-3 rounded h-100"
                style={{
                  background: "var(--bt-surface-3)",
                  border: "1px solid var(--bt-nl-border)",
                }}
              >
                <h6
                  className="mb-3 small fw-semibold"
                  style={{
                    color: "var(--bt-nl-light)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  🇳🇱 Scenario A — geen ziektedagen
                </h6>
                <ExampleBlock
                  label="NL belastbaar (181/231)"
                  value="€41.763"
                  sub="53.299 × 181/231"
                />
                <ExampleBlock label="BE deel (bruto)" value="€11.536" sub="53.299 × 50/231" />
                <ExampleBlock label="NL teruggaaf" value="€4.314" highlight />
                <div
                  className="mt-3"
                  style={{ borderTop: "1px solid var(--bt-border)", paddingTop: "0.75rem" }}
                >
                  <h6
                    className="mb-2 small fw-semibold"
                    style={{
                      color: "var(--bt-be-light)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {m.ref_ss_be_declaration()}
                  </h6>
                  <ExampleBlock
                    label="W (grondslag)"
                    value="€44.711"
                    sub="53.299 − (12.902 − 4.314)"
                  />
                  <ExampleBlock label="Y — niet vrij te stellen (O.1)" value="€10.310" />
                  <ExampleBlock label="Z — vrij te stellen (O.2)" value="€34.401" />
                  <ExampleBlock label="BE te betalen" value="€3.277" highlight />
                </div>
                <div
                  className="mt-3 p-2 rounded text-center"
                  style={{
                    background: "var(--bt-success-dim)",
                    border: "1px solid rgba(34,197,94,0.25)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--bt-success)",
                      fontFamily: "var(--bt-font-mono)",
                      fontWeight: 700,
                    }}
                  >
                    Netto voordeel: +€1.037
                  </span>
                  <div style={{ color: "var(--bt-text-muted)", fontSize: "0.75rem" }}>
                    teruggaaf €4.314 − BE €3.277
                  </div>
                </div>
              </div>
            </Col>

            {/* Scenario B: 25 ziektedagen */}
            <Col md={4}>
              <div
                className="p-3 rounded h-100"
                style={{
                  background: "var(--bt-surface-3)",
                  border: "1px solid var(--bt-be-border)",
                }}
              >
                <h6
                  className="mb-3 small fw-semibold"
                  style={{
                    color: "var(--bt-warning)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  ⚠️ Scenario B — 25 ziektedagen
                </h6>
                <ExampleBlock
                  label="Breuk NL (BE aangifte)"
                  value="155 / 205"
                  sub="breuk daalt: 180−25 / 230−25"
                />
                <ExampleBlock
                  label="BE aandeel stijgt"
                  value="50/205 = 24,4%"
                  sub="vs 50/230 = 21,7% zonder ziek"
                />
                <ExampleBlock label="NL teruggaaf" value="€4.314" sub="ongewijzigd" />
                <div
                  className="mt-3"
                  style={{ borderTop: "1px solid var(--bt-border)", paddingTop: "0.75rem" }}
                >
                  <h6
                    className="mb-2 small fw-semibold"
                    style={{
                      color: "var(--bt-be-light)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {m.ref_ss_be_declaration()}
                  </h6>
                  <ExampleBlock label="W (grondslag)" value="€44.711" sub="ongewijzigd" />
                  <ExampleBlock label="Y — niet vrij te stellen (O.1)" value="€11.561" />
                  <ExampleBlock label="Z — vrij te stellen (O.2)" value="€33.150" />
                  <ExampleBlock label="BE te betalen" value="€3.600" highlight />
                </div>
                <div
                  className="mt-3 p-2 rounded text-center"
                  style={{
                    background: "var(--bt-warning-dim)",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--bt-warning)",
                      fontFamily: "var(--bt-font-mono)",
                      fontWeight: 700,
                    }}
                  >
                    Netto voordeel: +€714
                  </span>
                  <div style={{ color: "var(--bt-text-muted)", fontSize: "0.75rem" }}>
                    teruggaaf €4.314 − BE €3.600 · dubbele heffing risico!
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Vergelijking tabel */}
          <div className="mt-4">
            <h6
              className="mb-3 small fw-semibold"
              style={{
                color: "var(--bt-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {m.ref_ss_comparison_all()}
            </h6>
            <Table responsive style={{ fontSize: "0.85rem", color: "var(--bt-text)" }}>
              <thead style={{ background: "var(--bt-surface-3)" }}>
                <tr>
                  <th>{m.ref_table_scenario()}</th>
                  <th>{m.ref_table_be_payable()}</th>
                  <th>{m.ref_table_nl_refund()}</th>
                  <th>{m.ref_table_net_diff()}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderColor: "var(--bt-border)" }}>
                  <td>100% kantoor NL (geen salary split)</td>
                  <td style={{ fontFamily: "var(--bt-font-mono)" }}>€600</td>
                  <td style={{ fontFamily: "var(--bt-font-mono)" }}>€0</td>
                  <td style={{ color: "var(--bt-text-muted)" }}>—</td>
                </tr>
                <tr style={{ borderColor: "var(--bt-border)" }}>
                  <td>50 thuiswerkdagen, geen ziek</td>
                  <td style={{ fontFamily: "var(--bt-font-mono)" }}>€3.277</td>
                  <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-success)" }}>
                    +€4.314
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--bt-font-mono)",
                      color: "var(--bt-success)",
                      fontWeight: 700,
                    }}
                  >
                    +€1.037 ✓
                  </td>
                </tr>
                <tr style={{ borderColor: "var(--bt-border)" }}>
                  <td>50 thuiswerkdagen + 25 ziektedagen</td>
                  <td style={{ fontFamily: "var(--bt-font-mono)" }}>€3.600</td>
                  <td style={{ fontFamily: "var(--bt-font-mono)", color: "var(--bt-success)" }}>
                    +€4.314
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--bt-font-mono)",
                      color: "var(--bt-warning)",
                      fontWeight: 700,
                    }}
                  >
                    +€714 ⚠️
                  </td>
                </tr>
              </tbody>
            </Table>
            <p className="small mb-0" style={{ color: "var(--bt-text-muted)" }}>
              * €600 = gemeentebelasting op NL nettoloon (6%, inwoner Hamont). Exacte bedragen
              afhankelijk van persoonlijke situatie. Bron: ACV Grensarbeiders Infosessie 24 maart
              2026, Pelt.
            </p>
          </div>
        </SectionCard>

        {/* ── Bronbestanden ───────────────────────────────────────── */}
        <SectionCard title={m.ref_ss_s8_title()} icon="bi-file-earmark-pdf-fill" accent="neutral">
          <p style={{ color: "var(--bt-text-sub)", fontSize: "0.875rem" }} className="mb-3">
            De originele ACV-documenten waarop dit naslagwerk is gebaseerd:
          </p>
          <Row className="g-3">
            <Col sm={6}>
              <a
                href="/docs/ACV-Checklist-Grensarbeiders-2026.pdf"
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
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.borderColor =
                      "var(--bt-border-hover)")
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
                      ACV Checklist Grensarbeiders 2026
                    </div>
                    <div style={{ color: "var(--bt-text-muted)", fontSize: "0.75rem" }}>
                      Volledig naslagwerk BE→NL · 8 pagina's
                    </div>
                  </div>
                  <i
                    className="bi bi-box-arrow-up-right ms-auto"
                    style={{ color: "var(--bt-text-muted)", fontSize: "0.8rem" }}
                  />
                </div>
              </a>
            </Col>
            <Col sm={6}>
              <a
                href="/docs/ACV-Telewerk-Infosessie-2026.pdf"
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
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.borderColor =
                      "var(--bt-border-hover)")
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
                      ACV Infosessie Telewerk &amp; Grensarbeiders
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
            </Col>
          </Row>
        </SectionCard>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer
          className="text-center small py-3 mt-2"
          style={{ color: "var(--bt-text-muted)", borderTop: "1px solid var(--bt-border)" }}
        >
          {m.ref_ss_footer()}&nbsp; |&nbsp;{" "}
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
