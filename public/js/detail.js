import { tokenRangeToBBRange } from './bbstrip.js';
import { gtTokenSpans, setupStageChart } from './chart.js';

const MAX_TOKENS = 253;

const OTHER_VULN_COLORS = ['#c77dff', '#ffb703', '#06d6a0', '#f77f00'];

let activeCharts = [];

function vulnUsageText(d) {
  const bw = d.best_window;
  if (!d.vuln || !bw || !bw.vuln_range) return '';
  const [lo, hi] = bw.vuln_range;
  const tokensUsed = hi - lo;
  const totalTokens = d.vuln.n_tokens;
  if (d.best_stage === 'stage2') {
    const bbRange = tokenRangeToBBRange(d.vuln, lo, hi);
    const totalBBs = d.vuln.basic_blocks.length;
    const usedBBs = bbRange ? (bbRange.end_bb - bbRange.start_bb + 1) : 0;
    return `Used ${usedBBs} of ${totalBBs} basic blocks (${tokensUsed}/${totalTokens} tokens)`;
  }
  return `Used ${tokensUsed} of ${totalTokens} tokens`;
}

export function renderDetail(detailWrap, d) {
  activeCharts.forEach(c => c.destroy());
  activeCharts = [];

  if (d.unavailable) {
    detailWrap.innerHTML = `<div class="empty">No exported data for <b>${d.target_func}</b> in this query.</div>`;
    return;
  }

  const isStage1 = d.best_stage === 'stage1';
  const bw = d.best_window;

  let html = `
    <div class="vuln-info">
      <div class="vuln-info-label">REFERENCE &nbsp;${d.vuln ? d.vuln.func_name + ' (' + d.vuln_json_key + ')' : '(no data)'}${d.vuln ? ', ' + d.vuln.n_tokens + ' tokens' : ''}</div>
      <div class="vuln-usage">${vulnUsageText(d)}</div>
    </div>
  `;

  if (d.other_vuln_inlines && d.other_vuln_inlines.length) {
    html += `<div class="vuln-info" style="margin-top:6px;">
      <div class="vuln-info-label">This candidate also has ${d.other_vuln_inlines.length > 1 ? 'other vulnerable functions' : 'another vulnerable function'} inlined into it:</div>
      ${d.other_vuln_inlines.map((g, i) => {
        const c = OTHER_VULN_COLORS[i % OTHER_VULN_COLORS.length];
        const nesting = d.target ? `${d.target.func_name}(${g.vuln_func})` : g.vuln_func;
        return `<div class="vuln-usage"><span class="sw" style="background:${c};display:inline-block;width:10px;height:10px;margin-right:5px;border-radius:2px;"></span>${nesting} <span style="color:var(--text-faint);">${g.ranges.length} fragment${g.ranges.length === 1 ? '' : 's'}</span></div>`;
      }).join('')}
    </div>`;
  }

  if (isStage1) {
    html += `<div class="empty">This candidate got its top score from Stage 1 (whole function, truncated to the model's max input of ${MAX_TOKENS} tokens).
      There's no sliding window like Stage 2/3 (only one comparison was made), so there's no window score graph.
      The target side was truncated to its own first ${MAX_TOKENS} tokens the same way (see the token count above for the reference side).</div>`;
  } else {
    const otherVulnLegend = (d.other_vuln_inlines || []).map((g, i) =>
      `<span><span class="sw" style="background:${OTHER_VULN_COLORS[i % OTHER_VULN_COLORS.length]};"></span>${g.vuln_func} (other vulnerable reference)</span>`
    ).join('');
    const chartLegend = (color, label) => `
      <div class="chartLegend">
        <span><span class="sw" style="background:var(--gt);"></span>Ground-truth vulnerable range</span>
        ${otherVulnLegend}
        <span><span class="sw" style="background:var(--model);"></span>Selected window</span>
        <span><span class="sw" style="background:${color};opacity:.4"></span>Hovered window</span>
        <span><span class="sw" style="background:${color};"></span>${label}</span>
      </div>`;
    if (d.stage2_windows.length) {
      html += `
        <div class="chartWrap">
          <div class="chartTitle">Stage 2 (block-stride)${d.best_stage === 'stage2' ? ' <span class="chip">best stage</span>' : ''}</div>
          ${chartLegend('var(--accent)', 'Stage 2 score')}
          <canvas id="scoreChartS2" height="200"></canvas>
        </div>`;
    }
    if (d.stage3_windows.length) {
      html += `
        <div class="chartWrap">
          <div class="chartTitle">Stage 3 (token-stride)${d.best_stage === 'stage3' ? ' <span class="chip">best stage</span>' : ''}</div>
          ${chartLegend('#e0765f', 'Stage 3 score')}
          <canvas id="scoreChartS3" height="200"></canvas>
        </div>`;
    }
    if (d.stage2_attempted && !d.stage2_windows.length) {
      html += `<div class="empty">Stage 2 was attempted but produced 0 windows. The target function's basic block count (${d.target ? d.target.basic_blocks.length : '?'})
        is smaller than the required window size for the reference, so no BB window could be formed.</div>`;
    }
    if (d.stage3_attempted && !d.stage3_windows.length) {
      html += `<div class="empty">Stage 3 was attempted but produced 0 windows.</div>`;
    }
  }

  if (d.stage2_windows.length) {
    html += `<details class="windowsToggle"><summary>Stage 2 windows (${d.stage2_windows.length})</summary>
      <table class="windows" id="s2table"><thead><tr>
        <th>#</th><th>BB range</th><th>Token range</th><th class="sortable" data-sort="score">Score <span class="sortArrow"></span></th>
      </tr></thead><tbody>`;
    d.stage2_windows.forEach((w, i) => {
      html += `<tr data-i="${i}" data-score="${w.score}"><td>${i}</td><td>[${w.start_bb}:${w.end_bb}]</td><td>[${w.token_start}:${w.token_end}]</td>
        <td>${w.score.toFixed(2)}<span class="scorebar"><span style="width:${Math.round(w.score*100)}%"></span></span></td></tr>`;
    });
    html += `</tbody></table></details>`;
  }

  if (d.stage3_windows.length) {
    html += `<details class="windowsToggle"><summary>Stage 3 windows (token-stride, ${d.stage3_windows.length})</summary>
      <table class="windows" id="s3table"><thead><tr><th>#</th><th>Token range</th><th class="sortable" data-sort="score">Score <span class="sortArrow"></span></th></tr></thead><tbody>`;
    d.stage3_windows.forEach((w, i) => {
      html += `<tr data-i="${i}" data-score="${w.score}"><td>${i}</td><td>[${w.start_tok}:${w.end_tok}]</td>
        <td>${w.score.toFixed(2)}<span class="scorebar"><span style="width:${Math.round(w.score*100)}%"></span></span></td></tr>`;
    });
    html += `</tbody></table></details>`;
  }

  if (!isStage1 && !d.stage2_windows.length && !d.stage3_windows.length) {
    html += `<div class="empty">No window dump for this (query, target) pair (no dump in this file).</div>`;
  }

  detailWrap.innerHTML = html;

  const nTokens = Math.max(1, d.target ? d.target.n_tokens : 1);
  const gtSpans = isStage1 ? [] : gtTokenSpans(d.gt_ranges, d.target);
  const bestRange = bw && bw.target_range ? bw.target_range : null;
  const otherSpans = isStage1 ? [] : (d.other_vuln_inlines || []).map((g, i) => ({
    spans: gtTokenSpans(g.ranges, d.target),
    color: OTHER_VULN_COLORS[i % OTHER_VULN_COLORS.length],
    label: g.vuln_func,
  })).filter(g => g.spans.length);

  const highlightWindowRow = (tableId, i) => {
    detailWrap.querySelectorAll(`#${tableId} tr[data-i]`).forEach(r => {
      r.classList.toggle('hi', i !== null && +r.dataset.i === i);
    });
  };

  let chartS2 = null, chartS3 = null;
  if (d.stage2_windows.length) {
    const points = d.stage2_windows.map((w, i) => ({ x: w.token_start, y: w.score, i, w, range: [w.token_start, w.token_end] }));
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    chartS2 = setupStageChart('scoreChartS2', points, accentColor, gtSpans,
      d.best_stage === 'stage2' ? bestRange : null, nTokens,
      w => `stage2  BB[${w.start_bb}:${w.end_bb}]  tok[${w.token_start}:${w.token_end}]  score=${w.score.toFixed(2)}`,
      (p) => highlightWindowRow('s2table', p ? p.i : null), otherSpans);
  }
  if (d.stage3_windows.length) {
    const points = d.stage3_windows.map((w, i) => ({ x: w.start_tok, y: w.score, i, w, range: [w.start_tok, w.end_tok] }));
    chartS3 = setupStageChart('scoreChartS3', points, '#e0765f', gtSpans,
      d.best_stage === 'stage3' ? bestRange : null, nTokens,
      w => `stage3  tok[${w.start_tok}:${w.end_tok}]  score=${w.score.toFixed(2)}`,
      (p) => highlightWindowRow('s3table', p ? p.i : null), otherSpans);
  }
  activeCharts = [chartS2, chartS3].filter(Boolean);

  const s2rows = detailWrap.querySelectorAll('#s2table tr[data-i]');
  s2rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      const i = +row.dataset.i;
      highlightWindowRow('s2table', i);
      if (chartS2) chartS2.highlight(i);
    });
  });

  const s3rows = detailWrap.querySelectorAll('#s3table tr[data-i]');
  s3rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      const i = +row.dataset.i;
      highlightWindowRow('s3table', i);
      if (chartS3) chartS3.highlight(i);
    });
  });

  const makeSortable = (tableId) => {
    const table = detailWrap.querySelector(`#${tableId}`);
    if (!table) return;
    const th = table.querySelector('th[data-sort="score"]');
    const arrow = th.querySelector('.sortArrow');
    const tbody = table.querySelector('tbody');
    let dir = -1;
    th.addEventListener('click', () => {
      const rows = Array.from(tbody.querySelectorAll('tr[data-i]'));
      rows.sort((a, b) => dir * (parseFloat(a.dataset.score) - parseFloat(b.dataset.score)));
      rows.forEach(r => tbody.appendChild(r));
      arrow.textContent = dir === 1 ? '▲' : '▼';
      dir *= -1;
    });
  };
  makeSortable('s2table');
  makeSortable('s3table');
}
