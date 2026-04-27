// ─────────────────────────────────────────────
//  World Bank GDP Agent — API Fetcher
// ─────────────────────────────────────────────

const axios = require("axios");
const { WB_API_BASE, DEFAULTS } = require("./config");

/**
 * Sleep helper for rate-limiting between requests
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch one indicator for one country over a year range.
 * Returns array of { country, countryCode, year, indicatorId, indicatorName, value }
 *
 * @param {string} countryCode  - ISO2 code e.g. "US"
 * @param {object} indicator    - { id, name, desc }
 * @param {number} fromYear
 * @param {number} toYear
 * @param {number} retries      - number of retry attempts on failure
 */
async function fetchIndicator(countryCode, indicator, fromYear, toYear, retries = 3) {
  const url =
    `${WB_API_BASE}/country/${countryCode}/indicator/${indicator.id}` +
    `?date=${fromYear}:${toYear}&format=json&per_page=500`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { timeout: 15000 });
      const payload = res.data;

      // World Bank returns [metadata, data] or [metadata, null] on no data
      if (!Array.isArray(payload) || !payload[1]) return [];

      return payload[1]
        .filter((d) => d.value !== null && d.value !== undefined)
        .map((d) => ({
          country:       d.country?.value || countryCode,
          countryCode:   d.countryiso3code || countryCode,
          year:          parseInt(d.date),
          indicatorId:   indicator.id,
          indicatorName: indicator.name,
          value:         d.value,
        }));
    } catch (err) {
      if (attempt === retries) {
        throw new Error(
          `Failed after ${retries} attempts: ${err.message} [${countryCode}/${indicator.id}]`
        );
      }
      // Exponential back-off: 500ms, 1000ms, 2000ms
      await sleep(500 * Math.pow(2, attempt - 1));
    }
  }
  return [];
}

/**
 * Fetch all combinations of countries × indicators × year range.
 * Calls onProgress(done, total, country, indicator, rows) after each call.
 *
 * @param {string[]} countryCodes
 * @param {object[]} indicators
 * @param {number}   fromYear
 * @param {number}   toYear
 * @param {function} onProgress
 * @param {function} onError
 */
async function fetchAll(countryCodes, indicators, fromYear, toYear, onProgress, onError) {
  const results = [];
  const total = countryCodes.length * indicators.length;
  let done = 0;

  for (const code of countryCodes) {
    for (const indicator of indicators) {
      try {
        const rows = await fetchIndicator(code, indicator, fromYear, toYear);
        results.push(...rows);
        done++;
        if (onProgress) onProgress(done, total, code, indicator, rows);
      } catch (err) {
        done++;
        if (onError) onError(done, total, code, indicator, err);
      }
      // Polite delay between requests
      await sleep(DEFAULTS.delayMs);
    }
  }

  return results;
}

module.exports = { fetchIndicator, fetchAll };
