export function renderRankingTable(rankTableWrap, detailWrap, rankings, currentTarget, onSelectCandidate, detailFuncs) {
  const gtRows = rankings.filter(r => r.is_gt).sort((a, b) => a.rank - b.rank);
  const withDetail = detailFuncs ? new Set(detailFuncs) : null;

  let html = `<table class="rank"><thead><tr>
    <th>Rank</th><th>Similarity</th><th>Stage</th><th>Candidate</th><th>Label</th><th>Matched range</th>
  </tr></thead><tbody>`;

  const bestWindowCell = (r) => {
    if (r.best_stage === 'stage2' && r.best_window_bb) {
      return `[${r.best_window_bb[0]}:${r.best_window_bb[1]}] blocks`;
    }
    if (r.target_range) {
      return `[${r.target_range[0]}:${r.target_range[1]}] tokens`;
    }
    return 'n/a';
  };

  const rowHtml = (r) => {
    const cls = [r.func_name === currentTarget ? 'selected' : '',
                 withDetail && !withDetail.has(r.func_name) ? 'noDetail' : ''].filter(Boolean).join(' ');
    const tip = withDetail && !withDetail.has(r.func_name)
      ? ' title="Sliding-window data was not exported for this candidate"' : '';
    return `<tr data-func="${r.func_name}" class="${cls}"${tip}>
      <td>${r.rank}</td><td>${r.score.toFixed(2)}</td><td>${r.best_stage}</td>
      <td class="${r.is_gt ? 'gt' : ''}">${r.func_name}</td><td>${r.label}</td>
      <td>${bestWindowCell(r)}</td>
    </tr>`;
  };

  if (gtRows.length) {
    html += gtRows.map(rowHtml).join('');
    html += `<tr class="tableGroupSep"><td colspan="6">Full ranking</td></tr>`;
  }
  html += rankings.map(rowHtml).join('');
  html += `</tbody></table>`;
  rankTableWrap.innerHTML = html;
  detailWrap.innerHTML = '<div class="empty">Click a candidate to see its sliding-window scores.</div>';
  rankTableWrap.querySelectorAll('tr[data-func]').forEach(tr => {
    tr.addEventListener('click', () => onSelectCandidate(tr.dataset.func));
  });
}
