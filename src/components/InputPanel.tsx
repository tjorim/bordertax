import { useState } from "react";
import { Accordion, Badge, Button, Col, Form, Row } from "react-bootstrap";
import { VALID_YEARS } from "../tax/constants";
import type { TaxInputs } from "../tax/types";
import { getMaxDaysInYear, getTotalWorkdays } from "../tax/workdays";
import * as m from "../paraglide/messages.js";

interface Props {
  inputs: TaxInputs;
  onChange: (updated: TaxInputs) => void;
}

type BelgianDeductionKey =
  | "socialContributions"
  | "aanvullendPensioen"
  | "dienstencheques"
  | "roerendeVoorheffing";

const clampNumber = (value: string, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.min(max, Math.max(min, Number(value) || 0));

export default function InputPanel({ inputs, onChange }: Props) {
  const [showFormulas, setShowFormulas] = useState(false);

  function set<K extends keyof TaxInputs>(key: K, value: TaxInputs[K]) {
    onChange({ ...inputs, [key]: value });
  }

  const totalWorkdays = getTotalWorkdays(inputs);
  const maxWorkdaysInYear = getMaxDaysInYear(inputs.year);

  const nlBarW =
    maxWorkdaysInYear > 0 ? Math.min(100, (inputs.daysWorkedNL / maxWorkdaysInYear) * 100) : 0;
  const beBarW =
    maxWorkdaysInYear > 0
      ? Math.min(100 - nlBarW, (inputs.daysWorkedBE / maxWorkdaysInYear) * 100)
      : 0;
  const otherBarW =
    maxWorkdaysInYear > 0
      ? Math.min(100 - nlBarW - beBarW, ((inputs.daysWorkedOther ?? 0) / maxWorkdaysInYear) * 100)
      : 0;

  return (
    <Accordion defaultActiveKey={["0", "1", "2"]} alwaysOpen>
      {/* ── Section 1: Situation ─────────────────────────────── */}
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <i className="bi bi-person-fill me-2" />
          {m.input_personal_situation()}
        </Accordion.Header>
        <Accordion.Body>
          <Row className="g-3">
            <Col xs={12} sm={6}>
              <Form.Label>{m.input_tax_year()}</Form.Label>
              <Form.Select
                value={inputs.year}
                onChange={(e) => set("year", Number(e.target.value) as TaxInputs["year"])}
              >
                {VALID_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>{m.input_resident_country()}</Form.Label>
              <Form.Select
                value={inputs.residentCountry}
                onChange={(e) =>
                  set("residentCountry", e.target.value as TaxInputs["residentCountry"])
                }
              >
                <option value="BE">🇧🇪 {m.input_resident_country_be()}</option>
                <option value="NL">🇳🇱 {m.input_resident_country_nl()}</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>
                {m.input_civil_status()}{" "}
                <Badge
                  bg="secondary"
                  className="ms-1 fw-normal"
                  aria-label={m.input_civil_status_not_used()}
                >
                  {m.input_civil_status_not_used()}
                </Badge>
              </Form.Label>
              <Form.Select
                value={inputs.civilStatus}
                onChange={(e) => set("civilStatus", e.target.value as TaxInputs["civilStatus"])}
              >
                <option value="single">{m.input_civil_status_single()}</option>
                <option value="married">{m.input_civil_status_married()}</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>{m.input_dependents()}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={10}
                value={inputs.dependentChildren}
                onChange={(e) => set("dependentChildren", clampNumber(e.target.value, 0, 10))}
              />
            </Col>

            <Col xs={12}>
              <Form.Check
                id="aow-age"
                label={m.input_below_aow_age()}
                checked={inputs.belowAOWAge}
                onChange={(e) => set("belowAOWAge", e.target.checked)}
              />
            </Col>

            {inputs.residentCountry === "BE" && (
              <>
                <Col xs={12} sm={6}>
                  <Form.Label>
                    {m.input_belgian_region()}{" "}
                    <Badge
                      bg="secondary"
                      className="ms-1 fw-normal"
                      aria-label={m.input_belgian_region_not_used()}
                    >
                      {m.input_belgian_region_not_used()}
                    </Badge>
                  </Form.Label>
                  <Form.Select
                    value={inputs.belgianRegion}
                    onChange={(e) =>
                      set("belgianRegion", e.target.value as TaxInputs["belgianRegion"])
                    }
                  >
                    <option value="flemish">{m.input_belgian_region_flemish()}</option>
                    <option value="walloon">{m.input_belgian_region_walloon()}</option>
                    <option value="brussels">{m.input_belgian_region_brussels()}</option>
                  </Form.Select>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Label>
                    {m.input_municipal_tax()}{" "}
                    <Badge bg="secondary" className="ms-1">
                      %
                    </Badge>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={15}
                    step={0.1}
                    value={inputs.communalTaxRate}
                    onChange={(e) => set("communalTaxRate", clampNumber(e.target.value, 0, 15))}
                    aria-describedby="communal-tax-hint"
                  />
                  <Form.Text id="communal-tax-hint" className="text-muted">
                    {m.input_municipal_tax_hint()}
                  </Form.Text>
                </Col>
              </>
            )}
          </Row>
        </Accordion.Body>
      </Accordion.Item>

      {/* ── Section 2: Income ────────────────────────────────── */}
      <Accordion.Item eventKey="1">
        <Accordion.Header>
          <i className="bi bi-cash-coin me-2" />
          {m.input_income()}
        </Accordion.Header>
        <Accordion.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label>{m.input_gross_salary()}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={100}
                value={inputs.grossSalary}
                onChange={(e) => set("grossSalary", clampNumber(e.target.value))}
                aria-describedby="gross-salary-hint"
              />
              <Form.Text id="gross-salary-hint" className="text-muted">
                {m.input_gross_salary_hint()}
              </Form.Text>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="withheldTaxNL">
                <Form.Label>{m.input_withheld_tax_nl()}</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={100}
                  value={inputs.withheldTaxNL ?? 0}
                  onChange={(e) => set("withheldTaxNL", clampNumber(e.target.value))}
                  aria-describedby="withheld-tax-nl-hint"
                />
                <Form.Text id="withheld-tax-nl-hint" className="text-muted">
                  {m.input_withheld_tax_nl_hint()}
                </Form.Text>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>{m.input_workdays_nl()}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={inputs.daysWorkedNL}
                onChange={(e) => set("daysWorkedNL", clampNumber(e.target.value))}
              />
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>{m.input_workdays_be()}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={inputs.daysWorkedBE}
                onChange={(e) => set("daysWorkedBE", clampNumber(e.target.value))}
              />
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group controlId="daysWorkedOther">
                <Form.Label>{m.input_workdays_other()}</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={inputs.daysWorkedOther ?? 0}
                  onChange={(e) => set("daysWorkedOther", clampNumber(e.target.value))}
                  aria-describedby="days-other-hint"
                />
                <Form.Text id="days-other-hint" className="text-muted">
                  {m.input_workdays_other_hint()}
                </Form.Text>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group controlId="sickDays">
                <Form.Label>{m.input_sick_days()}</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={inputs.sickDays ?? 0}
                  onChange={(e) => set("sickDays", clampNumber(e.target.value))}
                  aria-describedby="sick-days-hint"
                />
                <Form.Text id="sick-days-hint" className="text-muted">
                  {m.input_sick_days_hint()}
                </Form.Text>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <div
                className={`bt-workday-bar${totalWorkdays > maxWorkdaysInYear ? " bt-workday-bar--over" : ""}`}
                role="img"
                aria-label={`${m.input_workdays_total()} ${totalWorkdays}`}
              >
                {nlBarW > 0 && (
                  <div
                    className="bt-workday-bar__seg bt-workday-bar__seg--nl"
                    style={{ width: `${nlBarW}%` }}
                  >
                    {nlBarW > 14 && (
                      <span className="bt-workday-bar__label">{inputs.daysWorkedNL}</span>
                    )}
                  </div>
                )}
                {beBarW > 0 && (
                  <div
                    className="bt-workday-bar__seg bt-workday-bar__seg--be"
                    style={{ width: `${beBarW}%` }}
                  >
                    {beBarW > 10 && (
                      <span className="bt-workday-bar__label">{inputs.daysWorkedBE}</span>
                    )}
                  </div>
                )}
                {otherBarW > 0 && (
                  <div
                    className="bt-workday-bar__seg bt-workday-bar__seg--other"
                    style={{ width: `${otherBarW}%` }}
                  />
                )}
              </div>
              <Form.Text
                role="status"
                className={
                  totalWorkdays === 0 || totalWorkdays > maxWorkdaysInYear
                    ? "text-warning"
                    : "text-muted"
                }
              >
                {m.input_workdays_total()} {totalWorkdays}
                {totalWorkdays === 0 && ` — ${m.input_workdays_total_zero_warning()}`}
                {totalWorkdays > maxWorkdaysInYear && ` — ${m.input_workdays_total_high_warning()}`}
              </Form.Text>
            </Col>

            <Col xs={12}>
              <Form.Check
                id="thirty-ruling"
                label={m.input_thirty_percent_ruling()}
                checked={inputs.thirtyPercentRuling}
                onChange={(e) => set("thirtyPercentRuling", e.target.checked)}
                aria-describedby="thirty-ruling-hint"
              />
              <Form.Text id="thirty-ruling-hint" className="text-muted">
                {m.input_thirty_percent_ruling_hint()}
              </Form.Text>
            </Col>

            {inputs.residentCountry === "BE" && (
              <>
                {(
                  [
                    {
                      key: "socialContributions",
                      label: m.input_social_contributions(),
                    },
                    {
                      key: "aanvullendPensioen",
                      label: m.input_aanvullend_pensioen(),
                    },
                    {
                      key: "dienstencheques",
                      label: m.input_dienstencheques(),
                    },
                    {
                      key: "roerendeVoorheffing",
                      label: m.input_roerende_voorheffing(),
                    },
                  ] as const satisfies readonly { key: BelgianDeductionKey; label: string }[]
                ).map((field) => (
                  <Col key={field.key} xs={12} sm={6}>
                    <Form.Group controlId={field.key}>
                      <Form.Label>{field.label}</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        step={100}
                        value={inputs[field.key] ?? 0}
                        onChange={(e) =>
                          set(
                            field.key,
                            clampNumber(e.target.value) as TaxInputs[BelgianDeductionKey],
                          )
                        }
                      />
                    </Form.Group>
                  </Col>
                ))}
              </>
            )}

            <Col xs={12}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowFormulas((v) => !v)}
                aria-expanded={showFormulas}
                aria-controls="formulas-panel"
              >
                <i className={`bi bi-${showFormulas ? "eye-slash" : "info-circle"} me-1`} />
                {showFormulas ? m.hide_formulas() : m.show_formulas()}
              </Button>
              {showFormulas && (
                <div
                  id="formulas-panel"
                  role="region"
                  aria-label={m.show_formulas()}
                  className="mt-2 small text-muted border rounded p-2"
                >
                  <p className="mb-1">
                    <strong>🇳🇱 {m.summary_sourcing_nl_method()}:</strong>{" "}
                    {m.summary_sourcing_nl_formula()}
                  </p>
                  <p className="mb-0">
                    <strong>🇧🇪 {m.summary_sourcing_be_method()}:</strong>{" "}
                    {m.summary_sourcing_be_formula()}
                  </p>
                </div>
              )}
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
