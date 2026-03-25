/**
 * Pipeline Runner
 * Wires together the data processor and Excel export.
 *
 * Data sources:
 *   - 2026 survey: Google Sheets (new format, 0-3 Likert)
 *   - 2025 reference: CSV export from colleague's Excel (1-4 Likert)
 *
 * Outputs:
 *   1. Per-org report data objects (for PDF generation)
 *   2. Excel file matching colleague's layout (for sanity checking)
 *
 * Usage:
 *   node pipeline.js --survey ./data/survey-2026.csv --reference ./data/monitor-2025.csv --output ./output
 */
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ReportDataProcessor } from './report-data-processor.js';
import { generateExcel } from './excel-export.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG = {
  currentYear: 2026,
  previousYear: 2025,
  likertOffset: 1, // new survey stores 0-3, display is 1-4
  outputDir: './output',
};

// ---------------------------------------------------------------------------
// CSV / Sheet parsing
// ---------------------------------------------------------------------------

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(raw, {
    header: true,
    dynamicTyping: false,    // keep as strings, we'll convert ourselves
    skipEmptyLines: true,
    delimitersToGuess: [',', ';', '\t'],
  });

  // Strip whitespace from headers
  if (result.meta.fields) {
    result.meta.fields = result.meta.fields.map(f => f.trim());
  }

  // Strip whitespace from row keys
  result.data = result.data.map(row => {
    const clean = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k.trim()] = v;
    }
    return clean;
  });

  return result.data;
}

function parseGoogleSheet(filePath) {
  // Google Sheets CSV export — same parser, different source
  // If using the Sheets API directly, swap this for the API call
  return parseCSV(filePath);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateSurveyRow(row, index) {
  const errors = [];
  if (!row.organisatie) {
    errors.push(`Row ${index}: missing organisatie`);
  }

  // Check Likert values are in expected range (0-3 for new survey)
  const likertPrefixes = ['leid', 'strat', 'hr', 'comm', 'kennis', 'klimaat'];
  const likertCounts = { leid: 5, strat: 8, hr: 14, comm: 5, kennis: 8, klimaat: 6 };

  for (const prefix of likertPrefixes) {
    for (let i = 1; i <= likertCounts[prefix]; i++) {
      const key = `${prefix}_${i}`;
      const val = row[key];
      if (val !== undefined && val !== null && val !== '') {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0 || n > 3) {
          errors.push(`Row ${index} [${row.organisatie}]: ${key} = "${val}" (expected 0-3)`);
        }
      }
    }
  }

  return errors;
}

function validateReferenceRow(row, index) {
  const errors = [];
  const nameCol = 'Naam organisatie:';
  if (!row[nameCol]) {
    errors.push(`Reference row ${index}: missing organisation name`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Matching report: verify org-name matching between years
// ---------------------------------------------------------------------------

function reportMatching(surveyRows, referenceRows) {
  const surveyOrgs = surveyRows
    .filter(r => r.organisatie)
    .map(r => r.organisatie);

  const refOrgs = referenceRows
    .filter(r => r['Naam organisatie:'])
    .map(r => r['Naam organisatie:']);

  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const matched = [];
  const unmatched = [];

  for (const org of surveyOrgs) {
    const normOrg = normalize(org);
    const match = refOrgs.find(r => normalize(r) === normOrg);
    if (match) {
      matched.push({ current: org, previous: match });
    } else {
      unmatched.push(org);
    }
  }

  return { matched, unmatched };
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export function runPipeline(surveyPath, referencePath, outputDir) {
  const outDir = outputDir || CONFIG.outputDir;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('=== Monitor Pipeline ===');
  console.log(`Current year: ${CONFIG.currentYear}`);
  console.log(`Previous year: ${CONFIG.previousYear}`);
  console.log('');

  // --- 1. Parse input files ---
  console.log('Parsing survey data...');
  const surveyRows = parseGoogleSheet(surveyPath)
    .filter(r => r.organisatie); // drop empty rows
  console.log(`  Found ${surveyRows.length} organisations in ${CONFIG.currentYear} survey`);

  console.log('Parsing reference data...');
  const referenceRows = parseCSV(referencePath)
    .filter(r => r['Naam organisatie:']); // drop empty/aggregate rows
  console.log(`  Found ${referenceRows.length} organisations in ${CONFIG.previousYear} reference`);
  console.log('');

  // --- 2. Validate ---
  console.log('Validating...');
  const allErrors = [];
  surveyRows.forEach((row, i) => {
    allErrors.push(...validateSurveyRow(row, i + 1));
  });
  referenceRows.forEach((row, i) => {
    allErrors.push(...validateReferenceRow(row, i + 1));
  });

  if (allErrors.length > 0) {
    console.warn(`  ⚠ ${allErrors.length} validation warnings:`);
    allErrors.forEach(e => console.warn(`    ${e}`));
  } else {
    console.log('  ✓ All rows valid');
  }
  console.log('');

  // --- 3. Check org matching ---
  console.log('Matching organisations between years...');
  const { matched, unmatched } = reportMatching(surveyRows, referenceRows);
  console.log(`  ✓ ${matched.length} matched:`);
  matched.forEach(m => console.log(`    "${m.current}" ↔ "${m.previous}"`));
  if (unmatched.length > 0) {
    console.warn(`  ⚠ ${unmatched.length} unmatched (new orgs or name changes):`);
    unmatched.forEach(u => console.warn(`    "${u}" — no previous year data`));
  }
  console.log('');

  // --- 4. Process ---
  console.log('Processing report data...');
  const processor = new ReportDataProcessor(surveyRows, referenceRows);
  const allReports = processor.generateAllReports();
  console.log(`  ✓ Generated ${allReports.length} report objects`);
  console.log('');

  // --- 5. Output: individual report JSONs ---
  console.log('Writing report JSONs...');
  const reportsDir = path.join(outDir, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  for (const report of allReports) {
    const safeName = report.meta.orgName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const filePath = path.join(reportsDir, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`  → ${filePath}`);
  }
  console.log('');

  // --- 6. Output: colleague's Excel ---
  console.log('Generating Excel for colleague...');
  const wb = generateExcel(surveyRows, allReports);
  const excelPath = path.join(outDir, `Monitor_${CONFIG.currentYear}.xlsx`);
  XLSX.writeFile(wb, excelPath);
  console.log(`  → ${excelPath}`);
  console.log('');

  // --- 7. Summary ---
  console.log('=== Summary ===');
  console.log(`Reports generated: ${allReports.length}`);
  console.log(`  With YoY data:  ${allReports.filter(r => r.meta.hasPreviousData).length}`);
  console.log(`  New orgs:       ${allReports.filter(r => !r.meta.hasPreviousData).length}`);
  console.log(`Excel output:     ${excelPath}`);
  console.log(`Report JSONs:     ${reportsDir}/`);
  console.log('');

  return { allReports, excelPath };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node pipeline.js --survey <path> --reference <path> [--output <dir>]

  --survey     Path to 2026 survey CSV (Google Sheets export)
  --reference  Path to 2025 reference CSV (colleague's Excel export)
  --output     Output directory (default: ./output)
  `);
  process.exit(0);
}

const surveyIdx = args.indexOf('--survey');
const refIdx = args.indexOf('--reference');
const outIdx = args.indexOf('--output');

if (surveyIdx === -1 || refIdx === -1) {
  console.error('Missing required arguments. Use --help for usage.');
  process.exit(1);
}

const surveyPath = args[surveyIdx + 1];
const referencePath = args[refIdx + 1];
const outputDir = outIdx !== -1 ? args[outIdx + 1] : CONFIG.outputDir;

runPipeline(surveyPath, referencePath, outputDir);
