// Whole files that hold no interface copy: authored data and development fixtures. Keep this list short and
// give each entry a reason; a trailing slash matches a directory.
export const excludedFiles = {};
// Functions that only log for developers; their string arguments are not interface copy.
export const diagnosticCallees = [];
// Exact source/value exclusions. Never approve a whole component or directory for visible copy.
export const exclusions = {
  "App.tsx": {
    "&nbsp;|&nbsp;": "HTML entity separator",
    Belastingdienst: "tax authority name",
    "&amp;": "HTML entity separator",
    "FOD Financiën": "tax authority name",
  },
  "components/AppNavbar.tsx": {
    "🇧🇪&thinsp;🇳🇱": "flag emoji",
    Bordertax: "fixed application brand",
  },
  "components/FilingChecklist.tsx": {
    "Mijn Belastingdienst": "official portal name",
    "MyMinfin / Tax-on-web": "official portal name",
  },
  "components/PageHero.tsx": {
    "🇧🇪&thinsp;🇳🇱&nbsp;": "flag emoji",
  },
  "components/SummaryResult.tsx": {
    "━━━ Bordertax ·": "fixed application brand in the copied summary header",
  },
  "pages/PensionReference.tsx": {
    "🇳🇱 NL": "country code badge",
    "🇧🇪 BE": "country code badge",
    "&nbsp;|&nbsp;": "HTML entity separator",
    "acvgrensarbeiders.be": "domain name",
  },
  "pages/SalarySplitReference.tsx": {
    "Vak IV O.1": "Belgian tax form box reference",
    "Vak IV O.2": "Belgian tax form box reference",
    "MOTIV (fgov.be)": "official service name",
    "&nbsp; |&nbsp;": "HTML entity separator",
    "acvgrensarbeiders.be": "domain name",
  },
  "pages/reference/components.tsx": {
    "flex justify-between items-baseline py-2 px-4 ref-stat-row": "CSS class list",
  },
};
