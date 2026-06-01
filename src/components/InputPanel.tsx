import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import clsx from "clsx";
import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { z } from "zod";
import { Accordion, Alert, Badge, Button, Col, Form, Row } from "react-bootstrap";
import {
  VALID_YEARS,
  VALID_RESIDENT_COUNTRIES,
  VALID_CIVIL_STATUSES,
  VALID_BELGIAN_REGIONS,
} from "../tax/constants";
import type { TaxInputs } from "../tax/types";
import { getMaxDaysInYear, getTotalWorkdays } from "../tax/workdays";
import * as m from "../paraglide/messages.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaxFormApi = ReactFormExtendedApi<TaxInputs, any, any, any, any, any, any, any, any, any, any, any>;

interface Props {
  form: TaxFormApi;
}

type BelgianDeductionKey =
  | "socialContributions"
  | "aanvullendPensioen"
  | "dienstencheques"
  | "roerendeVoorheffing";

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors?.length) return undefined;
  const msgs = errors.flatMap((e) => {
    if (Array.isArray(e)) return e.map((i) => (i as { message?: string })?.message ?? String(i));
    if (e && typeof e === "object" && "message" in e)
      return [(e as { message: unknown }).message as string];
    return [String(e)];
  });
  return msgs.filter(Boolean).join(" ") || undefined;
}

export default function InputPanel({ form }: Props) {
  const [showFormulas, setShowFormulas] = useState(false);
  const values = useStore(form.store, (s) => s.values);

  const totalWorkdays = getTotalWorkdays(values);
  const maxWorkdaysInYear = getMaxDaysInYear(values.year);
  const beFraction = totalWorkdays > 0 ? values.daysWorkedBE / totalWorkdays : 0;

  const nlBarW =
    maxWorkdaysInYear > 0 ? Math.min(100, (values.daysWorkedNL / maxWorkdaysInYear) * 100) : 0;
  const beBarW =
    maxWorkdaysInYear > 0
      ? Math.min(100 - nlBarW, (values.daysWorkedBE / maxWorkdaysInYear) * 100)
      : 0;
  const otherBarW =
    maxWorkdaysInYear > 0
      ? Math.min(
          100 - nlBarW - beBarW,
          ((values.daysWorkedOther ?? 0) / maxWorkdaysInYear) * 100,
        )
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
            <form.Field name="year">
              {(field) => (
                <Col xs={12} sm={6}>
                  <Form.Label>{m.input_tax_year()}</Form.Label>
                  <Form.Select
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(Number(e.target.value) as TaxInputs["year"])
                    }
                    onBlur={field.handleBlur}
                  >
                    {VALID_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              )}
            </form.Field>

            {VALID_RESIDENT_COUNTRIES.length > 1 && (
              <form.Field name="residentCountry">
                {(field) => (
                  <Col xs={12} sm={6}>
                    <Form.Label>{m.input_resident_country()}</Form.Label>
                    <Form.Select
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.value as TaxInputs["residentCountry"])
                      }
                      onBlur={field.handleBlur}
                    >
                      {(VALID_RESIDENT_COUNTRIES as readonly string[]).includes("BE") && (
                        <option value="BE">🇧🇪 {m.input_resident_country_be()}</option>
                      )}
                      {(VALID_RESIDENT_COUNTRIES as readonly string[]).includes("NL") && (
                        <option value="NL">🇳🇱 {m.input_resident_country_nl()}</option>
                      )}
                    </Form.Select>
                  </Col>
                )}
              </form.Field>
            )}

            {VALID_CIVIL_STATUSES.length > 1 && (
              <form.Field name="civilStatus">
                {(field) => (
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
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.value as TaxInputs["civilStatus"])
                      }
                      onBlur={field.handleBlur}
                    >
                      {(VALID_CIVIL_STATUSES as readonly string[]).includes("single") && (
                        <option value="single">{m.input_civil_status_single()}</option>
                      )}
                      {(VALID_CIVIL_STATUSES as readonly string[]).includes("married") && (
                        <option value="married">{m.input_civil_status_married()}</option>
                      )}
                    </Form.Select>
                  </Col>
                )}
              </form.Field>
            )}

            <form.Field
              name="dependentChildren"
              validators={{ onChange: z.number().int().min(0).max(10) }}
            >
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12} sm={6}>
                    <Form.Label>{m.input_dependents()}</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      max={10}
                      value={field.state.value}
                      onChange={(e) => {
                        const n = (e.target as HTMLInputElement).valueAsNumber;
                        field.handleChange(Number.isNaN(n) ? 0 : n);
                      }}
                      onBlur={field.handleBlur}
                      isInvalid={!!err}
                    />
                    {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                  </Col>
                );
              }}
            </form.Field>

            <form.Field name="belowAOWAge">
              {(field) => (
                <Col xs={12}>
                  <Form.Check
                    id="aow-age"
                    label={m.input_below_aow_age()}
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                </Col>
              )}
            </form.Field>

            {values.residentCountry === "BE" && (
              <>
                {VALID_BELGIAN_REGIONS.length > 1 && (
                  <form.Field name="belgianRegion">
                    {(field) => (
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
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(e.target.value as TaxInputs["belgianRegion"])
                          }
                          onBlur={field.handleBlur}
                        >
                          {(VALID_BELGIAN_REGIONS as readonly string[]).includes("flemish") && (
                            <option value="flemish">{m.input_belgian_region_flemish()}</option>
                          )}
                          {(VALID_BELGIAN_REGIONS as readonly string[]).includes("walloon") && (
                            <option value="walloon">{m.input_belgian_region_walloon()}</option>
                          )}
                          {(VALID_BELGIAN_REGIONS as readonly string[]).includes("brussels") && (
                            <option value="brussels">{m.input_belgian_region_brussels()}</option>
                          )}
                        </Form.Select>
                      </Col>
                    )}
                  </form.Field>
                )}

                <form.Field
                  name="communalTaxRate"
                  validators={{ onChange: z.number().min(0).max(15) }}
                >
                  {(field) => {
                    const err = fieldError(field.state.meta.errors as unknown[]);
                    return (
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
                          value={field.state.value}
                          onChange={(e) => {
                            const n = (e.target as HTMLInputElement).valueAsNumber;
                            field.handleChange(Number.isNaN(n) ? 0 : n);
                          }}
                          onBlur={field.handleBlur}
                          isInvalid={!!err}
                          aria-describedby="communal-tax-hint"
                        />
                        <Form.Text id="communal-tax-hint" className="text-muted">
                          {m.input_municipal_tax_hint()}
                        </Form.Text>
                        {err && (
                          <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>
                        )}
                      </Col>
                    );
                  }}
                </form.Field>
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
            <form.Field name="grossSalary" validators={{ onChange: z.number().min(0) }}>
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12}>
                    <Form.Label>{m.input_gross_salary()}</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      step={100}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                      isInvalid={!!err}
                      aria-describedby="gross-salary-hint"
                    />
                    <Form.Text id="gross-salary-hint" className="text-muted">
                      {m.input_gross_salary_hint()}
                    </Form.Text>
                    {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                  </Col>
                );
              }}
            </form.Field>

            <form.Field name="withheldTaxNL" validators={{ onChange: z.number().min(0) }}>
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12}>
                    <Form.Group controlId="withheldTaxNL">
                      <Form.Label>{m.input_withheld_tax_nl()}</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        step={100}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                        onBlur={field.handleBlur}
                        isInvalid={!!err}
                        aria-describedby="withheld-tax-nl-hint"
                      />
                      <Form.Text id="withheld-tax-nl-hint" className="text-muted">
                        {m.input_withheld_tax_nl_hint()}
                      </Form.Text>
                      {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                    </Form.Group>
                  </Col>
                );
              }}
            </form.Field>

            <form.Field name="daysWorkedNL" validators={{ onChange: z.number().min(0) }}>
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12} sm={6}>
                    <Form.Label>{m.input_workdays_nl()}</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                      isInvalid={!!err}
                      aria-describedby="workdays-nl-hint"
                    />
                    <Form.Text id="workdays-nl-hint" className="text-muted">
                      {m.input_workdays_nl_hint()}
                    </Form.Text>
                    {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                  </Col>
                );
              }}
            </form.Field>

            <form.Field name="daysWorkedBE" validators={{ onChange: z.number().min(0) }}>
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12} sm={6}>
                    <Form.Label>{m.input_workdays_be()}</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                      isInvalid={!!err}
                    />
                    {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                  </Col>
                );
              }}
            </form.Field>

            <form.Field name="daysWorkedOther" validators={{ onChange: z.number().min(0) }}>
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12} sm={6}>
                    <Form.Group controlId="daysWorkedOther">
                      <Form.Label>{m.input_workdays_other()}</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                        onBlur={field.handleBlur}
                        isInvalid={!!err}
                        aria-describedby="days-other-hint"
                      />
                      <Form.Text id="days-other-hint" className="text-muted">
                        {m.input_workdays_other_hint()}
                      </Form.Text>
                      {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                    </Form.Group>
                  </Col>
                );
              }}
            </form.Field>

            <form.Field name="sickDays" validators={{ onChange: z.number().min(0) }}>
              {(field) => {
                const err = fieldError(field.state.meta.errors as unknown[]);
                return (
                  <Col xs={12} sm={6}>
                    <Form.Group controlId="sickDays">
                      <Form.Label>{m.input_sick_days()}</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                        onBlur={field.handleBlur}
                        isInvalid={!!err}
                        aria-describedby="sick-days-hint"
                      />
                      <Form.Text id="sick-days-hint" className="text-muted">
                        {m.input_sick_days_hint()}
                      </Form.Text>
                      {err && <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>}
                    </Form.Group>
                  </Col>
                );
              }}
            </form.Field>

            <Col xs={12}>
              <div
                className={clsx("bt-workday-bar", totalWorkdays > maxWorkdaysInYear && "bt-workday-bar--over")}
                role="img"
                aria-label={`${m.input_workdays_total()} ${totalWorkdays}`}
              >
                {nlBarW > 0 && (
                  <div
                    className="bt-workday-bar__seg bt-workday-bar__seg--nl"
                    style={{ width: `${nlBarW}%` }}
                  >
                    {nlBarW > 14 && (
                      <span className="bt-workday-bar__label">{values.daysWorkedNL}</span>
                    )}
                  </div>
                )}
                {beBarW > 0 && (
                  <div
                    className="bt-workday-bar__seg bt-workday-bar__seg--be"
                    style={{ width: `${beBarW}%` }}
                  >
                    {beBarW > 10 && (
                      <span className="bt-workday-bar__label">{values.daysWorkedBE}</span>
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
                className={clsx(
                  totalWorkdays === 0 || totalWorkdays > maxWorkdaysInYear
                    ? "text-warning"
                    : "text-muted",
                )}
              >
                {m.input_workdays_total()} {totalWorkdays}
                {totalWorkdays === 0 && ` — ${m.input_workdays_total_zero_warning()}`}
                {totalWorkdays > maxWorkdaysInYear && ` — ${m.input_workdays_total_high_warning()}`}
              </Form.Text>
              <Form.Text className="text-muted d-block mt-1">
                {m.input_workdays_typical()}
              </Form.Text>
              {values.residentCountry === "BE" && totalWorkdays > 0 && beFraction >= 0.5 && (
                <Alert variant="warning" className="mt-2 py-2 small mb-0">
                  {m.input_social_security_above_50()}
                </Alert>
              )}
              {values.residentCountry === "BE" &&
                totalWorkdays > 0 &&
                beFraction >= 0.25 &&
                beFraction < 0.5 && (
                  <Alert variant="info" className="mt-2 py-2 small mb-0">
                    {m.input_social_security_kaderakkoord()}
                  </Alert>
                )}
            </Col>

            <form.Field name="thirtyPercentRuling">
              {(field) => (
                <Col xs={12}>
                  <Form.Check
                    id="thirty-ruling"
                    label={m.input_thirty_percent_ruling()}
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    aria-describedby="thirty-ruling-hint"
                  />
                  <Form.Text id="thirty-ruling-hint" className="text-muted">
                    {m.input_thirty_percent_ruling_hint()}
                  </Form.Text>
                </Col>
              )}
            </form.Field>

            {values.residentCountry === "BE" && (
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
                ).map((fieldDef) => (
                  <form.Field
                    key={fieldDef.key}
                    name={fieldDef.key}
                    validators={{ onChange: z.number().min(0) }}
                  >
                    {(field) => {
                      const err = fieldError(field.state.meta.errors as unknown[]);
                      return (
                        <Col xs={12} sm={6}>
                          <Form.Group controlId={fieldDef.key}>
                            <Form.Label>{fieldDef.label}</Form.Label>
                            <Form.Control
                              type="number"
                              min={0}
                              step={100}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                              onBlur={field.handleBlur}
                              isInvalid={!!err}
                            />
                            {err && (
                              <Form.Control.Feedback type="invalid">{err}</Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </Col>
                      );
                    }}
                  </form.Field>
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
                  aria-label={m.formulas_panel_label()}
                  className="mt-2 small text-muted border rounded p-2"
                >
                  <p className="mb-1">{m.summary_sourcing_nl_formula()}</p>
                  <p className="mb-0">{m.summary_sourcing_be_formula()}</p>
                </div>
              )}
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
