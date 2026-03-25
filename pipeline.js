#!/usr/bin/env node

/**
 * Main pipeline runner for Monitor Cultureel Talent naar de Top.
 *
 * Usage:
 *   node pipeline.js --survey data/survey-2026.csv --reference data/monitor-2025.csv --output ./output
 *
 * Reads survey and reference CSVs, produces:
 *   - Per-org JSON report files in output/reports/
 *   - Excel summary in output/Monitor_2026.xlsx
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { processData } from './report-data-processor.js';
import { generateExcel } from './excel-export.js';

// ── CLI argument parsing ─────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    survey: { type: 'string', short: 's' },
    reference: { type: 'string', short: 'r' },
    output: { type: 'string', short: 'o', default: './output' },
    help: { type: 'boolean', short: 'h', default: false }
  },
  strict: true
});

if (args.help || !args.survey) {
  console.log(`
Monitor Cultureel Talent naar de Top — Data Pipeline

Usage:
  node pipeline.js --survey <path> [--reference <path>] [--output <dir>]

Options:
  --survey, -s      Path to 2026 survey CSV (required)
  --reference, -r   Path to 2025 reference CSV (optional)
  --output, -o      Output directory (default: ./output)
  --help, -h        Show this help message
`);
  process.exit(args.help ? 0 : 1);
}

// ── Validate inputs ──────────────────────────────────────────────────────────

const surveyPath = resolve(args.survey);
if (!existsSync(surveyPath)) {
  console.error(`Error: Survey file not found: ${surveyPath}`);
  process.exit(1);
}

const referencePath = args.reference ? resolve(args.reference) : null;
if (referencePath && !existsSync(referencePath)) {
  console.error(`Error: Reference file not found: ${referencePath}`);
  process.exit(1);
}

const outputDir = resolve(args.output);
const reportsDir = join(outputDir, 'reports');

// ── Create output directories ────────────────────────────────────────────────

mkdirSync(reportsDir, { recursive: true });

// ── Run pipeline ─────────────────────────────────────────────────────────────

console.log('Processing survey data...');
console.log(`  Survey:    ${surveyPath}`);
if (referencePath) console.log(`  Reference: ${referencePath}`);
console.log(`  Output:    ${outputDir}`);
console.log();

const { reports, aggregates, orgs2026 } = processData(surveyPath, referencePath);

console.log(`Found ${orgs2026.length} organisations in survey data.`);
if (referencePath) {
  const matched = reports.filter(r => r.meta.hasPreviousYear).length;
  console.log(`Matched ${matched} organisations to previous year data.`);
}
console.log();

// ── Write per-org JSON reports ───────────────────────────────────────────────

console.log('Writing per-org JSON reports...');
for (let i = 0; i < reports.length; i++) {
  const report = reports[i];
  const safeName = report.meta.orgName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const jsonPath = join(reportsDir, `${safeName}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`  ✓ ${report.meta.orgName} → ${safeName}.json`);
}
console.log();

// ── Generate Excel export ────────────────────────────────────────────────────

const excelPath = join(outputDir, 'Monitor_2026.xlsx');
console.log('Generating Excel export...');
try {
  generateExcel(orgs2026, aggregates, excelPath);
  console.log(`  ✓ ${excelPath}`);
} catch (err) {
  console.error(`  ✗ Excel generation failed: ${err.message}`);
}
console.log();

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('Pipeline complete.');
console.log(`  ${reports.length} JSON reports written to ${reportsDir}`);
console.log(`  Excel export written to ${excelPath}`);
