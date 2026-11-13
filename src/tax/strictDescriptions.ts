/**
 * Descriptions of the strict input fields for agent clients. They are attached to the MCP schema
 * only (`mcp/server.ts` imports this module), so the web bundle does not carry them. Each starts
 * with the source document the value is read from.
 */
import { z } from "zod";
import { BELGIAN_CODES, type INPUT_GROUPS } from "./schema";
import { StrictAnnualStatementSchema, StrictTaxInputSchema } from "./strict";

const DOCUMENT = {
  profile: "Profile",
  annualTaxStatement: "Annual tax statement (jaaropgave)",
  workdayRecord: "Workday record or cross-border workday statement",
  healthInsurer: "Health insurer's annual statement",
  pensionOrPayslip: "December payslip or pension statement",
  serviceVoucherStatement: "Service-voucher annual statement",
  bank: "Bank's annual tax statement",
  dutchAssessment: "Dutch assessment (aanslag)",
  home: "Home and mortgage",
} as const satisfies Record<keyof typeof INPUT_GROUPS, string>;

const code = (field: keyof typeof BELGIAN_CODES) => `Belgian code ${BELGIAN_CODES[field]}`;

const strictShape = StrictTaxInputSchema.in.shape;

export const ANNUAL_STATEMENT_DESCRIPTIONS = {
  taxableWage:
    "EUR per year: Taxable wage (Loon, fiscaal loon) on this annual tax statement. Not the gross salary.",
  wageTaxWithheld:
    "EUR per year: Dutch wage tax withheld (loonheffing) on this statement. Only used for the settlement against the Dutch charge.",
} satisfies Record<keyof typeof StrictAnnualStatementSchema.shape, string>;

export const STRICT_INPUT_DESCRIPTIONS = {
  year: `${DOCUMENT.profile}: income year.`,
  dependentChildren: `${DOCUMENT.profile}: dependent children.`,
  belowAOWAge: `${DOCUMENT.profile}: below the Dutch AOW pension age.`,
  communalTaxRate: `${DOCUMENT.profile}: Belgian municipal tax rate in percent.`,
  residentCountry: `${DOCUMENT.profile}: country of residence; only BE is supported.`,
  civilStatus: `${DOCUMENT.profile}: civil status; only single is supported.`,
  belgianRegion: `${DOCUMENT.profile}: Belgian region; only flemish is supported.`,
  thirtyPercentRuling: `${DOCUMENT.profile}: Dutch 30% ruling; must be false for Belgian residents.`,
  annualStatements: `${DOCUMENT.annualTaxStatement}: one entry per statement for the income year (job change, agency and direct employment), at least one. The wages are summed; the heffingskortingen and premiums are computed on the total.`,
  daysWorkedNL: `${DOCUMENT.workdayRecord}: days worked in the Netherlands.`,
  daysWorkedBE: `${DOCUMENT.workdayRecord}: days worked in Belgium, home working included.`,
  daysWorkedOther: `${DOCUMENT.workdayRecord}: days worked in a third country.`,
  sickDaysNL: `${DOCUMENT.workdayRecord}: sick days on days scheduled to be worked in the Netherlands. Dutch method: NL workdays. Belgian method: left out of both counts.`,
  sickDaysOutsideNL: `${DOCUMENT.workdayRecord}: sick days on days scheduled to be worked in Belgium or a third country. Dutch method: days outside NL, so part of deel niet in NL belast. Belgian method: left out of both counts.`,
  healthInsurancePremium: `${DOCUMENT.healthInsurer}: EUR per year, net Dutch basic health-insurance premium (${code("healthInsurancePremium")}).`,
  supplementaryPension: `${DOCUMENT.pensionOrPayslip}: EUR per year, personal supplementary pension contributions (${code("supplementaryPension")}).`,
  exchangedGrossWage: `${DOCUMENT.pensionOrPayslip}: EUR per year, gross wage exchanged for tax-free benefits (commuting, WKR, union fee, cafeteria plan). Added to the Belgian wage base (code 1250); optional, default 0.`,
  commutingAllowance: `${DOCUMENT.pensionOrPayslip}: EUR per year, untaxed employer allowance for commuting by own car, paid for days worked in the Netherlands (${code("commutingAllowance")}). Optional, default 0; the exemption (code 1255) is derived.`,
  serviceVouchers: `${DOCUMENT.serviceVoucherStatement}: EUR per year paid for service vouchers (${code("serviceVouchers")}); reduces tax for income years up to 2024 only.`,
  reclaimableWithholdingTax: `${DOCUMENT.bank}: EUR per year, reclaimable Belgian withholding tax on eligible dividends (${code("reclaimableWithholdingTax")}). Not the Dutch wage tax.`,
  assessmentIncomeTaxDue: `${DOCUMENT.dutchAssessment}: EUR per year, income tax due after the heffingskortingen. Give together with assessmentPremiumsDue to replace the estimate in the Belgian calculation (code 1250, O.1/O.2), total tax and net income.`,
  assessmentPremiumsDue: `${DOCUMENT.dutchAssessment}: EUR per year, premies volksverzekeringen due after the heffingskortingen. Give together with assessmentIncomeTaxDue.`,
  mortgageEnabled: `${DOCUMENT.home}: estimate the mortgage interest deduction.`,
  mortgageHomeValue: `${DOCUMENT.home}: EUR, whole-home market value at 1 January of the preceding year.`,
  mortgageInterest: `${DOCUMENT.home}: EUR per year, interest on the whole qualifying loan.`,
  mortgageOwnershipShare: `${DOCUMENT.home}: ownership share in percent.`,
  incomeOutsideNL: `${DOCUMENT.home}: EUR per year, worldwide income not taxed in NL (partner included).`,
} satisfies Record<keyof typeof strictShape, string>;

/** Registers a description on a field and, behind a default, on the field it wraps. */
function describe(schema: z.ZodType, description: string): void {
  z.globalRegistry.add(schema, { description });
  if (schema instanceof z.ZodDefault) describe(schema.removeDefault() as z.ZodType, description);
}

for (const [field, description] of Object.entries(ANNUAL_STATEMENT_DESCRIPTIONS)) {
  describe(
    StrictAnnualStatementSchema.shape[field as keyof typeof ANNUAL_STATEMENT_DESCRIPTIONS],
    description,
  );
}
for (const [field, description] of Object.entries(STRICT_INPUT_DESCRIPTIONS)) {
  describe(strictShape[field as keyof typeof STRICT_INPUT_DESCRIPTIONS], description);
}
