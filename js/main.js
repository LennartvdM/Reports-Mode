/**
 * Main application module.
 * Handles CSV upload, org selection, and report rendering.
 */

let appData = null; // { orgs, collective }
let selectedOrg = null;

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('csv-upload');
  const orgSelect = document.getElementById('org-select');
  const printBtn = document.getElementById('btn-print');
  const uploadStatus = document.getElementById('upload-status');
  const emptyState = document.getElementById('empty-state');
  const reportContainer = document.getElementById('report-pages');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadStatus.textContent = `Laden: ${file.name}...`;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        appData = processCSV(ev.target.result);
        populateOrgPicker(appData.orgs);
        orgSelect.disabled = false;
        uploadStatus.textContent = `${appData.orgs.length} organisaties geladen`;
      } catch (err) {
        uploadStatus.textContent = 'Fout bij het laden van CSV';
        console.error(err);
      }
    };
    reader.readAsText(file);
  });

  orgSelect.addEventListener('change', () => {
    const idx = parseInt(orgSelect.value);
    if (isNaN(idx) || !appData) return;
    selectedOrg = appData.orgs[idx];
    renderReport(selectedOrg, appData.collective);
    emptyState.classList.add('hidden');
    reportContainer.classList.remove('hidden');
    printBtn.disabled = false;
  });

  printBtn.addEventListener('click', printReport);

  // Auto-load sample data for demo
  loadSampleData(orgSelect, uploadStatus, emptyState, reportContainer, printBtn);
});

function loadSampleData(orgSelect, uploadStatus, emptyState, reportContainer, printBtn) {
  fetch('data/sample.csv')
    .then(res => {
      if (!res.ok) throw new Error('Sample CSV not found');
      return res.text();
    })
    .then(csvText => {
      appData = processCSV(csvText);
      populateOrgPicker(appData.orgs);
      orgSelect.disabled = false;
      uploadStatus.textContent = `Demo: ${appData.orgs.length} organisaties geladen`;

      // Auto-select first org for instant preview
      if (appData.orgs.length > 0) {
        orgSelect.value = '0';
        selectedOrg = appData.orgs[0];
        renderReport(selectedOrg, appData.collective);
        emptyState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
        printBtn.disabled = false;
      }
    })
    .catch(() => {
      // Sample not available — user can still upload their own CSV
    });
}

function populateOrgPicker(orgs) {
  const select = document.getElementById('org-select');
  select.innerHTML = '<option value="">— Kies een organisatie —</option>';
  orgs.forEach((org, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = org.name;
    select.appendChild(opt);
  });
}

function renderReport(org, collective) {
  renderPage1(org);
  renderPage3(org);
  renderPage5(org, collective);
  renderPage6(org, collective);
  renderPage7(org, collective);
  renderPage8(org);
  renderPage9(org);
}

// Page 1 — Cover
function renderPage1(org) {
  document.getElementById('cover-org-name').textContent = org.name;
}

// Page 3 — Kwalitatief: Uw Profiel
function renderPage3(org) {
  const canvas = document.getElementById('radial-page3');
  drawRadialChart(canvas, org.dimensionAvgs, { size: 260, palette: 'blue' });
}

// Page 5 — Three Radial Charts
function renderPage5(org, collective) {
  const canvasOrg = document.getElementById('radial-page5-org');
  drawRadialChart(canvasOrg, org.dimensionAvgs, { size: 240, palette: 'blue' });

  const canvasAvg = document.getElementById('radial-page5-avg');
  drawRadialChart(canvasAvg, collective.dimensionAvgs, { size: 180, palette: 'blue', labelFontSize: 8 });

  const canvasBench = document.getElementById('radial-page5-bench');
  drawRadialChart(canvasBench, collective.dimensionMaxes, { size: 180, palette: 'orange', labelFontSize: 8 });
}

// Page 6 — Tables
function renderPage6(org, collective) {
  // Ambitie table
  document.getElementById('ambitie-org-name').textContent = `M 2025 ${org.name}`;
  document.getElementById('ambitie-org-val').textContent = org.streefcijfer != null ? org.streefcijfer.toFixed(1) + '%' : '—';
  document.getElementById('ambitie-avg-val').textContent = collective.avgStreefcijfer.toFixed(1) + '%';

  // Main quantitative table
  const tbody = document.getElementById('quant-table-body');
  tbody.innerHTML = '';

  const headerOrgName = document.getElementById('quant-org-name');
  if (headerOrgName) headerOrgName.textContent = org.name;

  QUANT_CATEGORIES.forEach(cat => {
    const cur = org.quant[cat.key];
    const prev = org.prevQuant[cat.key];
    const voortgang = (cur.pct != null && prev.pct != null) ? cur.pct - prev.pct : null;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="label-col">${cat.label}</td>
      <td class="num">${prev.n != null ? Math.round(prev.n) : '—'}</td>
      <td class="num">${prev.pct != null ? prev.pct.toFixed(1) + '%' : '—'}</td>
      <td class="num">${cur.n != null ? Math.round(cur.n) : '—'}</td>
      <td class="num">${cur.pct != null ? cur.pct.toFixed(1) + '%' : '—'}</td>
      <td class="num ${voortgang !== null ? (voortgang > 0 ? 'voortgang-pos' : voortgang < 0 ? 'voortgang-neg' : 'voortgang-zero') : ''}">${voortgang !== null ? (voortgang > 0 ? '+' : '') + voortgang.toFixed(1) + ' pp' : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Page 7 — Comparison Table + Boxplot
function renderPage7(org, collective) {
  const tbody = document.getElementById('compare-table-body');
  tbody.innerHTML = '';

  QUANT_CATEGORIES.forEach(cat => {
    const cur = org.quant[cat.key];
    const stats = collective.quantStats[cat.key];

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="label-col">${cat.label}</td>
      <td class="num">${cur.pct != null ? cur.pct.toFixed(1) + '%' : '—'}</td>
      <td class="num">(${cur.n != null ? Math.round(cur.n) : '—'})</td>
      <td class="num">${stats.min.toFixed(1)}%</td>
      <td class="num">${stats.avg.toFixed(1)}%</td>
      <td class="num">${stats.max.toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });

  // Boxplot
  const canvas = document.getElementById('boxplot-canvas');
  drawBoxplot(canvas, {
    allOrgs: collective.boxplotAll,
    withTarget: collective.boxplotWithTarget,
    orgValue: org.quant.top.pct,
    orgTarget: org.streefcijfer
  }, { orgName: org.name });
}

// Page 8 — Brick Charts (1 of 2)
function renderPage8(org) {
  drawBrickChart(
    document.getElementById('brick-lead'),
    org.dimensionItems[0],
    { width: 340, labelWidth: 150 }
  );
  drawBrickChart(
    document.getElementById('brick-strat'),
    org.dimensionItems[1],
    { width: 340, labelWidth: 150 }
  );
  drawBrickChart(
    document.getElementById('brick-hr'),
    org.dimensionItems[2],
    { width: 370, labelWidth: 160 }
  );
}

// Page 9 — Brick Charts (2 of 2)
function renderPage9(org) {
  drawBrickChart(
    document.getElementById('brick-comm'),
    org.dimensionItems[3],
    { width: 340, labelWidth: 150 }
  );
  drawBrickChart(
    document.getElementById('brick-know'),
    org.dimensionItems[4],
    { width: 340, labelWidth: 150 }
  );
  drawBrickChart(
    document.getElementById('brick-clim'),
    org.dimensionItems[5],
    { width: 340, labelWidth: 150 }
  );
}
