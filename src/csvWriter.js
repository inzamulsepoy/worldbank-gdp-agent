// ─────────────────────────────────────────────
//  World Bank GDP Agent — CSV Writer
// ─────────────────────────────────────────────

const fs   = require("fs");
const path = require("path");

/**
 * Escape a value for CSV output
 */
function esc(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Write LONG format CSV
 * One row per country / indicator / year
 * Columns: country, country_code, year, indicator_id, indicator_name, value
 */
function writeLongCSV(data, filePath) {
  const headers = ["country", "country_code", "year", "indicator_id", "indicator_name", "value"];
  const lines = [headers.join(",")];

  for (const d of data) {
    lines.push([
      esc(d.country),
      esc(d.countryCode),
      d.year,
      esc(d.indicatorId),
      esc(d.indicatorName),
      d.value,
    ].join(","));
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  return lines.length - 1; // row count excluding header
}

/**
 * Write WIDE format CSV
 * One row per country / year, each indicator as its own column
 * Columns: country, country_code, year, [indicator names...]
 */
function writeWideCSV(data, indicators, filePath) {
  // Build pivot map: "countryCode|year" → record
  const pivot = {};

  for (const d of data) {
    const key = `${d.countryCode}|${d.year}`;
    if (!pivot[key]) {
      pivot[key] = {
        country:     d.country,
        country_code: d.countryCode,
        year:        d.year,
      };
    }
    // Use sanitised column name (no commas or quotes)
    const col = d.indicatorName.replace(/[",]/g, "");
    pivot[key][col] = d.value;
  }

  const indicatorCols = indicators.map((m) => m.name.replace(/[",]/g, ""));
  const headers = ["country", "country_code", "year", ...indicatorCols];
  const lines   = [headers.join(",")];

  const rows = Object.values(pivot).sort((a, b) => {
    const cc = a.country.localeCompare(b.country);
    return cc !== 0 ? cc : a.year - b.year;
  });

  for (const row of rows) {
    lines.push([
      esc(row.country),
      esc(row.country_code),
      row.year,
      ...indicatorCols.map((col) => esc(row[col] ?? "")),
    ].join(","));
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  return lines.length - 1;
}

/**
 * Write a metadata JSON file alongside the CSV
 */
function writeMetadata(meta, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(meta, null, 2), "utf-8");
}

module.exports = { writeLongCSV, writeWideCSV, writeMetadata };
