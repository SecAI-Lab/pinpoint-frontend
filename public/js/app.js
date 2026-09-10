import { api } from './api.js';
import { initTheme } from './theme.js';
import { renderFileList } from './fileList.js';
import { renderQueryList } from './queryList.js';
import { renderQueryHeader } from './queryHeader.js';
import { renderRankingTable } from './rankingTable.js';
import { renderDetail } from './detail.js';
import { renderWelcome } from './welcome.js';

window.addEventListener('error', (e) => {
  const b = document.getElementById('errBanner');
  b.style.display = 'block';
  b.textContent += `[JS error] ${e.message}  (${e.filename}:${e.lineno}:${e.colno})\n`;
});

initTheme(document.getElementById('themeToggle'));

const state = { db: 'regular', file: null, idx: null, target: null, rankings: [], allFiles: [], allQueries: [] };

const fileListEl = document.getElementById('fileList');
const queryListEl = document.getElementById('queryList');
const queryHeaderEl = document.getElementById('queryHeader');
const rankTableWrap = document.getElementById('rankTableWrap');
const detailWrap = document.getElementById('detailWrap');
const dbSelect = document.getElementById('dbSelect');
const welcomeEl = document.getElementById('welcome');
const guideToggle = document.getElementById('guideToggle');
const fileSearch = document.getElementById('fileSearch');
const homeLink = document.getElementById('homeLink');
const fileCount = document.getElementById('fileCount');

const PICK_FILE = '<div class="empty">Pick a target binary to see its vulnerability queries.</div>';
const PICK_QUERY = '<div class="empty">Pick a vulnerable reference to see its ranking.</div>';

function showWelcome() {
  if (!welcomeEl.dataset.rendered) {
    renderWelcome(welcomeEl, openCase);
    welcomeEl.dataset.rendered = '1';
  }
  document.body.classList.add('showWelcome');
  guideToggle.classList.add('active');
  welcomeEl.scrollTop = 0;
}

function hideWelcome() {
  document.body.classList.remove('showWelcome');
  guideToggle.classList.remove('active');
}

function syncURL() {
  const p = new URLSearchParams();
  p.set('db', state.db);
  if (state.file) p.set('file', state.file);
  if (state.idx != null) p.set('idx', state.idx);
  if (state.target) p.set('target', state.target);
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

async function openCase(c) {
  hideWelcome();
  if (c.db !== state.db) {
    state.db = c.db;
    dbSelect.value = c.db;
    await loadFiles();
  }
  await selectFile(c.file);
  await selectQuery(c.idx);
  await selectCandidate(c.target);
  window.scrollTo(0, 0);
}

// Back to the state a bare visit to the site root gives: the guide, default DB,
// nothing selected, no query string.
async function goHome() {
  history.replaceState(null, '', location.pathname);
  state.db = 'regular';
  state.file = null;
  state.idx = null;
  state.target = null;
  state.rankings = [];
  state.allQueries = [];
  dbSelect.value = 'regular';
  fileSearch.value = '';
  resetQueryPane();
  showWelcome();
  await loadFiles();
  window.scrollTo(0, 0);
}

function setHeaderPlaceholder(html) {
  queryHeaderEl.innerHTML = html;
  queryHeaderEl.classList.add('is-empty');
}

function resetQueryPane() {
  queryListEl.innerHTML = PICK_FILE;
  setHeaderPlaceholder(PICK_FILE);
  rankTableWrap.innerHTML = '';
  detailWrap.innerHTML = '';
}

function failure(what, err) {
  return `<div class="empty">Could not load ${what}.<br><span class="failReason">${err.message}</span></div>`;
}

async function loadFiles() {
  try {
    const data = await api('/api/files', { db: state.db });
    state.allFiles = data.files;
    drawFileList();
  } catch (err) {
    state.allFiles = [];
    fileListEl.innerHTML = failure(`the ${state.db} target list`, err);
    fileCount.textContent = '';
  }
}

function drawFileList() {
  renderFileList(fileListEl, fileCount, state.allFiles, fileSearch.value.trim(), state.file, selectFile);
}

function drawQueryList() {
  renderQueryList(queryListEl, state.allQueries, state.idx, selectQuery);
}

async function selectFile(f) {
  hideWelcome();
  state.file = f;
  state.idx = null;
  state.target = null;
  drawFileList();
  setHeaderPlaceholder(PICK_QUERY);
  rankTableWrap.innerHTML = '';
  detailWrap.innerHTML = '';
  queryListEl.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const data = await api('/api/queries', { db: state.db, file: f });
    state.allQueries = data.queries;
    drawQueryList();
    syncURL();
  } catch (err) {
    state.allQueries = [];
    queryListEl.innerHTML = failure('the query list for this target binary', err);
  }
}

async function selectQuery(idx) {
  state.idx = idx;
  state.target = null;
  drawQueryList();
  rankTableWrap.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const data = await api('/api/rankings', { db: state.db, file: state.file, idx });
    state.rankings = data.rankings;
    renderQueryHeader(queryHeaderEl, data);
    renderRankingTable(rankTableWrap, detailWrap, data.rankings, state.target, selectCandidate,
      data.details ? Object.keys(data.details) : null);
    syncURL();
  } catch (err) {
    state.rankings = [];
    rankTableWrap.innerHTML = failure('the ranking for this query', err);
    detailWrap.innerHTML = '';
  }
}

async function selectCandidate(func) {
  state.target = func;
  rankTableWrap.querySelectorAll('tr[data-func]').forEach(tr => {
    tr.classList.toggle('selected', tr.dataset.func === func);
  });
  detailWrap.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const data = await api('/api/detail', { db: state.db, file: state.file, idx: state.idx, target: func });
    renderDetail(detailWrap, data);
    syncURL();
  } catch (err) {
    detailWrap.innerHTML = failure(`the sliding-window data for ${func}`, err);
  }
}

dbSelect.addEventListener('change', () => {
  state.db = dbSelect.value; state.file = null; state.idx = null;
  loadFiles();
  queryListEl.innerHTML = '';
  resetQueryPane();
  syncURL();
});
homeLink.addEventListener('click', (e) => {
  // let ctrl/cmd/middle-click open a new tab the normal way
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  goHome();
});
guideToggle.addEventListener('click', () => {
  if (document.body.classList.contains('showWelcome')) hideWelcome();
  else showWelcome();
});
fileSearch.addEventListener('input', drawFileList);

async function applyDeepLink() {
  const p = new URLSearchParams(location.search);
  const db = p.get('db'), file = p.get('file'), idx = p.get('idx'), target = p.get('target');
  if (db) { state.db = db; dbSelect.value = db; }
  if (!file) showWelcome();
  await loadFiles();
  if (file) { await selectFile(file); }
  if (file && idx) { await selectQuery(+idx); }
  if (file && idx && target) { await selectCandidate(target); }
  document.body.setAttribute('data-ready', '1');
}

applyDeepLink();
