/**
 * Excel export module — generates the colleague's familiar Excel layout.
 *
 * Returns a workbook object (caller writes it via XLSX.writeFile).
 *
 * Output structure:
 * - Row 1: full question-text headers (2025 format)
 * - Rows 2–N: one row per org, Likert converted to 1–4, Totaalscore columns
 * - Below data: cross-calculation zones
 */

import * as XLSX from 'xlsx';
import {
  DIMENSIONS,
  QUANT_FIELDS,
  STREEF_FIELDS,
  ORG_NAME_HEADER_2025,
  QUANT_ROWS
} from './survey/survey-questions.js';

function round1(n) {
  return n === null || n === undefined ? null : Math.round(n * 10) / 10;
}

function mean(arr) {
  const valid = arr.filter(v => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).replace(',', '.').replace('%', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Build the header row with full Dutch question text (2025 format).
 */
function buildHeaders() {
  const headers = [ORG_NAME_HEADER_2025];

  // Streefcijfer columns
  headers.push(STREEF_FIELDS.has.header2025);
  headers.push(STREEF_FIELDS.pct.header2025);

  // Quantitative columns
  for (const catKey of ['werknemers', 'top', 'subtop', 'rvb', 'rvc', 'rvt']) {
    const cat = QUANT_FIELDS[catKey];
    if (cat.has) headers.push(cat.has.header2025);
    headers.push(cat.total.header2025);
    headers.push(cat.be.header2025);
  }

  // Likert dimension columns with Totaalscore
  for (const dim of DIMENSIONS) {
    for (const item of dim.items) {
      headers.push(item.fullText2025);
    }
    headers.push(`Totaalscore ${dim.label}`);
  }

  return headers;
}

/**
 * Build a data row for one organisation from raw survey row + report data.
 */
function buildOrgRow(surveyRow, report) {
  const row = [report.meta.orgName];

  // Streefcijfer
  row.push(report.streefComparison.orgStreefcijfer !== null ? 'Ja' : 'Nee');
  row.push(report.streefComparison.orgStreefcijfer);

  // Quantitative columns: werknemers, top, subtop (no "has" column)
  for (const catKey of ['werknemers', 'top', 'subtop']) {
    const q = report.currentQuant[catKey];
    row.push(q ? q.total : null);
    row.push(q ? q.be : null);
  }

  // RvB (with has column)
  const rvb = report.currentQuant.rvb;
  row.push(rvb && rvb.total !== null ? 'Ja' : 'Nee');
  row.push(rvb ? rvb.total : null);
  row.push(rvb ? rvb.be : null);

  // RvC (with has column) — we read raw survey data for separate rvc/rvt
  const hasRvc = (surveyRow.heeft_rvc || '').toLowerCase();
  row.push(hasRvc === 'ja' || hasRvc === 'yes' || hasRvc === '1' ? 'Ja' : 'Nee');
  row.push(parseNumber(surveyRow.aantal_rvc));
  row.push(parseNumber(surveyRow.rvc_buiten_europa));

  // RvT (with has column)
  const hasRvt = (surveyRow.heeft_rvt || '').toLowerCase();
  row.push(hasRvt === 'ja' || hasRvt === 'yes' || hasRvt === '1' ? 'Ja' : 'Nee');
  row.push(parseNumber(surveyRow.aantal_rvt));
  row.push(parseNumber(surveyRow.rvt_buiten_europa));

  // Likert items per dimension (already in 1–4 scale in report)
  for (const dim of DIMENSIONS) {
    const dimData = report.currentLikert[dim.key];
    const scores = [];
    for (const item of dimData.items) {
      row.push(item.score);
      if (item.score !== null) scores.push(item.score);
    }
    // Totaalscore = dimension average
    row.push(scores.length > 0 ? round1(mean(scores)) : null);
  }

  return row;
}

/**
 * Build the cross-calculation zones below the data rows.
 */
function buildSummaryZones(reports) {
  const zones = [];

  // Blank separator row
  zones.push([]);

  // Streefcijfer summary
  zones.push(['Streefcijfer samenvatting']);
  const orgsWithStreef = reports.filter(r => r.streefComparison.orgStreefcijfer !== null);
  zones.push(['Aantal organisaties met streefcijfer', orgsWithStreef.length]);
  zones.push(['Gemiddeld streefcijfer', reports[0]?.streefComparison.avgStreefcijfer ?? null]);

  zones.push([]);

  // Cijfers Top: gem/min/max — from first report's benchmarkTable (same for all)
  zones.push(['Cijfers Top - Buiten-Europa']);
  zones.push(['', 'Gemiddeld', 'Minimum', 'Maximum']);
  if (reports.length > 0) {
    for (const row of reports[0].benchmarkTable) {
      zones.push([row.label, row.gemiddeld, row.min, row.max]);
    }
  }

  zones.push([]);

  // Zes dimensies grid — from first report's dimAggregates (same for all)
  zones.push(['Zes dimensies - Gemiddeld en Benchmark']);
  zones.push(['Dimensie', 'Gemiddeld', 'Benchmark (max)']);
  if (reports.length > 0) {
    for (const dim of DIMENSIONS) {
      const agg = reports[0].dimAggregates[dim.key];
      zones.push([dim.label, agg.average, agg.benchmark]);
    }
  }

  return zones;
}

/**
 * Generate the Excel workbook. Returns a workbook object.
 *
 * @param {object[]} surveyRows - Raw parsed survey CSV rows
 * @param {object[]} allReports - Generated report objects
 * @returns {XLSX.WorkBook} Workbook ready for XLSX.writeFile()
 */
export function generateExcel(surveyRows, allReports) {
  const headers = buildHeaders();

  // Build org-name lookup for survey rows
  const surveyByName = new Map();
  for (const row of surveyRows) {
    if (row.organisatie) {
      surveyByName.set(row.organisatie.trim(), row);
    }
  }

  // Build data rows by matching reports to their raw survey rows
  const dataRows = allReports.map(report => {
    const surveyRow = surveyByName.get(report.meta.orgName) || {};
    return buildOrgRow(surveyRow, report);
  });

  const summaryZones = buildSummaryZones(allReports);

  // Combine all rows
  const allRows = [headers, ...dataRows, ...summaryZones];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths (first column wider for org names)
  ws['!cols'] = [{ wch: 30 }];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monitor 2026');

  return wb;
}
