/**
 * Data parsing and transformation module.
 * Handles CSV parsing, score calculation, and collective statistics.
 */

const DIMENSIONS = [
  { key: 'lead',  label: 'Leiderschap',              count: 5,  prefix: 'lead_' },
  { key: 'strat', label: 'Strategie en management',   count: 8,  prefix: 'strat_' },
  { key: 'hr',    label: 'HR management',             count: 14, prefix: 'hr_' },
  { key: 'comm',  label: 'Communicatie',              count: 5,  prefix: 'comm_' },
  { key: 'know',  label: 'Kennis en vaardigheden',    count: 8,  prefix: 'know_' },
  { key: 'clim',  label: 'Klimaat',                   count: 6,  prefix: 'clim_' }
];

const QUANT_CATEGORIES = [
  { key: 'top',    label: 'Top' },
  { key: 'subtop', label: 'Subtop' },
  { key: 'org',    label: 'Gehele organisatie' },
  { key: 'rvb',    label: 'RvB' },
  { key: 'rvc',    label: 'RvC/RvT' }
];

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).replace(',', '.').replace('%', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function getDimensionScores(row, dim) {
  const scores = [];
  for (let i = 1; i <= dim.count; i++) {
    const v = parseNumber(row[dim.prefix + i]);
    if (v !== null) scores.push(v);
  }
  return scores;
}

function getDimensionAvg(row, dim) {
  const scores = getDimensionScores(row, dim);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

const ITEM_LABELS = {
  lead_: [
    'Visie op diversiteit',
    'Betrokkenheid top',
    'Voorbeeldgedrag',
    'Aansturing beleid',
    'Verantwoording resultaten'
  ],
  strat_: [
    'Diversiteit in strategie',
    'Doelstellingen geformuleerd',
    'Actieplannen opgesteld',
    'Budget gealloceerd',
    'Monitoring voortgang',
    'Bijsturing bij afwijking',
    'Externe benchmarking',
    'Rapportage aan bestuur'
  ],
  hr_: [
    'Inclusieve werving',
    'Diverse selectiecommissies',
    'Objectieve selectiecriteria',
    'Onboarding programma',
    'Mentoring & sponsoring',
    'Talentontwikkeling',
    'Doorstroombeleid',
    'Beoordelingssystematiek',
    'Beloning en erkenning',
    'Flexibel werken',
    'Verlof- en feestdagenbeleid',
    'Exitgesprekken diversiteit',
    'Data-analyse HR-processen',
    'Diversiteit in HR-team'
  ],
  comm_: [
    'Interne communicatie',
    'Externe communicatie',
    'Beeldvorming en taalgebruik',
    'Rolmodellen zichtbaar',
    'Communicatie naar stakeholders'
  ],
  know_: [
    'Bewustwordingstraining',
    'Inclusief leiderschap',
    'Interculturele competenties',
    'Onbewuste vooroordelen',
    'Kennisdeling best practices',
    'Externe expertise',
    'Evaluatie trainingen',
    'Continu leren'
  ],
  clim_: [
    'Psychologische veiligheid',
    'Inclusieve teamcultuur',
    'Medewerkersonderzoek',
    'Klachtenprocedure',
    'Netwerken en ERGs',
    'Waardering verschillen'
  ]
};

function getDimensionItems(row, dim) {
  const items = [];
  const labels = ITEM_LABELS[dim.prefix] || [];
  for (let i = 1; i <= dim.count; i++) {
    items.push({
      label: labels[i - 1] || `${dim.label} ${i}`,
      score: parseNumber(row[dim.prefix + i]) || 1
    });
  }
  return items;
}

function calcBoxplotStats(values) {
  if (!values.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const q = (p) => {
    const pos = (n - 1) * p;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };
  return {
    min: sorted[0],
    q1: q(0.25),
    median: q(0.5),
    q3: q(0.75),
    max: sorted[n - 1]
  };
}

function processCSV(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  // Process each organization
  const orgs = rows.map(row => {
    const org = {
      name: (row.org_name || '').trim(),
      raw: row,
      dimensionAvgs: [],
      dimensionItems: [],
      streefcijfer: parseNumber(row.streefcijfer_top),
      quant: {},
      prevQuant: {}
    };

    // Qualitative dimension averages and items
    DIMENSIONS.forEach(dim => {
      org.dimensionAvgs.push(getDimensionAvg(row, dim));
      org.dimensionItems.push(getDimensionItems(row, dim));
    });

    // Quantitative current year
    QUANT_CATEGORIES.forEach(cat => {
      org.quant[cat.key] = {
        pct: parseNumber(row['pct_' + cat.key]),
        n: parseNumber(row['n_' + cat.key])
      };
    });

    // Quantitative previous year
    QUANT_CATEGORIES.forEach(cat => {
      org.prevQuant[cat.key] = {
        pct: parseNumber(row['prev_pct_' + cat.key]),
        n: parseNumber(row['prev_n_' + cat.key])
      };
    });

    return org;
  }).filter(o => o.name);

  // Collective statistics
  const collective = {
    avgStreefcijfer: 0,
    dimensionAvgs: new Array(6).fill(0),
    dimensionMaxes: new Array(6).fill(0),
    quantStats: {},
    boxplotAll: { min: 0, q1: 0, median: 0, q3: 0, max: 0 },
    boxplotWithTarget: { min: 0, q1: 0, median: 0, q3: 0, max: 0 }
  };

  if (orgs.length > 0) {
    // Average streefcijfer
    const streefs = orgs.map(o => o.streefcijfer).filter(v => v !== null);
    collective.avgStreefcijfer = streefs.length ? streefs.reduce((a, b) => a + b, 0) / streefs.length : 0;

    // Per-dimension avg and max
    for (let d = 0; d < 6; d++) {
      const vals = orgs.map(o => o.dimensionAvgs[d]);
      collective.dimensionAvgs[d] = vals.reduce((a, b) => a + b, 0) / vals.length;
      collective.dimensionMaxes[d] = Math.max(...vals);
    }

    // Quantitative min/avg/max per category
    QUANT_CATEGORIES.forEach(cat => {
      const pcts = orgs.map(o => o.quant[cat.key].pct).filter(v => v !== null);
      if (pcts.length) {
        collective.quantStats[cat.key] = {
          min: Math.min(...pcts),
          avg: pcts.reduce((a, b) => a + b, 0) / pcts.length,
          max: Math.max(...pcts)
        };
      } else {
        collective.quantStats[cat.key] = { min: 0, avg: 0, max: 0 };
      }
    });

    // Boxplot stats
    const allTopPcts = orgs.map(o => o.quant.top.pct).filter(v => v !== null);
    collective.boxplotAll = calcBoxplotStats(allTopPcts);

    const targetTopPcts = orgs.filter(o => o.streefcijfer !== null).map(o => o.quant.top.pct).filter(v => v !== null);
    collective.boxplotWithTarget = calcBoxplotStats(targetTopPcts);
  }

  return { orgs, collective };
}
