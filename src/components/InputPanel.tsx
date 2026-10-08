import { DistributionSegment } from "@/components/ui/distribution-segment";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldLabel, FieldDescription, NativeSelect, CheckboxField } from "@/components/ui/field";
import { Coins, EyeOff, Info, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useSelector } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { z } from "zod";

import {
  VALID_YEARS,
  VALID_RESIDENT_COUNTRIES,
  VALID_CIVIL_STATUSES,
  VALID_BELGIAN_REGIONS,
  isThirtyPercentRulingSupportedResident,
} from "../tax/constants";
import type { TaxFormApi } from "../App";
import type { TaxInputs } from "../tax/types";
import { getMaxDaysInYear, getNLFractions, getTotalWorkdays } from "../tax/workdays";
import * as m from "../paraglide/messages.js";
import { CurrencyField, NumberField, fieldError } from "./fields/NumberField";
import { CodeBadge } from "./CodeBadge";

interface Props {
  form: TaxFormApi;
}

type BelgianDeductionKey =
  | "socialContributions"
  | "aanvullendPensioen"
  | "dienstencheques"
  | "roerendeVoorheffing";

const allowEmptyNumber = (handleChange: (value: number) => void) => (value: number | undefined) =>
  handleChange(value as number);

export default function InputPanel({ form }: Props) {
  const [showFormulas, setShowFormulas] = useState(false);
  const values = useSelector(form.atom, (s) => s.values);

  const totalWorkdays = getTotalWorkdays(values);
  const maxWorkdaysInYear = getMaxDaysInYear(values.year);
  const { beFraction } = getNLFractions(values);
  const daysWorkedNL = values.daysWorkedNL ?? 0;
  const daysWorkedBE = values.daysWorkedBE ?? 0;
  const daysWorkedOther = values.daysWorkedOther ?? 0;

  const nlBarW =
    maxWorkdaysInYear > 0 ? Math.min(100, (daysWorkedNL / maxWorkdaysInYear) * 100) : 0;
  const beBarW =
    maxWorkdaysInYear > 0 ? Math.min(100 - nlBarW, (daysWorkedBE / maxWorkdaysInYear) * 100) : 0;
  const otherBarW =
    maxWorkdaysInYear > 0
      ? Math.min(100 - nlBarW - beBarW, (daysWorkedOther / maxWorkdaysInYear) * 100)
      : 0;

  return (
    <Accordion defaultValue={["0", "1", "2"]} multiple>
      {/* ── Section 1: Situation ─────────────────────────────── */}
      <AccordionItem value="0">
        <AccordionTrigger>
          <User aria-hidden="true" className="inline size-4 shrink-0 align-text-bottom me-2" />
          {m.input_personal_situation()}
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-12 gap-4">
            <form.Field name="year">
              {(field) => (
                <div className="col-span-12 table:col-span-6">
                  <FieldLabel htmlFor="tax-year">{m.input_tax_year()}</FieldLabel>
                  <NativeSelect
                    id="tax-year"
                    value={field.value}
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
                  </NativeSelect>
                </div>
              )}
            </form.Field>

            {VALID_RESIDENT_COUNTRIES.length > 1 && (
              <form.Field name="residentCountry">
                {(field) => (
                  <div className="col-span-12 table:col-span-6">
                    <FieldLabel htmlFor="resident-country">{m.input_resident_country()}</FieldLabel>
                    <NativeSelect
                      id="resident-country"
                      value={field.value}
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
                    </NativeSelect>
                  </div>
                )}
              </form.Field>
            )}

            {VALID_CIVIL_STATUSES.length > 1 && (
              <form.Field name="civilStatus">
                {(field) => (
                  <div className="col-span-12 table:col-span-6">
                    <FieldLabel htmlFor="civil-status">
                      {m.input_civil_status()}{" "}
                      <Badge
                        variant="label"
                        className="ms-1"
                        aria-label={m.input_civil_status_not_used()}
                      >
                        {m.input_civil_status_not_used()}
                      </Badge>
                    </FieldLabel>
                    <NativeSelect
                      id="civil-status"
                      value={field.value}
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
                    </NativeSelect>
                  </div>
                )}
              </form.Field>
            )}

            <form.Field
              name="dependentChildren"
              validators={[{ run: z.number().int().min(0).max(10), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12 table:col-span-6">
                    <NumberField
                      id="dependent-children"
                      label={m.input_dependents()}
                      min={0}
                      max={10}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="belowAOWAge">
              {(field) => (
                <div className="col-span-12">
                  <CheckboxField
                    id="aow-age"
                    label={m.input_below_aow_age()}
                    checked={field.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            </form.Field>

            {values.residentCountry === "BE" && (
              <>
                {VALID_BELGIAN_REGIONS.length > 1 && (
                  <form.Field name="belgianRegion">
                    {(field) => (
                      <div className="col-span-12 table:col-span-6">
                        <FieldLabel htmlFor="belgian-region">
                          {m.input_belgian_region()}{" "}
                          <Badge
                            variant="label"
                            className="ms-1"
                            aria-label={m.input_belgian_region_not_used()}
                          >
                            {m.input_belgian_region_not_used()}
                          </Badge>
                        </FieldLabel>
                        <NativeSelect
                          id="belgian-region"
                          value={field.value}
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
                        </NativeSelect>
                      </div>
                    )}
                  </form.Field>
                )}

                <form.Field
                  name="communalTaxRate"
                  validators={[{ run: z.number().min(0).max(15), triggers: ["change"] }]}
                >
                  {(field) => {
                    const err = fieldError(field.errors as unknown[]);
                    return (
                      <div className="col-span-12 table:col-span-6">
                        <NumberField
                          id="communal-tax-rate"
                          label={
                            <>
                              {m.input_municipal_tax()}{" "}
                              <Badge variant="label" className="ms-1">
                                %
                              </Badge>
                            </>
                          }
                          min={0}
                          max={15}
                          step={0.1}
                          value={field.value}
                          onChange={allowEmptyNumber(field.handleChange)}
                          onBlur={field.handleBlur}
                          hint={m.input_municipal_tax_hint()}
                          hintId="communal-tax-hint"
                          error={err}
                        />
                      </div>
                    );
                  }}
                </form.Field>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Section 2: Income ────────────────────────────────── */}
      <AccordionItem value="1">
        <AccordionTrigger>
          <Coins aria-hidden="true" className="inline size-4 shrink-0 align-text-bottom me-2" />
          {m.input_income()}
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <FieldDescription className="text-text-muted">
                {m.input_income_not_persisted_hint()}
              </FieldDescription>
            </div>

            <form.Field
              name="grossSalary"
              validators={[{ run: z.number().min(0), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12">
                    <CurrencyField
                      id="gross-salary"
                      label={m.input_gross_salary()}
                      min={0}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      hint={m.input_gross_salary_hint()}
                      hintId="gross-salary-hint"
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="withheldTaxNL"
              validators={[{ run: z.number().min(0), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12">
                    <CurrencyField
                      id="withheldTaxNL"
                      label={m.input_withheld_tax_nl()}
                      min={0}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      hint={m.input_withheld_tax_nl_hint()}
                      hintId="withheld-tax-nl-hint"
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="daysWorkedNL"
              validators={[{ run: z.number().min(0), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12 table:col-span-6">
                    <NumberField
                      id="days-worked-nl"
                      label={m.input_workdays_nl()}
                      min={0}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      hint={m.input_workdays_nl_hint()}
                      hintId="workdays-nl-hint"
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="daysWorkedBE"
              validators={[{ run: z.number().min(0), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12 table:col-span-6">
                    <NumberField
                      id="days-worked-be"
                      label={m.input_workdays_be()}
                      min={0}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      hint={m.input_workdays_be_hint()}
                      hintId="workdays-be-hint"
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="daysWorkedOther"
              validators={[{ run: z.number().min(0), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12 table:col-span-6">
                    <NumberField
                      id="daysWorkedOther"
                      label={m.input_workdays_other()}
                      min={0}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      hint={m.input_workdays_other_hint()}
                      hintId="days-other-hint"
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="sickDays"
              validators={[{ run: z.number().min(0), triggers: ["change"] }]}
            >
              {(field) => {
                const err = fieldError(field.errors as unknown[]);
                return (
                  <div className="col-span-12 table:col-span-6">
                    <NumberField
                      id="sickDays"
                      label={m.input_sick_days()}
                      min={0}
                      value={field.value}
                      onChange={allowEmptyNumber(field.handleChange)}
                      onBlur={field.handleBlur}
                      hint={m.input_sick_days_hint()}
                      hintId="sick-days-hint"
                      error={err}
                    />
                  </div>
                );
              }}
            </form.Field>

            <div className="col-span-12">
              <div
                className={cn(
                  "bt-workday-bar",
                  totalWorkdays > maxWorkdaysInYear && "bt-workday-bar--over",
                )}
                role="img"
                aria-label={`${m.input_workdays_total()} ${totalWorkdays}`}
              >
                {nlBarW > 0 && (
                  <DistributionSegment
                    className="bt-workday-bar__seg bt-workday-bar__seg--nl"
                    percent={nlBarW}
                  >
                    {nlBarW > 14 && <span className="bt-workday-bar__label">{daysWorkedNL}</span>}
                  </DistributionSegment>
                )}
                {beBarW > 0 && (
                  <DistributionSegment
                    className="bt-workday-bar__seg bt-workday-bar__seg--be"
                    percent={beBarW}
                  >
                    {beBarW > 10 && <span className="bt-workday-bar__label">{daysWorkedBE}</span>}
                  </DistributionSegment>
                )}
                {otherBarW > 0 && (
                  <DistributionSegment
                    className="bt-workday-bar__seg bt-workday-bar__seg--other"
                    percent={otherBarW}
                  />
                )}
              </div>
              <FieldDescription
                role="status"
                className={cn(
                  totalWorkdays === 0 || totalWorkdays > maxWorkdaysInYear
                    ? "text-warning"
                    : "text-text-muted",
                )}
              >
                {m.input_workdays_total()} {totalWorkdays}
                {totalWorkdays === 0 && ` — ${m.input_workdays_total_zero_warning()}`}
                {totalWorkdays > maxWorkdaysInYear && ` — ${m.input_workdays_total_high_warning()}`}
              </FieldDescription>
              <FieldDescription className="text-text-muted block mt-1">
                {m.input_workdays_typical()}
              </FieldDescription>
              {values.residentCountry === "BE" && totalWorkdays > 0 && beFraction >= 0.5 && (
                <Alert variant="warning" className="mt-2 py-2 text-sm mb-0">
                  {m.input_social_security_above_50()}
                </Alert>
              )}
              {values.residentCountry === "BE" &&
                totalWorkdays > 0 &&
                beFraction >= 0.25 &&
                beFraction < 0.5 && (
                  <Alert variant="info" className="mt-2 py-2 text-sm mb-0">
                    {m.input_social_security_kaderakkoord()}
                  </Alert>
                )}
            </div>

            {isThirtyPercentRulingSupportedResident(values.residentCountry) ? (
              <form.Field name="thirtyPercentRuling">
                {(field) => (
                  <div className="col-span-12">
                    <CheckboxField
                      id="thirty-ruling"
                      label={m.input_thirty_percent_ruling()}
                      checked={field.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-describedby="thirty-ruling-hint"
                    />
                    <FieldDescription id="thirty-ruling-hint" className="text-text-muted">
                      {m.input_thirty_percent_ruling_hint()}
                    </FieldDescription>
                  </div>
                )}
              </form.Field>
            ) : (
              <div className="col-span-12">
                <CheckboxField
                  id="thirty-ruling"
                  label={m.input_thirty_percent_ruling()}
                  checked={false}
                  disabled
                  aria-describedby="thirty-ruling-hint"
                />
                <FieldDescription id="thirty-ruling-hint" className="text-text-muted">
                  {m.input_thirty_percent_ruling_unavailable_be()}
                </FieldDescription>
              </div>
            )}

            {values.residentCountry === "BE" && (
              <>
                {(
                  [
                    {
                      key: "socialContributions",
                      label: m.input_social_contributions(),
                      code: "1257",
                      codeDescription: m.code_desc_1257(),
                      hint: m.input_social_contributions_hint(),
                    },
                    {
                      key: "aanvullendPensioen",
                      label: m.input_aanvullend_pensioen(),
                      code: "1285",
                      codeDescription: m.code_desc_1285(),
                      hint: m.input_aanvullend_pensioen_hint(),
                    },
                    {
                      key: "dienstencheques",
                      label: m.input_dienstencheques(),
                      code: "3364",
                      codeDescription: m.code_desc_3364(),
                      hint:
                        values.year >= 2025 ? m.input_dienstencheques_hint_abolished() : undefined,
                    },
                    {
                      key: "roerendeVoorheffing",
                      label: m.input_roerende_voorheffing(),
                      code: "1437",
                      codeDescription: m.code_desc_1437(),
                      hint: m.input_roerende_voorheffing_hint(),
                    },
                  ] as const satisfies readonly {
                    key: BelgianDeductionKey;
                    label: string;
                    code: string;
                    codeDescription: string;
                    hint?: string;
                  }[]
                ).map((fieldDef) => (
                  <form.Field
                    key={fieldDef.key}
                    name={fieldDef.key}
                    validators={[{ run: z.number().min(0), triggers: ["change"] }]}
                  >
                    {(field) => {
                      const err = fieldError(field.errors as unknown[]);
                      return (
                        <div className="col-span-12 table:col-span-6">
                          <CurrencyField
                            id={fieldDef.key}
                            label={
                              <>
                                {fieldDef.label}
                                <CodeBadge
                                  code={fieldDef.code}
                                  description={fieldDef.codeDescription}
                                />
                              </>
                            }
                            min={0}
                            value={field.value}
                            onChange={allowEmptyNumber(field.handleChange)}
                            onBlur={field.handleBlur}
                            error={err}
                            hint={fieldDef.hint}
                            hintId={fieldDef.hint ? `${fieldDef.key}-hint` : undefined}
                          />
                        </div>
                      );
                    }}
                  </form.Field>
                ))}
              </>
            )}

            <div className="col-span-12">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowFormulas((v) => !v)}
                aria-expanded={showFormulas}
                aria-controls="formulas-panel"
              >
                {showFormulas ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Info aria-hidden="true" className="size-4" />
                )}
                {showFormulas ? m.hide_formulas() : m.show_formulas()}
              </Button>
              {showFormulas && (
                <div
                  id="formulas-panel"
                  role="region"
                  aria-label={m.formulas_panel_label()}
                  className="mt-2 text-sm text-text-muted border border-border rounded-md p-2"
                >
                  <p className="mb-1">{m.summary_sourcing_nl_formula()}</p>
                  <p className="mb-0">{m.summary_sourcing_be_formula()}</p>
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
