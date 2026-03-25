# CLAUDE.md — Monitor Cultureel Talent naar de Top
## What this project does
Automates the production of per-organisation PDF factsheets for the "Cultureel Talent naar de Top" monitoring programme. Previously done manually in MS Word + Adobe Illustrator from Excel data. Now automated end-to-end.
## The pipeline
```
Google Sheets (2026 survey) ─┐
                              ├─→ pipeline.js ─→ per-org JSON ─→ PDF generator
CSV (2025 reference data)  ──┘                 ─→ Excel export (for colleague)
```
### Input 1: 2026 survey data
- Source: Google Sheets CSV export
- One row per organisation
- Column names use short keys: `organisatie`, `leid_1`, `strat_3`, `aantal_werknemers`, etc.
- **Likert scale is 0–3** (Niet=0, Enigszins=1, Grotendeels=2, Volledig=3)
- Full field list defined in `survey/survey-questions.js`
### Input 2: 2025 reference data
- Source: CSV export from colleague's Excel
- One row per organisation
- Column names are the full Dutch question text (very long headers)
- **Likert scale is 1–4** (same labels, different numbering)
- Has computed "Totaalscore" columns per dimension
- Organisation name column: `Naam organisatie:`
- See `data/monitor-2025.csv` for the reference file
### Output 1: per-org report JSON
Each JSON contains everything needed to render one org's PDF:
- `meta` — org name, year, whether previous year data exists
- `currentQuant` — headcounts and percentages for werknemers/top/subtop/rvb/rvc/rvt
- `previousQuant` — same structure from 2025 (null if org is new)
- `yoyTable` — 5-row year-over-year comparison (aantal, percentage, voortgang in procentpunten)
- `benchmarkTable` — org vs min/gem/max of all orgs in current year
- `streefComparison` — org's streefcijfer vs average of all orgs with a streefcijfer
- `currentLikert` — per-dimension: item scores (1–4), short labels, dimension average
- `previousLikert` — dimension averages from 2025 (for YoY comparison)
- `dimAggregates` — overall average and benchmark (max) per dimension across all orgs
### Output 2: Excel for colleague
Reproduces the familiar Excel layout she's been working with:
- Row 1: full question-text headers (old format)
- Rows 2–N: one row per org, Likert converted to 1–4, Totaalscore columns computed
- Below data: cross-calculation zones (streefcijfer summary, Cijfers Top with gem/min/max, Zes dimensies grid, benchmark)
## Critical data rules
### Likert conversion
- New survey: 0–3 → display as 1–4 (add +1)
- Minimum displayable score is **1.0**, maximum is **4.0**
- Never display 0 — that would mean "below Niet" which doesn't exist
- Dimension average = mean of all items in that dimension, rounded to 1 decimal
### Percentage calculations
- `pctTop = top_buiten_europa / aantal_top × 100`, rounded to 1 decimal
- Same pattern for subtop, organisatie, rvb
- **RvC and RvT are combined** into one "rvc/rvt" figure: sum both totals, sum both BE counts, then divide
- If an org has neither RvC nor RvT, the rvc/rvt row is null
### Year-over-year
- `voortgang = current_percentage - previous_percentage` (in procentpunten, 1 decimal)
- Org matching between years uses fuzzy name matching: lowercase, strip N.V./BV/punctuation
- If an org has no previous year data, YoY columns show as empty (not zero)
### Aggregates (min/gem/max)
- Computed across ALL orgs in the current year dataset
- `gemiddeld` = mean of all org percentages for that category
- `min` and `max` = lowest and highest org percentage
- For streefcijfer average: only count orgs that HAVE a streefcijfer
### Dimension aggregates
- `averages[dim]` = mean of all orgs' dimension averages
- `benchmark[dim]` = highest single org's dimension average (not highest individual item)
## Report structure (PDF pages)
The PDF factsheet has 9 pages. Currently only the tables are automated; charts come later.
| Page | Content | Data source |
|------|---------|-------------|
| 1 | Cover (org name, year, concentric circles graphic) | meta.orgName |
| 2 | Introduction (static text) | — |
| 3 | Radar chart + dimension descriptions | currentLikert dimension averages |
| 4 | Maturity phases (Oriëntatie → Beheersing) | derived from dimension averages |
| 5 | Three radar charts (org / gemiddelde / benchmark) | currentLikert, dimAggregates |
| 6 | YoY table + streefcijfer comparison | yoyTable, streefComparison |
| 7 | Benchmark table + box-and-whisker chart | benchmarkTable, quantAggregates |
| 8 | Likert bar charts (Leiderschap, Strategie, HR) | currentLikert items |
| 9 | Likert bar charts (Communicatie, Kennis, Klimaat) + colophon | currentLikert items |
## File structure
```
project/
├── CLAUDE.md                    ← this file
├── pipeline.js                  ← main runner (CLI entry point)
├── report-data-processor.js     ← data extraction, transformation, aggregation
├── excel-export.js              ← generates colleague's Excel
├── survey/
│   └── survey-questions.js      ← survey structure definition
├── data/
│   ├── survey-2026.csv          ← current year input
│   └── monitor-2025.csv         ← previous year reference
├── output/
│   ├── reports/                 ← per-org JSON files
│   │   ├── ABN_AMRO.json
│   │   ├── Dura_Vermeer.json
│   │   └── ...
│   └── Monitor_2026.xlsx        ← colleague's Excel
└── pdf/                         ← PDF generator (TODO)
```
## Dependencies
- `papaparse` — CSV parsing
- `xlsx` (SheetJS) — Excel generation
- Node.js ES modules
## Running
```bash
node pipeline.js --survey data/survey-2026.csv --reference data/monitor-2025.csv --output ./output
```
## What's NOT yet built
- PDF generation (the actual report rendering)
- Radar charts (concentric circles — previous version exists on GitHub)
- Box-and-whisker chart (page 7)
- Likert horizontal bar charts (pages 8–9)
- Google Sheets API integration (currently expects CSV export)
- Maturity phase derivation logic (page 4 — needs business rules for mapping scores to phases)
## Column reference
### 2026 survey → 2025 Excel header mapping
| 2026 key | 2025 Excel header |
|----------|-------------------|
| `organisatie` | `Naam organisatie:` |
| `streefcijfer` | `Heeft u een streefcijfer voor het aandeel mensen met herkomst Buiten-Europa in de top?` |
| `streefcijfer_percentage` | `Zo ja, welk percentage gebruikt u voor dit streefcijfer?` |
| `aantal_werknemers` | `2a. Aantal werknemers in de organisatie:` |
| `werknemers_buiten_europa` | `2b. Aantal werknemers met herkomst Buiten-Europa in de organisatie:` |
| `aantal_top` | `2c. Aantal werknemers in de top:` |
| `top_buiten_europa` | `2d1. Aantal werknemers met herkomst Buiten-Europa in de top:` |
| `aantal_subtop` | `2f. Aantal werknemers in de subtop:` |
| `subtop_buiten_europa` | `2g1. Aantal werknemers met herkomst Buiten-Europa in de subtop:` |
| `heeft_rvb` | `2h. Heeft u een (Raad van) Bestuur?` |
| `aantal_rvb` | `2i1. Aantal mensen in de Raad van Bestuur:` |
| `rvb_buiten_europa` | `2i2. Aantal mensen met herkomst Buiten-Europa in de Raad van Bestuur:` |
| `heeft_rvc` | `2j. Heeft u een Raad van Commissarissen?` |
| `aantal_rvc` | `2k1. Aantal mensen in de Raad van Commissarissen:` |
| `rvc_buiten_europa` | `2k2. Aantal mensen met herkomst Buiten-Europa in de Raad van Commissarissen:` |
| `heeft_rvt` | `2l. Heeft u een Raad van Toezicht?` |
| `aantal_rvt` | `2m1. Aantal mensen in de Raad van Toezicht:` |
| `rvt_buiten_europa` | `2m2. Aantal mensen met herkomst Buiten-Europa in de Raad van Toezicht:` |
| `leid_1` through `leid_5` | `[1. De top heeft zich verbonden...]` through `[5. De top neemt eindverantwoordelijkheid...]` |
| `strat_1` through `strat_8` | Strategy Likert items |
| `hr_1` through `hr_14` | HR Likert items |
| `comm_1` through `comm_5` | Communication Likert items |
| `kennis_1` through `kennis_8` | Knowledge Likert items |
| `klimaat_1` through `klimaat_6` | Climate Likert items |
Likert values: 2026 stores 0–3, 2025 stores 1–4. Always convert to 1–4 for display and computation.
