// ─────────────────────────────────────────────
//  World Bank GDP Agent — Express Web Server
// ─────────────────────────────────────────────

const express = require("express");
const path    = require("path");
const fs      = require("fs");
const open    = require("open");

const { fetchAll }                          = require("./fetcher");
const { writeLongCSV, writeWideCSV, writeMetadata } = require("./csvWriter");
const { COUNTRIES, INDICATORS, DEFAULTS }  = require("./config");

const app  = express();
const PORT = 3333;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ── API: get config ──────────────────────────────────────────────────────────
app.get("/api/config", (req, res) => {
  res.json({ COUNTRIES, INDICATORS, DEFAULTS });
});

// ── API: list downloaded files ───────────────────────────────────────────────
app.get("/api/files", (req, res) => {
  const dir = path.join(__dirname, "../output");
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => {
      const stat = fs.statSync(path.join(dir, f));
      return { name: f, size: stat.size, created: stat.birthtime };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));
  res.json(files);
});

// ── API: download a file ─────────────────────────────────────────────────────
app.get("/api/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../output", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.download(filePath);
});

// ── API: run agent (SSE stream) ───────────────────────────────────────────────
app.post("/api/run", async (req, res) => {
  const { countryCodes, indicatorIds, fromYear, toYear, format } = req.body;

  const indicators = INDICATORS.filter((i) => indicatorIds.includes(i.id));

  // Server-Sent Events for live progress
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  send("start", { total: countryCodes.length * indicators.length });

  const allRows = [];
  let errors    = 0;

  await fetchAll(
    countryCodes,
    indicators,
    fromYear,
    toYear,
    (done, total, code, indicator, rows) => {
      allRows.push(...rows);
      const country = COUNTRIES.find((c) => c.code === code);
      send("progress", {
        done, total, code,
        country: country?.name || code,
        flag:    country?.flag || "",
        indicator: indicator.name,
        rows:    rows.length,
      });
    },
    (done, total, code, indicator, err) => {
      errors++;
      send("error", { done, total, code, indicator: indicator.name, message: err.message });
    }
  );

  // Write files
  const timestamp = new Date().toISOString().slice(0, 10);
  const csvName   = `worldbank_gdp_${format}_${fromYear}_${toYear}_${timestamp}.csv`;
  const metaName  = `worldbank_gdp_${format}_${fromYear}_${toYear}_${timestamp}.meta.json`;
  const outputDir = path.join(__dirname, "../output");
  const csvPath   = path.join(outputDir, csvName);
  const metaPath  = path.join(outputDir, metaName);

  let rowCount;
  if (format === "long") {
    rowCount = writeLongCSV(allRows, csvPath);
  } else {
    rowCount = writeWideCSV(allRows, indicators, csvPath);
  }

  writeMetadata({
    generated:    new Date().toISOString(),
    source:       "World Bank Open Data API v2",
    format, fromYear, toYear, countryCodes,
    indicators:   indicators.map((i) => ({ id: i.id, name: i.name })),
    totalRecords: allRows.length,
    csvRows:      rowCount,
    errors,
  }, metaPath);

  send("done", {
    totalRecords: allRows.length,
    csvRows:      rowCount,
    csvFile:      csvName,
    errors,
  });

  res.end();
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌍  World Bank GDP Agent UI`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
  open(`http://localhost:${PORT}`);
});
