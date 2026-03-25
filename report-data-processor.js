/**
 * Data extraction, transformation, and aggregation for per-org report JSON.
 *
 * Reads 2026 survey CSV and 2025 reference CSV, matches orgs between years,
 * and produces the complete data structure needed for each org's PDF factsheet.
 */

import Papa from 'papaparse';
import { readFileSync } from 'node:fs';
import {
  DIMENSIONS,
  QUANT_FIELDS,
  STREEF_FIELDS,
  ORG_NAME_KEY_2026,
  ORG_NAME_HEADER_2025,
  QUANT_ROWS
} from './survey/survey-questions.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).replace(',', '.').replace('%', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function round1(n) {
  return n === null ? null : Math.round(n * 10) / 10;
}

function safePct(numerator, denominator) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return round1((numerator / denominator) * 100);
}

function mean(arr) {
  const valid = arr.filter(v => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/**
 * Fuzzy name matching: lowercase, strip common suffixes and punctuation.
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\bn\.?v\.?\b/gi, '')
    .replace(/\bb\.?v\.?\b/gi, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── CSV Parsing ──────────────────────────────────────────────────────────────

function parseCSVFile(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  return result.data;
}

// ── 2025 Reference Data Extraction ───────────────────────────────────────────

/**
 * Extract previous-year quantitative data and Likert dimension averages
 * from the 2025 reference CSV row.
 *
 * 2025 data uses Likert 1–4 natively (no conversion needed).
 * 2025 has precomputed "Totaalscore" columns per dimension.
 */
function extract2025Row(row) {
  const orgName = (row[ORG_NAME_HEADER_2025] || '').trim();
  if (!orgName) return null;

  const quant = {};

  // Werknemers
  const werkTotal = parseNumber(row[QUANT_FIELDS.werknemers.total.header2025]);
  const werkBE = parseNumber(row[QUANT_FIELDS.werknemers.be.header2025]);
  quant.werknemers = { total: werkTotal, be: werkBE, pct: safePct(werkBE, werkTotal) };

  // Top
  const topTotal = parseNumber(row[QUANT_FIELDS.top.total.header2025]);
  const topBE = parseNumber(row[QUANT_FIELDS.top.be.header2025]);
  quant.top = { total: topTotal, be: topBE, pct: safePct(topBE, topTotal) };

  // Subtop
  const subTotal = parseNumber(row[QUANT_FIELDS.subtop.total.header2025]);
  const subBE = parseNumber(row[QUANT_FIELDS.subtop.be.header2025]);
  quant.subtop = { total: subTotal, be: subBE, pct: safePct(subBE, subTotal) };

  // RvB
  const rvbTotal = parseNumber(row[QUANT_FIELDS.rvb.total.header2025]);
  const rvbBE = parseNumber(row[QUANT_FIELDS.rvb.be.header2025]);
  quant.rvb = { total: rvbTotal, be: rvbBE, pct: safePct(rvbBE, rvbTotal) };

  // RvC
  const rvcTotal = parseNumber(row[QUANT_FIELDS.rvc.total.header2025]);
  const rvcBE = parseNumber(row[QUANT_FIELDS.rvc.be.header2025]);

  // RvT
  const rvtTotal = parseNumber(row[QUANT_FIELDS.rvt.total.header2025]);
  const rvtBE = parseNumber(row[QUANT_FIELDS.rvt.be.header2025]);

  // Combined RvC/RvT
  const rvcRvtTotal = (rvcTotal || 0) + (rvtTotal || 0);
  const rvcRvtBE = (rvcBE || 0) + (rvtBE || 0);
  const hasRvcRvt = rvcTotal !== null || rvtTotal !== null;
  quant.rvc_rvt = hasRvcRvt
    ? { total: rvcRvtTotal, be: rvcRvtBE, pct: safePct(rvcRvtBE, rvcRvtTotal) }
    : null;

  // Likert dimension averages from 2025 (using Totaalscore columns or computing from items)
  const dimAverages = {};
  for (const dim of DIMENSIONS) {
    // Try to find a Totaalscore column first
    const totaalKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('totaalscore') &&
      k.toLowerCase().includes(dim.label.toLowerCase().split(' ')[0].toLowerCase())
    );
    if (totaalKey && parseNumber(row[totaalKey]) !== null) {
      dimAverages[dim.key] = round1(parseNumber(row[totaalKey]));
    } else {
      // Compute from individual items
      const scores = [];
      for (const item of dim.items) {
        const val = parseNumber(row[item.fullText2025]);
        if (val !== null) scores.push(val);
      }
      dimAverages[dim.key] = scores.length > 0 ? round1(mean(scores)) : null;
    }
  }

  return { orgName, normalizedName: normalizeName(orgName), quant, dimAverages };
}

// ── 2026 Survey Data Extraction ──────────────────────────────────────────────

/**
 * Extract current-year data from a 2026 survey CSV row.
 * Likert values are 0–3 in the CSV; we convert to 1–4 for display.
 */
function extract2026Row(row) {
  const orgName = (row[ORG_NAME_KEY_2026] || '').trim();
  if (!orgName) return null;

  // Streefcijfer
  const hasStreef = (row[STREEF_FIELDS.has.key2026] || '').toLowerCase();
  const streefcijfer = (hasStreef === 'ja' || hasStreef === 'yes' || hasStreef === '1')
    ? parseNumber(row[STREEF_FIELDS.pct.key2026])
    : null;

  // Quantitative data
  const quant = {};

  // Werknemers
  const werkTotal = parseNumber(row[QUANT_FIELDS.werknemers.total.key2026]);
  const werkBE = parseNumber(row[QUANT_FIELDS.werknemers.be.key2026]);
  quant.werknemers = { total: werkTotal, be: werkBE, pct: safePct(werkBE, werkTotal) };

  // Top
  const topTotal = parseNumber(row[QUANT_FIELDS.top.total.key2026]);
  const topBE = parseNumber(row[QUANT_FIELDS.top.be.key2026]);
  quant.top = { total: topTotal, be: topBE, pct: safePct(topBE, topTotal) };

  // Subtop
  const subTotal = parseNumber(row[QUANT_FIELDS.subtop.total.key2026]);
  const subBE = parseNumber(row[QUANT_FIELDS.subtop.be.key2026]);
  quant.subtop = { total: subTotal, be: subBE, pct: safePct(subBE, subTotal) };

  // RvB
  const rvbTotal = parseNumber(row[QUANT_FIELDS.rvb.total.key2026]);
  const rvbBE = parseNumber(row[QUANT_FIELDS.rvb.be.key2026]);
  quant.rvb = { total: rvbTotal, be: rvbBE, pct: safePct(rvbBE, rvbTotal) };

  // RvC
  const hasRvc = (row[QUANT_FIELDS.rvc.has.key2026] || '').toLowerCase();
  const rvcTotal = (hasRvc === 'ja' || hasRvc === 'yes' || hasRvc === '1')
    ? parseNumber(row[QUANT_FIELDS.rvc.total.key2026]) : null;
  const rvcBE = rvcTotal !== null ? parseNumber(row[QUANT_FIELDS.rvc.be.key2026]) : null;

  // RvT
  const hasRvt = (row[QUANT_FIELDS.rvt.has.key2026] || '').toLowerCase();
  const rvtTotal = (hasRvt === 'ja' || hasRvt === 'yes' || hasRvt === '1')
    ? parseNumber(row[QUANT_FIELDS.rvt.total.key2026]) : null;
  const rvtBE = rvtTotal !== null ? parseNumber(row[QUANT_FIELDS.rvt.be.key2026]) : null;

  // Combined RvC/RvT
  const hasRvcRvt = rvcTotal !== null || rvtTotal !== null;
  if (hasRvcRvt) {
    const combinedTotal = (rvcTotal || 0) + (rvtTotal || 0);
    const combinedBE = (rvcBE || 0) + (rvtBE || 0);
    quant.rvc_rvt = { total: combinedTotal, be: combinedBE, pct: safePct(combinedBE, combinedTotal) };
  } else {
    quant.rvc_rvt = null;
  }

  // Likert items per dimension (convert 0–3 → 1–4)
  const likert = {};
  for (const dim of DIMENSIONS) {
    const items = [];
    const scores = [];
    for (const item of dim.items) {
      const raw = parseNumber(row[item.key]);
      const converted = raw !== null ? raw + 1 : null; // 0–3 → 1–4
      const score = converted !== null ? Math.max(1, Math.min(4, converted)) : null;
      items.push({
        key: item.key,
        label: item.shortLabel,
        score
      });
      if (score !== null) scores.push(score);
    }
    likert[dim.key] = {
      label: dim.label,
      items,
      average: scores.length > 0 ? round1(mean(scores)) : null
    };
  }

  return {
    orgName,
    normalizedName: normalizeName(orgName),
    streefcijfer,
    quant,
    likert
  };
}

// ── Aggregation ──────────────────────────────────────────────────────────────

function computeAggregates(orgs2026) {
  const quantAgg = {};

  // Min/gem/max for each quantitative category
  for (const rowDef of QUANT_ROWS) {
    const pcts = orgs2026
      .map(o => {
        if (rowDef.key === 'rvc_rvt') return o.quant.rvc_rvt ? o.quant.rvc_rvt.pct : null;
        return o.quant[rowDef.key] ? o.quant[rowDef.key].pct : null;
      })
      .filter(v => v !== null);

    if (pcts.length > 0) {
      quantAgg[rowDef.key] = {
        min: round1(Math.min(...pcts)),
        gemiddeld: round1(mean(pcts)),
        max: round1(Math.max(...pcts))
      };
    } else {
      quantAgg[rowDef.key] = { min: null, gemiddeld: null, max: null };
    }
  }

  // Streefcijfer average (only orgs that have one)
  const streefValues = orgs2026
    .map(o => o.streefcijfer)
    .filter(v => v !== null);
  const avgStreefcijfer = streefValues.length > 0 ? round1(mean(streefValues)) : null;

  // Dimension aggregates: average and benchmark (max) across all orgs
  const dimAggregates = {};
  for (const dim of DIMENSIONS) {
    const avgs = orgs2026
      .map(o => o.likert[dim.key].average)
      .filter(v => v !== null);

    dimAggregates[dim.key] = {
      label: dim.label,
      average: avgs.length > 0 ? round1(mean(avgs)) : null,
      benchmark: avgs.length > 0 ? round1(Math.max(...avgs)) : null
    };
  }

  return { quantAgg, avgStreefcijfer, dimAggregates };
}

// ── YoY Table ────────────────────────────────────────────────────────────────

function buildYoYTable(currentQuant, previousQuant) {
  const rows = [];
  for (const rowDef of QUANT_ROWS) {
    const curQ = rowDef.key === 'rvc_rvt' ? currentQuant.rvc_rvt : currentQuant[rowDef.key];
    const prevQ = previousQuant
      ? (rowDef.key === 'rvc_rvt' ? previousQuant.rvc_rvt : previousQuant[rowDef.key])
      : null;

    if (curQ === null) {
      rows.push({ label: rowDef.label, current: null, previous: null, voortgang: null });
      continue;
    }

    const currentPct = curQ.pct;
    const previousPct = prevQ ? prevQ.pct : null;
    const voortgang = (currentPct !== null && previousPct !== null)
      ? round1(currentPct - previousPct)
      : null;

    rows.push({
      label: rowDef.label,
      current: {
        aantal: curQ.be,
        total: curQ.total,
        percentage: currentPct
      },
      previous: prevQ ? {
        aantal: prevQ.be,
        total: prevQ.total,
        percentage: previousPct
      } : null,
      voortgang
    });
  }
  return rows;
}

// ── Benchmark Table ──────────────────────────────────────────────────────────

function buildBenchmarkTable(currentQuant, quantAgg) {
  const rows = [];
  for (const rowDef of QUANT_ROWS) {
    const curQ = rowDef.key === 'rvc_rvt' ? currentQuant.rvc_rvt : currentQuant[rowDef.key];
    const agg = quantAgg[rowDef.key];

    rows.push({
      label: rowDef.label,
      orgPct: curQ ? curQ.pct : null,
      min: agg.min,
      gemiddeld: agg.gemiddeld,
      max: agg.max
    });
  }
  return rows;
}

// ── Main Processing ──────────────────────────────────────────────────────────

/**
 * Process survey and reference CSV files and produce per-org report data.
 *
 * @param {string} surveyPath - Path to 2026 survey CSV
 * @param {string} referencePath - Path to 2025 reference CSV (optional)
 * @returns {{ reports: object[], aggregates: object, orgs2026: object[], orgs2025: object[] }}
 */
export function processData(surveyPath, referencePath) {
  // Parse 2026 survey
  const surveyRows = parseCSVFile(surveyPath);
  const orgs2026 = surveyRows.map(extract2026Row).filter(Boolean);

  // Parse 2025 reference (if provided)
  let orgs2025 = [];
  if (referencePath) {
    try {
      const refRows = parseCSVFile(referencePath);
      orgs2025 = refRows.map(extract2025Row).filter(Boolean);
    } catch (err) {
      console.warn(`Warning: Could not read reference file: ${err.message}`);
    }
  }

  // Build name lookup for 2025 data
  const ref2025Map = new Map();
  for (const org of orgs2025) {
    ref2025Map.set(org.normalizedName, org);
  }

  // Compute aggregates across all 2026 orgs
  const { quantAgg, avgStreefcijfer, dimAggregates } = computeAggregates(orgs2026);

  // Build per-org reports
  const reports = orgs2026.map(org => {
    // Match to previous year
    const prev = ref2025Map.get(org.normalizedName) || null;

    const meta = {
      orgName: org.orgName,
      year: 2026,
      hasPreviousYear: prev !== null
    };

    const currentQuant = org.quant;
    const previousQuant = prev ? prev.quant : null;

    const yoyTable = buildYoYTable(currentQuant, previousQuant);
    const benchmarkTable = buildBenchmarkTable(currentQuant, quantAgg);

    const streefComparison = {
      orgStreefcijfer: org.streefcijfer,
      avgStreefcijfer,
      orgTopPct: org.quant.top ? org.quant.top.pct : null
    };

    const currentLikert = {};
    for (const dim of DIMENSIONS) {
      currentLikert[dim.key] = org.likert[dim.key];
    }

    const previousLikert = prev ? prev.dimAverages : null;

    return {
      meta,
      currentQuant,
      previousQuant,
      yoyTable,
      benchmarkTable,
      streefComparison,
      currentLikert,
      previousLikert,
      dimAggregates
    };
  });

  return { reports, aggregates: { quantAgg, avgStreefcijfer, dimAggregates }, orgs2026, orgs2025 };
}
