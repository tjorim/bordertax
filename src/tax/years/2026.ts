import { defineYear } from "./define";
import { BE_TABLES_SOURCES, EIGENWONINGFORFAIT_VERIFIED, eigenwoningforfaitSource } from "./shared";

/** Income year 2026 (Belgian assessment year 2027). */
export const year2026 = defineYear({
  year: 2026,
  nl: {
    mortgageDeductionRateCap: 0.3756,
    // Combined schijf 1: 35.75% − 27.65% = 8.10% (AOW age: 17.85% − 9.75% = 8.10%)
    incomeTaxBrackets: [
      { from: 0, to: 38883, rate: 0.081 },
      { from: 38883, to: 78426, rate: 0.3756 },
      { from: 78426, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 3115,
      ahkPhaseOutStart: 29736,
      ahkPhaseOutRate: 0.06398,
      ahkPhaseOutEnd: 78426,
      akStages: [
        { from: 0, to: 11965, baseAmount: 0, rate: 0.08324 },
        { from: 11965, to: 25845, baseAmount: 996, rate: 0.31009 },
        { from: 25845, to: 45592, baseAmount: 5300, rate: 0.0195 },
        { from: 45592, to: 132920, baseAmount: 5685, rate: -0.0651 },
        { from: 132920, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      ahkMax: 1556,
      ahkPhaseOutStart: 29736,
      ahkPhaseOutRate: 0.03195,
      ahkPhaseOutEnd: 78426,
      akStages: [
        { from: 0, to: 11965, baseAmount: 0, rate: 0.04156 },
        { from: 11965, to: 25845, baseAmount: 498, rate: 0.15483 },
        { from: 25845, to: 45592, baseAmount: 2647, rate: 0.00974 },
        { from: 45592, to: 132920, baseAmount: 2840, rate: -0.0325 },
        { from: 132920, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 16720, rate: 0.25 },
      { from: 16720, to: 29510, rate: 0.4 },
      { from: 29510, to: 51070, rate: 0.45 },
      { from: 51070, to: Infinity, rate: 0.5 },
    ],
    // 11,550 per the law of 15 July 2026 (BS 29 July 2026); plain indexation would have given 11,180.
    baseBelastingvrijeSom: 11550,
    childExtraAmounts: [0, 2030, 5230, 11720, 18970],
    extraPerChildAbove4: 7240,
    forfaitMax: 6070,
    // Dienstencheques: Flemish tax reduction abolished for cheques bought from 1 January 2025.
    serviceVoucherReductionRate: 0,
  },
  home: {
    rates: [0, 0.001, 0.002, 0.0025, 0.0035],
    threshold: 1350000,
    base: 4725,
  },
  sources: {
    nl: {
      sources: [
        {
          name: "Belastingdienst, Fiscale informatie 2026, heffingskortingen (sections 21.2, 21.3 and 21.9)",
          url: "https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2026/heffingskortingen",
        },
        {
          name: "Belastingdienst, voorlopige aanslag 2026: gebruikte tarieven en heffingskortingen (box 1 brackets and rates, premium ceiling)",
          url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen",
        },
      ],
      verified:
        "Every figure checked against the two cited Belastingdienst pages on 12 November 2026: brackets 35.75% / 37.56% / 49.50% (AOW age 17.85%), ceiling €38,883, premium parts 27.65% of 35.75% (section 21.9.1), and the algemene heffingskorting and arbeidskorting tables for both regimes",
    },
    mortgageDeductionRateCap: {
      sources: [
        {
          name: "Belastingdienst, tariefsaanpassing eigen woning (2026: deduction limited to 37.56%)",
          url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/koopwoning/content/tariefsaanpassing-eigen-woning",
        },
      ],
      verified:
        "Verified against the cited page on 12 November 2026: 'in 2026 ... beperkt tot 37,56%' (2025: 37.48%)",
    },
    be: {
      sources: [
        ...BE_TABLES_SOURCES.slice(0, 1),
        {
          name: "FOD Financiën, tarieven en belastingvrije som, inkomstenjaar 2026 (aanslagjaar 2027)",
          url: "https://fin.belgium.be/nl/particulieren/belastingaangifte/tarieven-belastbaar-inkomen/tarieven",
        },
        {
          name: "FOD Financiën, kinderen ten laste: verhoging van de belastingvrije som",
          url: "https://fin.belgium.be/nl/particulieren/belastingaangifte/persoonlijke-situatie-gezinssituatie/personen-ten-laste/kinderen",
        },
        {
          name: "FOD Financiën, beroepsinkomen: forfaitaire beroepskosten",
          url: "https://fin.belgium.be/nl/particulieren/belastingaangifte/inkomsten/beroepsinkomen",
        },
        {
          name: "FOD Financiën, diensten- of PWA-cheques (Flemish reduction abolished from 1 January 2025)",
          url: "https://fin.belgium.be/nl/particulieren/belastingvoordelen/diensten-pwa-cheques",
        },
        {
          name: "Vlaamse overheid, fiscale autonomie (opcentiemen 33.257% since 2018)",
          url: "https://www.vlaanderen.be/statistiek-vlaanderen/overheidsfinancien/fiscale-autonomie-belastingen-vlaamse-overheid",
        },
        {
          name: "Wet van 15 juli 2026 tot hervorming van de personenbelasting, Belgisch Staatsblad 29 juli 2026 (numac 2026201995)",
          url: "https://www.ejustice.just.fgov.be/cgi/summary.pl?language=nl&sum_date=2026-07-29",
        },
      ],
      verified:
        "Brackets, belastingvrije som (11,550), child supplements, forfait (30%, max 6,070) and the dienstencheques rule checked against the cited FOD Financiën pages on 12 November 2026; none is marked provisional. gereduceerdRate and gewestelijkeRate are the unchanged Flemish opcentiemen of 33.257% (Vlaamse overheid), as in the other years. The Vlaanderen statistics page (https://www.vlaanderen.be/statistiek-vlaanderen/overheidsfinancien/fiscale-autonomie-belastingen-vlaamse-overheid) states 'Sinds 2018 bedraagt het tarief 33,257%' in the present tense. No official source names assessment year 2027 explicitly; a third-party table (practicali.be, 'geindexeerde bedragen aj 2027') lists 33,257 for aanslagjaar 2025, 2026 and 2027",
    },
    home: {
      sources: [
        eigenwoningforfaitSource(2026),
        {
          name: "Belastingdienst, Fiscale informatie 2026, U woont buiten Nederland (sections 30.2.1.2, 30.2.1.3, 30.3.1)",
          url: "https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2026/u_woont_buiten_nederland",
        },
      ],
      verified: `${EIGENWONINGFORFAIT_VERIFIED}. The foreign-resident chapter was read on 12 November 2026: the 90% test is rounded down to whole percentages and excludes the own home and personal deductions; the inkomensverklaring condition is abolished from 2026 (see INCOME_STATEMENT_ABOLISHED_FROM_YEAR); premium income is worldwide box 1 income with deductions`,
    },
  },
});
