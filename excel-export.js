/**
 * Excel export module — generates the colleague's familiar Excel layout.
 *
 * Output structure:
 * - Row 1: full question-text headers (2025 format)
 * - Rows 2–N: one row per org, Likert converted to 1–4, Totaalscore columns
 * - Below data: cross-calculation zones
 */

import XLSX from 'xlsx';
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
 * Build a data row for one organisation.
 */
function buildOrgRow(org) {
  const row = [org.orgName];

  // Streefcijfer
  row.push(org.streefcijfer !== null ? 'Ja' : 'Nee');
  row.push(org.streefcijfer);

  // Quantitative columns
  for (const catKey of ['werknemers', 'top', 'subtop']) {
    const q = org.quant[catKey];
    row.push(q ? q.total : null);
    row.push(q ? q.be : null);
  }

  // RvB (with has column)
  const rvb = org.quant.rvb;
  row.push(rvb && rvb.total !== null ? 'Ja' : 'Nee');
  row.push(rvb ? rvb.total : null);
  row.push(rvb ? rvb.be : null);

  // RvC - extract from rvc_rvt combined or separate if available
  // We store rvc separately in the original data, so check quant
  const hasRvc = org.quant.rvc_rvt !== null; // Simplified: if rvc_rvt exists, assume rvc
  row.push(hasRvc ? 'Ja' : 'Nee');
  row.push(org.quant.rvc_rvt ? org.quant.rvc_rvt.total : null);
  row.push(org.quant.rvc_rvt ? org.quant.rvc_rvt.be : null);

  // RvT placeholder (combined into rvc_rvt in processing)
  row.push(null); // heeft_rvt
  row.push(null); // aantal_rvt
  row.push(null); // rvt_buiten_europa

  // Likert items per dimension (already in 1–4 scale)
  for (const dim of DIMENSIONS) {
    const dimData = org.likert[dim.key];
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
function buildSummaryZones(orgs2026, aggregates) {
  const zones = [];

  // Blank separator row
  zones.push([]);

  // Streefcijfer summary
  zones.push(['Streefcijfer samenvatting']);
  const orgsWithStreef = orgs2026.filter(o => o.streefcijfer !== null);
  zones.push(['Aantal organisaties met streefcijfer', orgsWithStreef.length]);
  zones.push(['Gemiddeld streefcijfer', aggregates.avgStreefcijfer]);

  zones.push([]);

  // Cijfers Top: gem/min/max
  zones.push(['Cijfers Top - Buiten-Europa']);
  zones.push(['', 'Gemiddeld', 'Minimum', 'Maximum']);
  for (const rowDef of QUANT_ROWS) {
    const agg = aggregates.quantAgg[rowDef.key];
    zones.push([rowDef.label, agg.gemiddeld, agg.min, agg.max]);
  }

  zones.push([]);

  // Zes dimensies grid
  zones.push(['Zes dimensies - Gemiddeld en Benchmark']);
  zones.push(['Dimensie', 'Gemiddeld', 'Benchmark (max)']);
  for (const dim of DIMENSIONS) {
    const agg = aggregates.dimAggregates[dim.key];
    zones.push([dim.label, agg.average, agg.benchmark]);
  }

  return zones;
}

/**
 * Generate the Excel workbook and write to file.
 *
 * @param {object[]} orgs2026 - Processed 2026 org data
 * @param {object} aggregates - Computed aggregates
 * @param {string} outputPath - Output .xlsx file path
 */
export function generateExcel(orgs2026, aggregates, outputPath) {
  const headers = buildHeaders();
  const dataRows = orgs2026.map(buildOrgRow);
  const summaryZones = buildSummaryZones(orgs2026, aggregates);

  // Combine all rows
  const allRows = [headers, ...dataRows, ...summaryZones];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths (first column wider for org names)
  ws['!cols'] = [{ wch: 30 }];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monitor 2026');

  // Write file
  XLSX.writeFile(wb, outputPath);
}
