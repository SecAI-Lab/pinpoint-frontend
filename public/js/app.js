import { api } from './api.js';
import { initTheme } from './theme.js';
import { initHelp } from './help.js';
import { renderFileList } from './fileList.js';
import { renderQueryList } from './queryList.js';
import { renderQueryHeader } from './queryHeader.js';
import { renderRankingTable } from './rankingTable.js';
import { renderDetail } from './detail.js';

window.addEventListener('error', (e) => {
  const b = document.getElementById('errBanner');
  b.style.display = 'block';
  b.textContent += `[JS error] ${e.message}  (${e.filename}:${e.lineno}:${e.colno})\n`;
});

initTheme(document.getElementById('themeToggle'));
initHelp(document.getElementById('helpToggle'));

const state = { db: 'regular', file: null, idx: null, target: null, rankings: [], allFiles: [], allQueries: [] };

const fileListEl = document.getElementById('fileList');
const queryListEl = document.getElementById('queryList');
const queryHeaderEl = document.getElementById('queryHeader');
const rankTableWrap = document.getElementById('rankTableWrap');
const detailWrap = document.getElementById('detailWrap');
const dbSelect = document.getElementById('dbSelect');
const fileSearch = document.getElementById('fileSearch');
const fileCount = document.getElementById('fileCount');

const PICK_FILE = '<div class="empty">Pick a target file to see its queries.</div>';
const PICK_QUERY = '<div class="empty">Pick a query to see its ranking table.</div>';

function resetQueryPane() {
  queryListEl.innerHTML = PICK_FILE;
  queryHeaderEl.innerHTML = PICK_FILE;
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
    fileListEl.innerHTML = failure(`the ${state.db} file list`, err);
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
  state.file = f;
  state.idx = null;
  state.target = null;
  drawFileList();
  queryHeaderEl.innerHTML = PICK_QUERY;
  rankTableWrap.innerHTML = '';
  detailWrap.innerHTML = '';
  queryListEl.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const data = await api('/api/queries', { db: state.db, file: f });
    state.allQueries = data.queries;
    drawQueryList();
  } catch (err) {
    state.allQueries = [];
    queryListEl.innerHTML = failure('the query list for this target', err);
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
  } catch (err) {
    state.rankings = [];
    rankTableWrap.innerHTML = failure('the ranking table for this query', err);
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
  } catch (err) {
    detailWrap.innerHTML = failure(`the detail for ${func}`, err);
  }
}

dbSelect.addEventListener('change', () => {
  state.db = dbSelect.value; state.file = null; state.idx = null;
  loadFiles();
  queryListEl.innerHTML = '';
  resetQueryPane();
});
fileSearch.addEventListener('input', drawFileList);

async function applyDeepLink() {
  const p = new URLSearchParams(location.search);
  const db = p.get('db'), file = p.get('file'), idx = p.get('idx'), target = p.get('target');
  if (db) { state.db = db; dbSelect.value = db; }
  await loadFiles();
  if (file) { await selectFile(file); }
  if (file && idx) { await selectQuery(+idx); }
  if (file && idx && target) { await selectCandidate(target); }
  document.body.setAttribute('data-ready', '1');
}

applyDeepLink();
