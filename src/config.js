// ─────────────────────────────────────────────
//  World Bank GDP Agent — Configuration
// ─────────────────────────────────────────────

const COUNTRIES = [
  { code: "US",  name: "United States",   flag: "🇺🇸" },
  { code: "CN",  name: "China",           flag: "🇨🇳" },
  { code: "JP",  name: "Japan",           flag: "🇯🇵" },
  { code: "DE",  name: "Germany",         flag: "🇩🇪" },
  { code: "IN",  name: "India",           flag: "🇮🇳" },
  { code: "GB",  name: "United Kingdom",  flag: "🇬🇧" },
  { code: "FR",  name: "France",          flag: "🇫🇷" },
  { code: "BR",  name: "Brazil",          flag: "🇧🇷" },
  { code: "CA",  name: "Canada",          flag: "🇨🇦" },
  { code: "AU",  name: "Australia",       flag: "🇦🇺" },
  { code: "KR",  name: "South Korea",     flag: "🇰🇷" },
  { code: "RU",  name: "Russia",          flag: "🇷🇺" },
  { code: "MX",  name: "Mexico",          flag: "🇲🇽" },
  { code: "ID",  name: "Indonesia",       flag: "🇮🇩" },
  { code: "BD",  name: "Bangladesh",      flag: "🇧🇩" },
  { code: "NG",  name: "Nigeria",         flag: "🇳🇬" },
  { code: "ZA",  name: "South Africa",    flag: "🇿🇦" },
  { code: "EG",  name: "Egypt",           flag: "🇪🇬" },
  { code: "PK",  name: "Pakistan",        flag: "🇵🇰" },
  { code: "AR",  name: "Argentina",       flag: "🇦🇷" },
];

const INDICATORS = [
  {
    id:   "NY.GDP.MKTP.CD",
    name: "GDP (Current USD)",
    desc: "Gross domestic product in current US dollars"
  },
  {
    id:   "NY.GDP.MKTP.KD.ZG",
    name: "GDP Growth (%)",
    desc: "Annual percentage growth rate of GDP"
  },
  {
    id:   "NY.GDP.PCAP.CD",
    name: "GDP per Capita (USD)",
    desc: "GDP divided by midyear population, current USD"
  },
  {
    id:   "NY.GDP.PCAP.KD.ZG",
    name: "GDP per Capita Growth (%)",
    desc: "Annual percentage growth rate of GDP per capita"
  },
  {
    id:   "NE.EXP.GNFS.ZS",
    name: "Exports (% of GDP)",
    desc: "Exports of goods and services as % of GDP"
  },
  {
    id:   "NE.IMP.GNFS.ZS",
    name: "Imports (% of GDP)",
    desc: "Imports of goods and services as % of GDP"
  },
  {
    id:   "NE.GDI.TOTL.ZS",
    name: "Gross Capital Formation (% GDP)",
    desc: "Fixed assets plus net changes in inventories"
  },
  {
    id:   "FP.CPI.TOTL.ZG",
    name: "Inflation (CPI %)",
    desc: "Annual consumer price index change"
  },
];

const DEFAULTS = {
  countries:  ["US", "IN", "CN", "DE", "GB"],
  indicators: ["NY.GDP.MKTP.CD", "NY.GDP.MKTP.KD.ZG", "NY.GDP.PCAP.CD"],
  fromYear:   2000,
  toYear:     2023,
  format:     "wide",          // "wide" | "long"
  outputDir:  "./output",
  delayMs:    200,             // delay between API calls (ms) to avoid rate limits
};

const WB_API_BASE = "https://api.worldbank.org/v2";

module.exports = { COUNTRIES, INDICATORS, DEFAULTS, WB_API_BASE };
