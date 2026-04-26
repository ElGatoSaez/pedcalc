// ══════════════════════════════════════════
//  BASE DE DATOS FARMACOLÓGICA
// ══════════════════════════════════════════
let DB = {};

async function loadDatabase() {
  const response = await fetch('assets/database.json');
  if (!response.ok) throw new Error('No se pudo cargar assets/database.json');
  DB = await response.json();
}

// ══════════════════════════════════════════
//  ESTADO
// ══════════════════════════════════════════
const state = { drug: null, route: null, regimen: null, pres: null };

// ══════════════════════════════════════════
//  REFERENCIAS DOM
// ══════════════════════════════════════════
const weightIn     = document.getElementById('weight-in');
const drugSearch   = document.getElementById('drug-search');
const drugDropdown = document.getElementById('drug-dropdown');
const searchWrap   = document.getElementById('search-wrap');
const drugBar      = document.getElementById('drug-bar');
const selName      = document.getElementById('sel-name');
const routeGroup   = document.getElementById('route-group');
const routeChips   = document.getElementById('route-chips');
const regimenGroup = document.getElementById('regimen-group');
const regimenSelect = document.getElementById('regimen-select');
const presGroup    = document.getElementById('pres-group');
const presSelect   = document.getElementById('pres-select');
const resultPH     = document.getElementById('result-placeholder');
const resultCont   = document.getElementById('result-content');
const themeToggle  = document.getElementById('theme-toggle');
const themeIcon    = document.getElementById('theme-toggle-icon');
const THEME_STORAGE_KEY = 'pedcalc-theme';

loadDatabase().catch(error => {
  console.error(error);
  drugDropdown.innerHTML = '<div class="drug-item">No se pudo cargar la base de datos</div>';
});

// ══════════════════════════════════════════
//  MODO NOCHE
// ══════════════════════════════════════════
function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return 'day';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // El modo sigue funcionando aunque el navegador no permita persistirlo.
  }
}

function setTheme(theme) {
  const isNight = theme === 'night';
  if (isNight) {
    document.documentElement.dataset.theme = 'night';
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  saveTheme(isNight ? 'night' : 'day');
  themeToggle.classList.toggle('active', isNight);
  themeToggle.setAttribute('aria-pressed', String(isNight));
  themeToggle.setAttribute('aria-label', isNight ? 'Desactivar modo noche' : 'Activar modo noche');
  themeIcon.textContent = isNight ? '☀' : '☾';
}

setTheme(getSavedTheme() === 'night' ? 'night' : 'day');
themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
  setTheme(nextTheme);
});

// ══════════════════════════════════════════
//  NAV
// ══════════════════════════════════════════
function switchTab(name, btn) {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  const labels = { dosis:'Dosis Pediátrica', neonatal:'Ictericia Neonatal', nutricion:'Diagnóstico Nutricional', apgar:'APGAR' };
  document.getElementById('topbar-tag').textContent = labels[name] || '';
}

// ══════════════════════════════════════════
//  DRUG SEARCH
// ══════════════════════════════════════════
function filterDrugs(q) {
  const lower = q.toLowerCase().trim();
  return Object.keys(DB).filter(d => d.toLowerCase().includes(lower));
}

function renderDropdown(drugs) {
  drugDropdown.innerHTML = '';
  if (!drugs.length) { drugDropdown.classList.remove('open'); return; }
  drugs.forEach(d => {
    const el = document.createElement('div');
    el.className = 'drug-item' + (d === state.drug ? ' selected' : '');
    el.textContent = d;
    el.addEventListener('click', () => selectDrug(d));
    drugDropdown.appendChild(el);
  });
  drugDropdown.classList.add('open');
}

drugSearch.addEventListener('input', () => renderDropdown(filterDrugs(drugSearch.value)));
drugSearch.addEventListener('focus', () => renderDropdown(filterDrugs(drugSearch.value)));
document.addEventListener('click', e => {
  if (!searchWrap.contains(e.target) && !drugDropdown.contains(e.target)) {
    drugDropdown.classList.remove('open');
  }
});

function selectDrug(name) {
  state.drug = name; state.route = null; state.regimen = null; state.pres = null;
  drugDropdown.classList.remove('open');
  searchWrap.classList.add('hidden');
  drugBar.classList.add('visible');
  selName.textContent = name;
  renderRegimens();
  renderRoutes();
  compute();
}

function clearDrug() {
  state.drug = null; state.route = null; state.regimen = null; state.pres = null;
  drugSearch.value = '';
  searchWrap.classList.remove('hidden');
  drugBar.classList.remove('visible');
  routeGroup.classList.add('hidden');
  regimenGroup.classList.add('hidden');
  presGroup.classList.add('hidden');
  showPlaceholder();
}

// ══════════════════════════════════════════
//  REGIMENS, ROUTES & PRESENTATIONS
// ══════════════════════════════════════════
function renderRegimens() {
  if (!state.drug) { regimenGroup.classList.add('hidden'); return; }

  const regimens = DB[state.drug].regimens || [];
  regimenSelect.innerHTML = '';
  regimens.forEach((regimen, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = regimen.label;
    regimenSelect.appendChild(opt);
  });

  if (!regimens.length) {
    state.regimen = null;
    regimenGroup.classList.add('hidden');
    return;
  }

  state.regimen = 0;
  regimenSelect.value = '0';
  regimenGroup.classList.toggle('hidden', regimens.length === 1);
}

function renderRoutes() {
  if (!state.drug) { routeGroup.classList.add('hidden'); return; }
  const routes = Object.keys(DB[state.drug].routes);
  routeChips.innerHTML = '';
  routes.forEach(r => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (r === state.route ? ' active' : '');
    chip.textContent = r;
    chip.addEventListener('click', () => selectRoute(r));
    routeChips.appendChild(chip);
  });
  routeGroup.classList.remove('hidden');
  if (routes.length === 1) selectRoute(routes[0]);
}

function selectRoute(r) {
  state.route = r; state.pres = null;
  document.querySelectorAll('#route-chips .chip').forEach(c => {
    c.classList.toggle('active', c.textContent === r);
  });
  renderPresentations();
}

function renderPresentations() {
  if (!state.drug || !state.route) { presGroup.classList.add('hidden'); return; }
  const preses = DB[state.drug].routes[state.route];
  presSelect.innerHTML = '';
  preses.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.label;
    presSelect.appendChild(opt);
  });
  presGroup.classList.remove('hidden');
  state.pres = 0;
  presSelect.value = '0';
  compute();
}

regimenSelect.addEventListener('change', () => { state.regimen = parseInt(regimenSelect.value); compute(); });
presSelect.addEventListener('change', () => { state.pres = parseInt(presSelect.value); compute(); });
weightIn.addEventListener('input', compute);

// ══════════════════════════════════════════
//  CÁLCULO
// ══════════════════════════════════════════
function showPlaceholder() {
  resultPH.classList.remove('hidden');
  resultCont.classList.add('hidden');
}

function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return '—';
  const precision = Math.abs(value) > 0 && Math.abs(value) < 1 ? 2 : decimals;
  return Number(value.toFixed(precision)).toString();
}

function formatRange(min, max, decimals = 1) {
  if (Math.abs(min - max) < 0.001) return formatNumber(max, decimals);
  return formatNumber(min, decimals) + '-' + formatNumber(max, decimals);
}

function doseLabel(regimen) {
  const unit = regimen.doseBasis === 'day' ? 'mg/kg/día' : 'mg/kg/dosis';
  return formatRange(regimen.doseMin, regimen.doseMax, 2) + ' ' + unit;
}

function doseNote(regimen, kg) {
  const base = doseLabel(regimen);
  const split = regimen.doseBasis === 'day' && regimen.dosesPerDay
    ? ' dividido en ' + regimen.dosesPerDay + ' tomas'
    : '';
  return base + split + ' · paciente ' + formatNumber(kg, 1) + ' kg';
}

function computeDoseRange(kg, regimen) {
  const doseMin = Number(regimen.doseMin);
  const doseMax = Number(regimen.doseMax ?? regimen.doseMin);
  const dosesPerDay = Number(regimen.dosesPerDay || 1);
  let rawMin;
  let rawMax;
  let cappedMin;
  let cappedMax;
  let capped = false;

  if (regimen.doseBasis === 'day') {
    rawMin = kg * doseMin;
    rawMax = kg * doseMax;
    cappedMin = rawMin;
    cappedMax = rawMax;

    if (Number.isFinite(regimen.maxDaily)) {
      cappedMin = Math.min(cappedMin, regimen.maxDaily);
      cappedMax = Math.min(cappedMax, regimen.maxDaily);
    }

    if (Number.isFinite(regimen.maxDailyMgKg)) {
      const dailyByWeight = kg * regimen.maxDailyMgKg;
      cappedMin = Math.min(cappedMin, dailyByWeight);
      cappedMax = Math.min(cappedMax, dailyByWeight);
    }

    capped = cappedMin < rawMin || cappedMax < rawMax;
    rawMin = rawMin / dosesPerDay;
    rawMax = rawMax / dosesPerDay;
    cappedMin = cappedMin / dosesPerDay;
    cappedMax = cappedMax / dosesPerDay;
  } else {
    rawMin = kg * doseMin;
    rawMax = kg * doseMax;
    cappedMin = rawMin;
    cappedMax = rawMax;
  }

  if (Number.isFinite(regimen.maxPerDose)) {
    const nextMin = Math.min(cappedMin, regimen.maxPerDose);
    const nextMax = Math.min(cappedMax, regimen.maxPerDose);
    capped = capped || nextMin < cappedMin || nextMax < cappedMax;
    cappedMin = nextMin;
    cappedMax = nextMax;
  }

  return { min: cappedMin, max: cappedMax, rawMin, rawMax, capped };
}

function computeOutput(kg, presentation, doseRange) {
  if (presentation.outputMode === 'dropsPerKg') {
    return {
      value: String(Math.round(kg * presentation.dropsPerKg)),
      unit: presentation.outputUnitLabel || 'gotas',
      notes: []
    };
  }

  if (Number.isFinite(presentation.mgPerUnit) && Number.isFinite(presentation.unitVol)) {
    const min = (doseRange.min / presentation.mgPerUnit) * presentation.unitVol;
    const max = (doseRange.max / presentation.mgPerUnit) * presentation.unitVol;
    return {
      value: formatRange(min, max, 1),
      unit: presentation.unitLabel || 'unidad',
      notes: []
    };
  }

  return {
    value: formatRange(doseRange.min, doseRange.max, 1),
    unit: presentation.unitLabel || 'mg',
    notes: ['Se muestra dosis en mg porque esta presentación no tiene concentración cargada.']
  };
}

function maxSummary(regimen, kg) {
  const parts = [];
  if (regimen.maxPerDoseDisplay) {
    parts.push('Máx. por dosis: ' + regimen.maxPerDoseDisplay);
  } else if (Number.isFinite(regimen.maxPerDose)) {
    parts.push('Máx. por dosis: ' + formatNumber(regimen.maxPerDose, 1) + ' mg');
  }

  if (Number.isFinite(regimen.maxDaily)) {
    parts.push('Máx. diario: ' + formatNumber(regimen.maxDaily, 1) + ' mg/día');
  }

  if (Number.isFinite(regimen.maxDailyMgKg)) {
    parts.push(
      'Máx. diario: ' + formatNumber(kg * regimen.maxDailyMgKg, 1) +
      ' mg/día (' + formatNumber(regimen.maxDailyMgKg, 2) + ' mg/kg/día)'
    );
  }

  return parts.join(' · ');
}

function escapeHTML(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

function renderAlerts({ capped, regimen, presentation, outputNotes, kg }) {
  const alertWrap = document.getElementById('res-alert-wrap');
  const alerts = [];
  const maxText = maxSummary(regimen, kg);

  if (capped && maxText) {
    alerts.push({ type: 'danger', text: 'Dosis ajustada al máximo cargado: ' + maxText });
  } else if (maxText) {
    alerts.push({ type: 'warn', text: maxText });
  }

  const notes = [
    ...(regimen.notes || []),
    ...(presentation.notes || []),
    ...(outputNotes || [])
  ];

  [...new Set(notes)].forEach(note => alerts.push({ type: 'info', text: note }));

  alertWrap.innerHTML = alerts.map(alert => (
    `<div class="alert ${alert.type}"><div class="alert-dot"></div><div>${escapeHTML(alert.text)}</div></div>`
  )).join('');
}

function compute() {
  const kg = parseFloat(weightIn.value.replace(',', '.'));
  if (!kg || !state.drug || state.route === null || state.regimen === null || state.pres === null) {
    showPlaceholder();
    return;
  }

  const drug = DB[state.drug];
  const regimen = drug.regimens[state.regimen];
  const p = drug.routes[state.route][state.pres];
  const doseRange = computeDoseRange(kg, regimen);
  const output = computeOutput(kg, p, doseRange);

  document.getElementById('res-drug').textContent  = state.drug + ' · ' + p.label;
  document.getElementById('res-vol').textContent   = output.value;
  document.getElementById('res-unit').textContent  = output.unit;
  document.getElementById('res-note').textContent  = doseNote(regimen, kg);
  document.getElementById('res-mg').textContent    = formatRange(doseRange.min, doseRange.max, 1) + ' mg';
  document.getElementById('res-freq').textContent  = regimen.freq || '—';
  document.getElementById('res-mgkg').textContent  = doseLabel(regimen);
  document.getElementById('res-route').textContent = state.route;

  renderAlerts({
    capped: doseRange.capped,
    regimen,
    presentation: p,
    outputNotes: output.notes,
    kg
  });

  resultPH.classList.add('hidden');
  resultCont.classList.remove('hidden');
}
