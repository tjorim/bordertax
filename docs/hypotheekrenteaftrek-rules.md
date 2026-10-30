# Hypotheekrenteaftrek: official-source review, income years 2020–2025

Research for #341 and implementation follow-up #345, checked 30 October 2026. **Partially resolved.** “Verified” means the cited official material supports the stated rule; it does not certify the complete calculator. “Contradicted” refers to an existing engine assumption. “Could not verify” is an open question, not evidence that the assumption is correct. Income year 2026 and #144 are outside this review.

## Year-specific evidence

These are the actual yearly Belastingdienst publications, fetched separately for all six years. In each foreign-resident chapter, see “Gevolgen premieplicht”, the 90% conditions and the calculation model. In each home chapter, see “U woont buiten Nederland”, eigenwoningforfait and qualifying debt. The chapter numbering changes between years.

| Income year | Foreign-resident and premium rules                                                                                 | Home rules                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 2020        | [Fiscale informatie 2020](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2020/u_woont_buiten_nederland) | [Eigen woning 2020](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2020/eigen_woning_en_restschuld_vroegere) |
| 2021        | [Fiscale informatie 2021](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2021/u_woont_buiten_nederland) | [Eigen woning 2021](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2021/eigen_woning_en_restschuld_vroegere) |
| 2022        | [Fiscale informatie 2022](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2022/u_woont_buiten_nederland) | [Eigen woning 2022](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2022/eigen_woning_en_restschuld_vroegere) |
| 2023        | [Fiscale informatie 2023](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2023/u_woont_buiten_nederland) | [Eigen woning 2023](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2023/eigen_woning_en_restschuld_vroegere) |
| 2024        | [Fiscale informatie 2024](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2024/u_woont_buiten_nederland) | [Eigen woning 2024](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2024/eigen_woning_en_restschuld_vroegere) |
| 2025        | [Fiscale informatie 2025](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2025/u_woont_buiten_nederland) | [Eigen woning 2025](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2025/eigen_woning_en_restschuld_vroegere) |

## 1. Premium income: contradicted and corrected

**2020–2025: contradicted, high confidence.** Each yearly foreign-resident chapter says that premium income is worldwide Box 1 income and that deductions can be used against it. This is not restricted to the Dutch-taxed workday fraction. The [2024 premium chapter](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2024/premie_volksverzekeringen) also bases premiums on worldwide work-and-home income. The general [deductions guidance](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aftrekposten/aftrekposten) explicitly includes mortgage interest and says deductions reduce both income tax and premiums.

The engine now subtracts the mortgage deduction from its worldwide salary approximation before applying the premium ceiling and rate. Premiums remain unchanged when the resulting income still exceeds that ceiling. Tests cover every supported year, both AOW settings, crossing the ceiling and the zero floor. Labour income and arbeidskorting do not change. The obsolete `premium_base_unchanged` assumption is no longer returned.

Limits: the engine still assumes Dutch social insurance and salary-only worldwide premium income. It does not calculate deductions for a mortgage-ineligible person, partial-year insurance, partner allocations or a complete Box 1 balance. The premium correction is not a complete non-resident return implementation.

## 2. Belgian home and eigenwoningforfait: correction with explicit limits

**2020–2025: former omission contradicted, high confidence.** The yearly home chapters above explicitly include a qualifying non-resident's foreign main home in the eigenwoningregeling. They describe adding the home benefit to Box 1 income and deducting eligible costs. Belgium's location does not by itself justify omitting the eigenwoningforfait. A zero forfait can apply in particular situations, such as an empty future main home, but is not the general rule for an occupied Belgian main home.

**Implemented in #345, checked 30 October 2026.** All six ordinary full-year main-home tables below are **verified, high confidence**, from section 10.3.1 of each official yearly home chapter linked above. These are whole-value rates, not progressive bands. Each lower boundary is exclusive and upper boundary inclusive. The first band (up to €12,500) is zero in every year.

| Year | €12,500–25,000 | €25,000–50,000 | €50,000–75,000 | Above €75,000 up to threshold | Threshold  | Above threshold          |
| ---- | -------------- | -------------- | -------------- | ----------------------------- | ---------- | ------------------------ |
| 2020 | 0.20%          | 0.35%          | 0.45%          | 0.60%                         | €1,090,000 | €6,540 + 2.35% of excess |
| 2021 | 0.20%          | 0.30%          | 0.40%          | 0.50%                         | €1,110,000 | €5,550 + 2.35% of excess |
| 2022 | 0.15%          | 0.25%          | 0.35%          | 0.45%                         | €1,130,000 | €5,085 + 2.35% of excess |
| 2023 | 0.10%          | 0.20%          | 0.25%          | 0.35%                         | €1,200,000 | €4,200 + 2.35% of excess |
| 2024 | 0.10%          | 0.20%          | 0.25%          | 0.35%                         | €1,310,000 | €4,585 + 2.35% of excess |
| 2025 | 0.10%          | 0.20%          | 0.25%          | 0.35%                         | €1,330,000 | €4,655 + 2.35% of excess |

The statutory basis is [Wet IB 2001, articles 3.110–3.112 and 3.123a, 2025 version](https://wetten.overheid.nl/BWBR0011353/2025-03-15#Hoofdstuk3_Afdeling3.6_Artikel3.112). Article 3.112(3) covers absence of a WOZ valuation. The yearly chapters' “Geen WOZ-beschikking” paragraphs expressly require foreign homes' market value on 1 January of the preceding year. Do not use Belgian cadastral income or today's sale price. All years are supported; none were filled by interpolation.

Ownership: calculate the forfait on the **whole** value, then multiply by the user's ownership percentage. The [official 2024 M-return instructions](https://download.belastingdienst.nl/belastingdienst/docs/toelichting_m_biljet_2024_ib3271t41fd.pdf) explicitly allocate the forfait according to ownership. The same share is applied to whole-loan interest in this simplified model. This does not establish entitlement to deduct another owner's costs or model fiscal-partner allocation.

The annual chapters' section 10.4.5 confirms Wet Hillen relief when the forfait exceeds deductible costs, with phased withdrawal: 93.333%, 90%, 86.667%, 83.333%, 80%, and 76⅔% of the positive balance in 2020–2025 respectively. **Positive home income and Wet Hillen are not modelled:** the calculator floors the net deduction at zero and reports `forfait_exceeds_interest`. The 2025 archive prints 76.666%; article 3.123a states the exact 76⅔%. Zero deduction is not a claim that the positive balance is tax-free.

No value entered retains interest-only arithmetic and returns `benefitIsUpperBound` and `home_value_missing`; this is an upper estimate within the simplified model, not a certified refund. A supplied value assumes an ordinary occupied main home for the full year. Partial-year occupation, temporary letting, vacant former/future homes and the special temporary-posting forfait are outside scope; do not enter an adjusted value to simulate these situations.

For a negative balance, the net deduction reduces Dutch taxable income and worldwide premium income consistently with section 1. The rate-cap surcharge still concerns **gross deductible interest**, with the forfait added to the pre-cost base; capping only the net balance would overstate high-bracket relief.

Treaty confidence: the annual foreign-home instructions support including the Belgian main home in this deduction calculation. They do not constitute a full treaty double-tax-relief calculation for every positive balance. No separate treaty exemption or positive-balance outcome is certified here; specialist review remains necessary. Belgian refund reconciliation remains unresolved as described below.

## 3. Belgian code 1250 and exempt Dutch salary: could not verify completely

**2020–2025: could not verify the engine's exact mortgage-related recomputation.** The [FOD foreign-income guidance](https://fin.belgium.be/nl/particulieren/internationaal/buitenlandse-inkomsten-rekeningen/buitenlandse-inkomsten) confirms that Belgian residents declare worldwide income and that treaty-exempt income can influence tax on other income. It does not establish the required year-by-year code-1250 reconciliation after a Dutch mortgage deduction/refund.

The official [2021 foreign-income presentation](https://financien.belgium.be/sites/default/files/downloads/111-buitenlandse-inkomsten-2021.pdf) discusses deducting tax paid abroad. This supports distinguishing salary from foreign tax, but does not verify how a later mortgage-related assessment/refund is allocated between Dutch workdays, Belgian workdays and declaration years. It is not sufficient to certify all six years.

A lower Dutch Box 1 base is not itself a reduction in gross employment pay or a change in treaty workday allocation. A possible change in the Belgian net declared/exempt amount through lower deductible foreign tax is a separate question. The engine's positive `beTaxIncrease` must remain an estimate, not a verified statutory result. No Belgian arithmetic was changed on this evidence. Still needed: an official resident-return instruction or worked example for each income year, treatment of final versus withheld Dutch tax, social-premium deductions, refunds and the matching exempt amount. Non-resident Belgian return instructions are not proof for this Belgian-resident case.

## 4. Maximum deduction rates: verified; unchanged

These cap relief for deductible costs in the highest bracket; they are not a guaranteed refund percentage for every taxpayer.

| Income year | Engine cap | Finding  | Official evidence                                                                                                                                                                                                       |
| ----------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2020        | 46.00%     | Verified | [Ministry policy information 2023, page 1, historical 2020 column](https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/publicaties/2023/04/25/beleidsinformatiekaart-2023/Beleidsinformatiekaart%2B2023.pdf) |
| 2021        | 43.00%     | Verified | [Same published table, 2021 column](https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/publicaties/2023/04/25/beleidsinformatiekaart-2023/Beleidsinformatiekaart%2B2023.pdf)                                |
| 2022        | 40.00%     | Verified | [Same published table, 2022 column](https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/publicaties/2023/04/25/beleidsinformatiekaart-2023/Beleidsinformatiekaart%2B2023.pdf)                                |
| 2023        | 36.93%     | Verified | [Same published table, 2023 column](https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/publicaties/2023/04/25/beleidsinformatiekaart-2023/Beleidsinformatiekaart%2B2023.pdf)                                |
| 2024        | 36.97%     | Verified | [State Secretary's explanation of the 2024 cap and its link to the second bracket](https://zoek.officielebekendmakingen.nl/kst-36602-Z.html)                                                                            |
| 2025        | 37.48%     | Verified | [Belastingdienst, tariefsaanpassing eigen woning, explicit 2025 figure](https://www.belastingdienst.nl/wps/wcm/connect/nl/koopwoning/content/tariefsaanpassing-eigen-woning)                                            |

The Ministry table explicitly lists maximum mortgage/other deduction rates. It resolves the 2023 discrepancy: 36.93%, not an earlier forecast of 36.95%. The parliamentary explanation confirms that the cap follows the second bracket, including after the 2025 split. No parameter correction is warranted. These sources verify the numbers, not every aspect of the engine's surcharge when other deductions or home benefits coexist.

## 5. 90% test, partners and court decisions

**2020–2025 ordinary calculation: verified in the yearly foreign-resident chapters.** The model compares Dutch-taxed income with worldwide income, includes work, pensions, business/other income, substantial interests and savings/investment income, and instructs rounding the percentage down to whole percentages. The engine's floor at 89.5% is consistent with those instructions.

The [2023 income-statement explanation](https://download.belastingdienst.nl/belastingdienst/docs/toel_inkomensverkl_kwali_buit_belastingpl_ib0591t31pl.pdf) confirms that wealth and substantial interests matter, while own-home income and specified deduction/recapture categories are excluded from the 90% calculation. Therefore neither the mortgage deduction nor a salary-only workday split establishes legal eligibility. The single `incomeOutsideNL` input cannot derive all statutory income categories, losses, asset-income rules or their year-specific valuation. Its amount needs to come from the relevant official calculation, not simply gross foreign cash receipts.

The [official explanatory memorandum to the Fiscale verzamelwet 2026, section 2.4](https://www.tweedekamer.nl/kamerstukken/detail?did=2025D19510&id=2025Z08531) describes the existing statutory calculation as using Dutch fiscal measures for non-Dutch income. This is evidence about the pre-change system, not a decision to enable 2026 in this app. It also distinguishes the relaxation of the income-statement requirement from changes to the income test.

**Partner rules: verified in the yearly chapters**, also explained in [Belastingdienst's partner guidance](https://www.belastingdienst.nl/wps/wcm/connect/nl/buitenland/content/wanneer-heb-ik-een-fiscale-partner-als-ik-in-het-buitenland-woon). Qualifying partners can use joint worldwide income for the 90% test. A person can qualify individually while their partner does not; ownership percentage alone does not establish fiscal partnership or an optimal deduction allocation. This engine supports neither a joint test nor allocation.

**Claim that the 2023 cases universally replace Dutch measures with Belgian measures for 2020–2025: could not verify.** The official [A-G conclusion ECLI:NL:PHR:2023:440](https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:PHR:2023:440) discusses assessing the availability of residence-state personal/family benefits under residence-state measures in an EU-law analysis. It is an opinion, concerns 2015 and is not a general amendment of the ordinary statutory test. The reported [24 April 2023 case, ECLI:NL:RBZWB:2023:2777](https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBZWB:2023:2777) could not be retrieved as substantive text from the official endpoint in this session; secondary summaries were not treated as verification.

The [official Rechtspraak referral list, April 2026, page 3](https://www.rechtspraak.nl/binaries/_rts_1775562450548/content/assets/lbvr/ne/2026/lbvr-ne-2026-nieuwsbrief-rechtspraak-europa-hvj-4.pdf) records the related Schumacker referral ECLI:NL:HR:2025:1161 as C-493/25 (Bolring). This verifies a referral, not a final resolution or its current disposition. No universal residence-law algorithm or blanket rejection below 90% can be certified from this research. EU-law exceptions and any subsequent final judgments need specialist review. The engine's “ineligible” is only failure of its simplified ordinary test.

## 6. Conditions the engine cannot check

**Verified in the 2020–2025 yearly home/foreign-resident chapters:** qualifying residence, the income test, qualifying main home and debt, and income-statement requirements. The 2025 foreign-resident chapter expressly waives sending a new statement if the person also qualified in 2024. The [2024 statement instructions](https://download.belastingdienst.nl/belastingdienst/docs/toel_inkomensverkl_kwali_buit_belastingpl_ib0591t41pl.pdf) likewise describe a repeat-filer exception. The engine's statement assumption should not be read as requiring a new certificate every year.

The [official qualifying-non-resident mortgage guidance](https://www.belastingdienst.nl/wps/wcm/connect/nl/buitenland/content/kwalificerend-buitenlands-belastingplichtige-hypotheekrente-aftrekken) explains the 30-year limit, acquisition/improvement purpose and, for new debt from 2013, at least annuity/linear repayment within 30 years. Older debt has transitional rules; pre-2001 loans start the deduction clock in 2001. Refinancing, increases, past deductions, arrears, main-residence use, the bijleenregeling and loan reporting require facts absent from the calculator. The yearly home chapters provide the historical context; a loan date alone cannot prove eligibility.

**Belgian regional benefit interaction: could not verify a complete 2020–2025 coordination rule.** The official regional pages confirm [Flanders' pre-2020 loan boundary](https://www.vlaanderen.be/belastingvermindering-voor-de-enige-en-eigen-woning-woonbonus) and [Brussels' pre-2017 loan boundary and legacy woonbonus regime](https://be.brussels/nl/over-het-gewest/structuur-en-organisatie/overheden-en-instellingen-het-gewest/brussel-fiscaliteit/speciale-diensten-en-ondersteuning-van-brussel-fiscaliteit/de-woonbonus). Abolition for new loans does not eliminate existing benefits. These regional sources are used for their own schemes, not as proof of Dutch deduction entitlement or double-relief coordination. Walloon schemes, legacy loans, actual ability to use Belgian relief and EU-law interaction remain unmodelled. Do not infer that NL relief and a Belgian benefit always combine or always exclude one another.

## Remaining work before treating the feature as verified

- Extend beyond ordinary full-year occupied main homes and model positive balances/Wet Hillen if needed.
- Obtain year-specific Belgian resident-return/refund reconciliation evidence.
- Review EU-law relief outside the ordinary 90% test and subsequent case outcomes.
- Model or clearly constrain partner, other-income, insurance and regional-benefit cases.

The premium-base correction and the ordinary full-year foreign-home forfait are implemented. Unverified Belgian calculations remain unchanged. This document deliberately does not close #341.
