/**
 * Survey structure definition for "Cultureel Talent naar de Top" monitor.
 *
 * Defines all dimensions, their items, short keys (2026 format),
 * display labels, and the full Dutch question text (2025 format).
 */

export const DIMENSIONS = [
  {
    key: 'leid',
    label: 'Leiderschap',
    prefix: 'leid_',
    count: 5,
    items: [
      {
        key: 'leid_1',
        shortLabel: 'Visie op diversiteit',
        fullText2025: '1. De top heeft zich verbonden aan een visie op culturele diversiteit'
      },
      {
        key: 'leid_2',
        shortLabel: 'Betrokkenheid top',
        fullText2025: '2. De top is actief betrokken bij het diversiteitsbeleid'
      },
      {
        key: 'leid_3',
        shortLabel: 'Voorbeeldgedrag',
        fullText2025: '3. De top toont voorbeeldgedrag op het gebied van inclusie'
      },
      {
        key: 'leid_4',
        shortLabel: 'Aansturing beleid',
        fullText2025: '4. De top stuurt actief op de uitvoering van het diversiteitsbeleid'
      },
      {
        key: 'leid_5',
        shortLabel: 'Verantwoording resultaten',
        fullText2025: '5. De top neemt eindverantwoordelijkheid voor resultaten op diversiteit'
      }
    ]
  },
  {
    key: 'strat',
    label: 'Strategie en management',
    prefix: 'strat_',
    count: 8,
    items: [
      {
        key: 'strat_1',
        shortLabel: 'Diversiteit in strategie',
        fullText2025: '1. Culturele diversiteit is opgenomen in de organisatiestrategie'
      },
      {
        key: 'strat_2',
        shortLabel: 'Doelstellingen geformuleerd',
        fullText2025: '2. Er zijn concrete doelstellingen geformuleerd voor culturele diversiteit'
      },
      {
        key: 'strat_3',
        shortLabel: 'Actieplannen opgesteld',
        fullText2025: '3. Er zijn actieplannen opgesteld om de doelstellingen te bereiken'
      },
      {
        key: 'strat_4',
        shortLabel: 'Budget gealloceerd',
        fullText2025: '4. Er is budget gealloceerd voor diversiteitsbeleid'
      },
      {
        key: 'strat_5',
        shortLabel: 'Monitoring voortgang',
        fullText2025: '5. De voortgang wordt systematisch gemonitord'
      },
      {
        key: 'strat_6',
        shortLabel: 'Bijsturing bij afwijking',
        fullText2025: '6. Bij afwijkingen van doelen wordt bijgestuurd'
      },
      {
        key: 'strat_7',
        shortLabel: 'Externe benchmarking',
        fullText2025: '7. Er wordt extern gebenchmarkt op diversiteit'
      },
      {
        key: 'strat_8',
        shortLabel: 'Rapportage aan bestuur',
        fullText2025: '8. Er wordt regelmatig gerapporteerd aan het bestuur over diversiteit'
      }
    ]
  },
  {
    key: 'hr',
    label: 'HR management',
    prefix: 'hr_',
    count: 14,
    items: [
      { key: 'hr_1', shortLabel: 'Inclusieve werving', fullText2025: '1. Werving is inclusief ingericht' },
      { key: 'hr_2', shortLabel: 'Diverse selectiecommissies', fullText2025: '2. Selectiecommissies zijn divers samengesteld' },
      { key: 'hr_3', shortLabel: 'Objectieve selectiecriteria', fullText2025: '3. Er worden objectieve selectiecriteria gehanteerd' },
      { key: 'hr_4', shortLabel: 'Onboarding programma', fullText2025: '4. Er is een inclusief onboardingprogramma' },
      { key: 'hr_5', shortLabel: 'Mentoring & sponsoring', fullText2025: '5. Er zijn mentoring- en/of sponsoringprogramma\'s' },
      { key: 'hr_6', shortLabel: 'Talentontwikkeling', fullText2025: '6. Talentontwikkeling is inclusief ingericht' },
      { key: 'hr_7', shortLabel: 'Doorstroombeleid', fullText2025: '7. Er is beleid gericht op doorstroom van divers talent' },
      { key: 'hr_8', shortLabel: 'Beoordelingssystematiek', fullText2025: '8. De beoordelingssystematiek is getoetst op bias' },
      { key: 'hr_9', shortLabel: 'Beloning en erkenning', fullText2025: '9. Beloning en erkenning zijn eerlijk en transparant' },
      { key: 'hr_10', shortLabel: 'Flexibel werken', fullText2025: '10. Flexibel werken wordt gefaciliteerd' },
      { key: 'hr_11', shortLabel: 'Verlof- en feestdagenbeleid', fullText2025: '11. Het verlof- en feestdagenbeleid is inclusief' },
      { key: 'hr_12', shortLabel: 'Exitgesprekken diversiteit', fullText2025: '12. In exitgesprekken wordt diversiteit besproken' },
      { key: 'hr_13', shortLabel: 'Data-analyse HR-processen', fullText2025: '13. HR-processen worden geanalyseerd op diversiteitsdata' },
      { key: 'hr_14', shortLabel: 'Diversiteit in HR-team', fullText2025: '14. Het HR-team zelf is divers samengesteld' }
    ]
  },
  {
    key: 'comm',
    label: 'Communicatie',
    prefix: 'comm_',
    count: 5,
    items: [
      { key: 'comm_1', shortLabel: 'Interne communicatie', fullText2025: '1. Intern wordt actief gecommuniceerd over diversiteitsbeleid' },
      { key: 'comm_2', shortLabel: 'Externe communicatie', fullText2025: '2. Extern wordt actief gecommuniceerd over diversiteitsbeleid' },
      { key: 'comm_3', shortLabel: 'Beeldvorming en taalgebruik', fullText2025: '3. Beeldvorming en taalgebruik zijn inclusief' },
      { key: 'comm_4', shortLabel: 'Rolmodellen zichtbaar', fullText2025: '4. Rolmodellen zijn zichtbaar in de organisatie' },
      { key: 'comm_5', shortLabel: 'Communicatie naar stakeholders', fullText2025: '5. Er wordt gecommuniceerd naar stakeholders over diversiteit' }
    ]
  },
  {
    key: 'kennis',
    label: 'Kennis en vaardigheden',
    prefix: 'kennis_',
    count: 8,
    items: [
      { key: 'kennis_1', shortLabel: 'Bewustwordingstraining', fullText2025: '1. Er worden bewustwordingstrainingen aangeboden' },
      { key: 'kennis_2', shortLabel: 'Inclusief leiderschap', fullText2025: '2. Er is training in inclusief leiderschap' },
      { key: 'kennis_3', shortLabel: 'Interculturele competenties', fullText2025: '3. Interculturele competenties worden ontwikkeld' },
      { key: 'kennis_4', shortLabel: 'Onbewuste vooroordelen', fullText2025: '4. Er is aandacht voor onbewuste vooroordelen' },
      { key: 'kennis_5', shortLabel: 'Kennisdeling best practices', fullText2025: '5. Best practices worden intern gedeeld' },
      { key: 'kennis_6', shortLabel: 'Externe expertise', fullText2025: '6. Er wordt externe expertise ingeschakeld' },
      { key: 'kennis_7', shortLabel: 'Evaluatie trainingen', fullText2025: '7. Trainingen worden geëvalueerd op effectiviteit' },
      { key: 'kennis_8', shortLabel: 'Continu leren', fullText2025: '8. Er is een cultuur van continu leren over diversiteit' }
    ]
  },
  {
    key: 'klimaat',
    label: 'Klimaat',
    prefix: 'klimaat_',
    count: 6,
    items: [
      { key: 'klimaat_1', shortLabel: 'Psychologische veiligheid', fullText2025: '1. Er is sprake van psychologische veiligheid' },
      { key: 'klimaat_2', shortLabel: 'Inclusieve teamcultuur', fullText2025: '2. Er wordt gewerkt aan een inclusieve teamcultuur' },
      { key: 'klimaat_3', shortLabel: 'Medewerkersonderzoek', fullText2025: '3. In medewerkersonderzoek wordt diversiteit meegenomen' },
      { key: 'klimaat_4', shortLabel: 'Klachtenprocedure', fullText2025: '4. Er is een toegankelijke klachtenprocedure' },
      { key: 'klimaat_5', shortLabel: 'Netwerken en ERGs', fullText2025: '5. Er zijn medewerkersnetwerken of ERGs' },
      { key: 'klimaat_6', shortLabel: 'Waardering verschillen', fullText2025: '6. Verschillen worden gewaardeerd en benut' }
    ]
  }
];

/** Total number of Likert items across all dimensions */
export const TOTAL_LIKERT_ITEMS = DIMENSIONS.reduce((sum, d) => sum + d.count, 0); // 46

/**
 * Quantitative field definitions.
 * Maps 2026 survey short keys to their 2025 full-text headers.
 */
export const QUANT_FIELDS = {
  werknemers: {
    total: { key2026: 'aantal_werknemers', header2025: '2a. Aantal werknemers in de organisatie:' },
    be: { key2026: 'werknemers_buiten_europa', header2025: '2b. Aantal werknemers met herkomst Buiten-Europa in de organisatie:' }
  },
  top: {
    total: { key2026: 'aantal_top', header2025: '2c. Aantal werknemers in de top:' },
    be: { key2026: 'top_buiten_europa', header2025: '2d1. Aantal werknemers met herkomst Buiten-Europa in de top:' }
  },
  subtop: {
    total: { key2026: 'aantal_subtop', header2025: '2f. Aantal werknemers in de subtop:' },
    be: { key2026: 'subtop_buiten_europa', header2025: '2g1. Aantal werknemers met herkomst Buiten-Europa in de subtop:' }
  },
  rvb: {
    has: { key2026: 'heeft_rvb', header2025: '2h. Heeft u een (Raad van) Bestuur?' },
    total: { key2026: 'aantal_rvb', header2025: '2i1. Aantal mensen in de Raad van Bestuur:' },
    be: { key2026: 'rvb_buiten_europa', header2025: '2i2. Aantal mensen met herkomst Buiten-Europa in de Raad van Bestuur:' }
  },
  rvc: {
    has: { key2026: 'heeft_rvc', header2025: '2j. Heeft u een Raad van Commissarissen?' },
    total: { key2026: 'aantal_rvc', header2025: '2k1. Aantal mensen in de Raad van Commissarissen:' },
    be: { key2026: 'rvc_buiten_europa', header2025: '2k2. Aantal mensen met herkomst Buiten-Europa in de Raad van Commissarissen:' }
  },
  rvt: {
    has: { key2026: 'heeft_rvt', header2025: '2l. Heeft u een Raad van Toezicht?' },
    total: { key2026: 'aantal_rvt', header2025: '2m1. Aantal mensen in de Raad van Toezicht:' },
    be: { key2026: 'rvt_buiten_europa', header2025: '2m2. Aantal mensen met herkomst Buiten-Europa in de Raad van Toezicht:' }
  }
};

export const STREEF_FIELDS = {
  has: { key2026: 'streefcijfer', header2025: 'Heeft u een streefcijfer voor het aandeel mensen met herkomst Buiten-Europa in de top?' },
  pct: { key2026: 'streefcijfer_percentage', header2025: 'Zo ja, welk percentage gebruikt u voor dit streefcijfer?' }
};

export const ORG_NAME_KEY_2026 = 'organisatie';
export const ORG_NAME_HEADER_2025 = 'Naam organisatie:';

/**
 * Quantitative row definitions for the YoY and benchmark tables.
 * These define which rows appear in the report tables.
 */
export const QUANT_ROWS = [
  { key: 'werknemers', label: 'Gehele organisatie' },
  { key: 'top', label: 'Top' },
  { key: 'subtop', label: 'Subtop' },
  { key: 'rvb', label: 'RvB' },
  { key: 'rvc_rvt', label: 'RvC/RvT' }
];
