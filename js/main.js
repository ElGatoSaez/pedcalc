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
const state = { drug: null, route: null, pres: null };

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
const presGroup    = document.getElementById('pres-group');
const presSelect   = document.getElementById('pres-select');
const resultPH     = document.getElementById('result-placeholder');
const resultCont   = document.getElementById('result-content');

loadDatabase().catch(error => {
  console.error(error);
  drugDropdown.innerHTML = '<div class="drug-item">No se pudo cargar la base de datos</div>';
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
  state.drug = name; state.route = null; state.pres = null;
  drugDropdown.classList.remove('open');
  searchWrap.classList.add('hidden');
  drugBar.classList.add('visible');
  selName.textContent = name;
  renderRoutes();
  compute();
}

function clearDrug() {
  state.drug = null; state.route = null; state.pres = null;
  drugSearch.value = '';
  searchWrap.classList.remove('hidden');
  drugBar.classList.remove('visible');
  routeGroup.classList.add('hidden');
  presGroup.classList.add('hidden');
  showPlaceholder();
}

// ══════════════════════════════════════════
//  ROUTES & PRESENTATIONS
// ══════════════════════════════════════════
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
  compute();
}

presSelect.addEventListener('change', () => { state.pres = parseInt(presSelect.value); compute(); });
weightIn.addEventListener('input', compute);

// ══════════════════════════════════════════
//  CÁLCULO
// ══════════════════════════════════════════
function showPlaceholder() {
  resultPH.classList.remove('hidden');
  resultCont.classList.add('hidden');
}

function compute() {
  const kg = parseFloat(weightIn.value);
  if (!kg || !state.drug || state.route === null || state.pres === null) { showPlaceholder(); return; }

  const p = DB[state.drug].routes[state.route][state.pres];
  const mgRaw   = +(kg * p.dose).toFixed(3);
  const mgDose  = Math.min(mgRaw, p.doseAbsMax);
  const capped  = mgDose < mgRaw;
  const volume  = +((mgDose / p.mgPerUnit) * p.unitVol).toFixed(2);
  const dispVol = volume % 1 === 0 ? volume.toString() : volume.toFixed(1);
  const mgMaxDia = +(Math.min(kg * p.doseMax, p.doseAbsMax)).toFixed(1);

  document.getElementById('res-drug').textContent  = state.drug + ' · ' + p.label;
  document.getElementById('res-vol').textContent   = dispVol;
  document.getElementById('res-unit').textContent  = p.unitLabel;
  document.getElementById('res-note').textContent  = p.dose + ' mg/kg/dosis · paciente ' + kg + ' kg';
  document.getElementById('res-mg').textContent    = mgDose.toFixed(1) + ' mg';
  document.getElementById('res-freq').textContent  = p.freq;
  document.getElementById('res-mgkg').textContent  = p.dose + ' mg/kg';
  document.getElementById('res-route').textContent = state.route;

  const alertWrap = document.getElementById('res-alert-wrap');
  if (capped) {
    alertWrap.innerHTML = `<div class="alert danger"><div class="alert-dot"></div><div>Dosis ajustada al máximo absoluto: <strong>${p.doseAbsMax} mg/dosis</strong></div></div>`;
  } else {
    alertWrap.innerHTML = `<div class="alert warn"><div class="alert-dot"></div><div>Máx. recomendado: <strong>${mgMaxDia} mg/dosis</strong> · Máx. absoluto: <strong>${p.doseAbsMax} mg</strong></div></div>`;
  }

  resultPH.classList.add('hidden');
  resultCont.classList.remove('hidden');
}
