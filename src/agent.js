// ─────────────────────────────────────────────
//  World Bank GDP Agent — Main CLI Entry Point
// ─────────────────────────────────────────────

const path      = require("path");
const inquirer  = require("inquirer");
const chalk     = require("chalk");
const ora       = require("ora");

const { COUNTRIES, INDICATORS, DEFAULTS } = require("./config");
const { fetchAll }                          = require("./fetcher");
const { writeLongCSV, writeWideCSV, writeMetadata } = require("./csvWriter");

// ── Banner ──────────────────────────────────────────────────────────────────
function printBanner() {
  console.log(chalk.cyan.bold("\n╔══════════════════════════════════════════╗"));
  console.log(chalk.cyan.bold("║   🌍  World Bank GDP Data Agent  🌍      ║"));
  console.log(chalk.cyan.bold("║   CodingBolt — Agentic AI Workflow       ║"));
  console.log(chalk.cyan.bold("╚══════════════════════════════════════════╝\n"));
}

// ── Interactive prompts ──────────────────────────────────────────────────────
async function promptUser() {
  const answers = await inquirer.prompt([
    {
      type:    "checkbox",
      name:    "countries",
      message: "Select countries to fetch:",
      choices: COUNTRIES.map((c) => ({
        name:    `${c.flag}  ${c.name}`,
        value:   c.code,
        checked: DEFAULTS.countries.includes(c.code),
      })),
      validate: (v) => v.length > 0 || "Select at least one country.",
    },
    {
      type:    "checkbox",
      name:    "indicators",
      message: "Select indicators:",
      choices: INDICATORS.map((ind) => ({
        name:    `${ind.name}  ${chalk.gray("— " + ind.desc)}`,
        value:   ind.id,
        checked: DEFAULTS.indicators.includes(ind.id),
      })),
      validate: (v) => v.length > 0 || "Select at least one indicator.",
    },
    {
      type:    "input",
      name:    "fromYear",
      message: "Start year:",
      default: String(DEFAULTS.fromYear),
      validate: (v) => /^\d{4}$/.test(v) || "Enter a 4-digit year.",
    },
    {
      type:    "input",
      name:    "toYear",
      message: "End year:",
      default: String(DEFAULTS.toYear),
      validate: (v) => /^\d{4}$/.test(v) || "Enter a 4-digit year.",
    },
    {
      type:    "list",
      name:    "format",
      message: "Output CSV format:",
      choices: [
        { name: "Wide  (one row per country/year, indicators as columns)", value: "wide" },
        { name: "Long  (one row per country/indicator/year)",              value: "long" },
      ],
      default: DEFAULTS.format,
    },
    {
      type:    "input",
      name:    "outputDir",
      message: "Output directory:",
      default: DEFAULTS.outputDir,
    },
  ]);

  return {
    countryCodes: answers.countries,
    indicators:   INDICATORS.filter((i) => answers.indicators.includes(i.id)),
    fromYear:     parseInt(answers.fromYear),
    toYear:       parseInt(answers.toYear),
    format:       answers.format,
    outputDir:    answers.outputDir,
  };
}

// ── Agent run ────────────────────────────────────────────────────────────────
async function runAgent(config) {
  const { countryCodes, indicators, fromYear, toYear, format, outputDir } = config;

  console.log(chalk.bold("\n▶  Agent Configuration"));
  console.log(chalk.gray("   Countries  :"), chalk.white(countryCodes.join(", ")));
  console.log(chalk.gray("   Indicators :"), chalk.white(indicators.map((i) => i.name).join(", ")));
  console.log(chalk.gray("   Years      :"), chalk.white(`${fromYear} → ${toYear}`));
  console.log(chalk.gray("   Format     :"), chalk.white(format));
  console.log(chalk.gray("   Output dir :"), chalk.white(outputDir));
  console.log();

  const spinner = ora("Connecting to World Bank Open Data API...").start();
  const allRows = [];
  let errors    = 0;

  const startTime = Date.now();

  await fetchAll(
    countryCodes,
    indicators,
    fromYear,
    toYear,
    // onProgress
    (done, total, code, indicator, rows) => {
      const country = COUNTRIES.find((c) => c.code === code);
      spinner.text =
        chalk.cyan(`[${done}/${total}]`) +
        ` ${country?.flag || ""} ${country?.name || code} — ${indicator.name}` +
        chalk.green(` (${rows.length} records)`);
      allRows.push(...rows);
    },
    // onError
    (done, total, code, indicator, err) => {
      errors++;
      spinner.text =
        chalk.red(`[${done}/${total}] ✗`) +
        ` ${code} — ${indicator.name}: ${err.message}`;
    }
  );

  spinner.succeed(chalk.green(`Fetch complete — ${allRows.length} records in ${((Date.now() - startTime) / 1000).toFixed(1)}s`));
  if (errors > 0) console.log(chalk.yellow(`  ⚠  ${errors} request(s) failed (skipped)`));

  // ── Write CSV ────────────────────────────────────────────────────────────
  const timestamp  = new Date().toISOString().slice(0, 10);
  const csvName    = `worldbank_gdp_${format}_${fromYear}_${toYear}_${timestamp}.csv`;
  const metaName   = `worldbank_gdp_${format}_${fromYear}_${toYear}_${timestamp}.meta.json`;
  const csvPath    = path.join(outputDir, csvName);
  const metaPath   = path.join(outputDir, metaName);

  const writeSpinner = ora("Writing CSV...").start();

  let rowCount;
  if (format === "long") {
    rowCount = writeLongCSV(allRows, csvPath);
  } else {
    rowCount = writeWideCSV(allRows, indicators, csvPath);
  }

  // Metadata
  const meta = {
    generated:    new Date().toISOString(),
    source:       "World Bank Open Data API v2",
    format,
    fromYear,
    toYear,
    countries:    countryCodes,
    indicators:   indicators.map((i) => ({ id: i.id, name: i.name })),
    totalRecords: allRows.length,
    csvRows:      rowCount,
    errors,
  };
  writeMetadata(meta, metaPath);

  writeSpinner.succeed(chalk.green(`CSV saved → ${csvPath}`));
  console.log(chalk.gray(`  Metadata  → ${metaPath}`));

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(chalk.bold("\n✅  Summary"));
  console.log(chalk.gray("   Total data points :"), chalk.white(allRows.length.toLocaleString()));
  console.log(chalk.gray("   CSV rows written  :"), chalk.white(rowCount.toLocaleString()));
  console.log(chalk.gray("   Countries fetched :"), chalk.white([...new Set(allRows.map((r) => r.country))].join(", ")));
  console.log(chalk.gray("   Year span         :"), chalk.white(`${fromYear} – ${toYear}`));
  console.log(chalk.gray("   Errors / skipped  :"), errors > 0 ? chalk.yellow(errors) : chalk.green(0));
  console.log();

  return { csvPath, metaPath, rowCount, totalRecords: allRows.length };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  try {
    const config = await promptUser();
    await runAgent(config);
  } catch (err) {
    if (err.name === "ExitPromptError") {
      console.log(chalk.yellow("\nAgent cancelled."));
    } else {
      console.error(chalk.red("\n✗ Agent error:"), err.message);
      process.exit(1);
    }
  }
}

main();

module.exports = { runAgent };
