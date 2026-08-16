const MODE = window.VULNVIZ_MODE || 'static';

const INDEX_BASE = new URL('data/', document.baseURI).href;
const BULK_BASE = window.VULNVIZ_BULK_BASE
  ? new URL(window.VULNVIZ_BULK_BASE, document.baseURI).href
  : INDEX_BASE;

const cache = new Map();

async function readJSON(res) {
  const buf = await res.arrayBuffer();
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
  if (head.length === 2 && head[0] === 0x1f && head[1] === 0x8b) {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).json();
  }
  return JSON.parse(new TextDecoder().decode(buf));
}

function loadJSON(base, rel) {
  const key = base + rel;
  if (!cache.has(key)) {
    const pending = fetch(key)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText} while loading ${rel}`);
        return readJSON(res);
      })
      .catch(err => {
        cache.delete(key);
        throw err;
      });
    cache.set(key, pending);
  }
  return cache.get(key);
}

async function liveApi(path, params) {
  const url = new URL(path, location.origin);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const res = await fetch(url);
  return res.json();
}

async function staticApi(path, params) {
  const p = params || {};
  if (path === '/api/files') return loadJSON(INDEX_BASE, `${p.db}/files.json`);
  if (path === '/api/queries') return loadJSON(INDEX_BASE, `${p.db}/${p.file}/queries.json`);

  const [query, shared] = await Promise.all([
    loadJSON(BULK_BASE, `${p.db}/${p.file}/q${p.idx}.json.gz`),
    loadJSON(BULK_BASE, `${p.db}/${p.file}/functions.json.gz`),
  ]);
  if (path === '/api/rankings') return query;
  if (path === '/api/detail') {
    const d = query.details && query.details[p.target];
    if (!d) return { unavailable: true, target_func: p.target };
    return {
      ...d,
      target: (shared.functions || {})[p.target] || null,
      vuln: query.vuln,
      vuln_json_key: query.vuln_json_key,
    };
  }
  throw new Error(`unknown data path: ${path}`);
}

export async function api(path, params) {
  return MODE === 'api' ? liveApi(path, params) : staticApi(path, params);
}
