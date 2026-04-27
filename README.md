# 🌍 World Bank GDP Agent
**CodingBolt — Agentic AI Workflow**

Fetch GDP and economic indicators from the World Bank Open Data API and export them as structured CSV files. Run as a CLI tool or via a browser UI.

---

## 📁 Project Structure

```
worldbank-gdp-agent/
├── src/
│   ├── agent.js       ← CLI entry point (interactive prompts)
│   ├── server.js      ← Express web server (browser UI)
│   ├── fetcher.js     ← World Bank API calls + retry logic
│   ├── csvWriter.js   ← Wide & Long CSV builders
│   └── config.js      ← Countries, indicators, defaults
├── public/
│   └── index.html     ← Browser UI (dark theme)
├── output/            ← Generated CSV + metadata files
└── package.json
```

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2a. Run CLI (interactive terminal prompts)
npm start

# 2b. Run browser UI
npm run ui
# Opens http://localhost:3333 automatically
```

---

## 🖥️ CLI Mode (`npm start`)

Interactive prompts guide you through:
- ✅ Select countries (checkbox list)
- ✅ Select indicators (GDP, growth %, per capita, exports, etc.)
- ✅ Set year range
- ✅ Choose Wide or Long CSV format
- ✅ Choose output directory

Output is saved to `./output/` with a timestamped filename and a `.meta.json` sidecar.

---

## 🌐 Browser UI (`npm run ui`)

Dark-themed dashboard at `http://localhost:3333`:
- Click chips to select countries and indicators
- Set date range and format
- Live agent log with SSE (Server-Sent Events) streaming
- Progress bar per API call
- Preview table + one-click CSV download
- List of previously downloaded files

---

## 📊 CSV Formats

### Wide Format
One row per country/year — indicators as columns:

| country | country_code | year | GDP (Current USD) | GDP Growth (%) | GDP per Capita |
|---------|-------------|------|-------------------|----------------|----------------|
| India   | IND         | 2020 | 2.66T             | -6.6           | 1927           |

### Long Format
One row per country/indicator/year:

| country | country_code | year | indicator_id       | indicator_name    | value  |
|---------|-------------|------|--------------------|-------------------|--------|
| India   | IND         | 2020 | NY.GDP.MKTP.CD     | GDP (Current USD) | 2.66T  |

---

## 🔧 Available Indicators

| ID | Name |
|----|------|
| `NY.GDP.MKTP.CD`    | GDP (Current USD) |
| `NY.GDP.MKTP.KD.ZG` | GDP Growth (%) |
| `NY.GDP.PCAP.CD`    | GDP per Capita (USD) |
| `NY.GDP.PCAP.KD.ZG` | GDP per Capita Growth (%) |
| `NE.EXP.GNFS.ZS`   | Exports (% of GDP) |
| `NE.IMP.GNFS.ZS`   | Imports (% of GDP) |
| `NE.GDI.TOTL.ZS`   | Gross Capital Formation (% GDP) |
| `FP.CPI.TOTL.ZG`   | Inflation (CPI %) |

---

## 🛠️ Tech Stack

### Runtime & Language
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | ≥ 18.x | JavaScript runtime |
| JavaScript (ES6+) | — | No TypeScript, no build step |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express.js | Web server for browser UI mode |
| Server-Sent Events (SSE) | Real-time agent progress streaming to browser |
| Node.js `fs` module | File writing for CSV and metadata |

### Frontend
| Technology | Purpose |
|-----------|---------|
| Plain HTML + CSS + Vanilla JS | Zero frameworks, zero build tooling |
| Inter + JetBrains Mono | Fonts via Google Fonts |
| CSS Variables | Dark theme, fully customisable |

### CLI
| Package | Purpose |
|---------|---------|
| `inquirer` | Interactive terminal prompts — checkboxes, lists, inputs |
| `chalk` | Colored terminal output |
| `ora` | Terminal spinner for live feedback |

### Data Fetching
| Technology | Purpose |
|-----------|---------|
| `axios` | HTTP client with timeout + exponential backoff retry |
| World Bank Open Data API v2 | Free public REST API — no API key required |

### CSV & Output
| Technology | Purpose |
|-----------|---------|
| Custom CSV builder | Wide and long format with proper value escaping |
| `.meta.json` sidecar | Metadata per run — countries, indicators, timestamps, error count |

### Dev Tooling
| Package | Purpose |
|---------|---------|
| `open` | Auto-opens browser when UI server starts |
| `npm` | Package manager |
| `.gitignore` | Excludes `node_modules/` and `output/` |

> **No database. No auth. No frontend framework. No build tool.**
> Intentionally lean — runs anywhere Node.js is installed.

---

## ⚙️ Customisation

Edit `src/config.js` to:
- Add more countries (any ISO2 code supported by World Bank)
- Add more indicators (any World Bank indicator ID)
- Change default selections and delay between API calls

---

## 🔑 API

Uses the **World Bank Open Data API v2** — free, no API key required.

Base URL: `https://api.worldbank.org/v2`

---

*Built by CodingBolt*
