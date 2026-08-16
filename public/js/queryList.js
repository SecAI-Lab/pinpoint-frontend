function sortQueries(queries) {
  return [...queries].sort((a, b) => {
    if (a.gt_evaluable !== b.gt_evaluable) return a.gt_evaluable ? -1 : 1;
    const ar = a.gt_best_rank, br = b.gt_best_rank;
    if (ar == null && br == null) return 0;
    if (ar == null) return 1;
    if (br == null) return -1;
    return ar - br;
  });
}

export function renderQueryList(container, allQueries, currentIdx, onSelect) {
  container.innerHTML = `<div class="listCaption">One row per reference build. The badge shows this target's <b>rank / stage</b>.</div>`;
  if (!allQueries.length) {
    container.innerHTML += `<div class="empty">No queries in this file.</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  const sorted = sortQueries(allQueries);

  let printedUnevaluableHeader = false;
  for (const q of sorted) {
    if (!q.gt_evaluable && !printedUnevaluableHeader) {
      const hdr = document.createElement('div');
      hdr.className = 'list-group-hdr';
      hdr.textContent = 'No known answer for this target';
      frag.appendChild(hdr);
      printedUnevaluableHeader = true;
    }
    const d = document.createElement('div');
    d.className = 'list-item' + (q.idx === currentIdx ? ' active' : '');
    let gtBadge = '';
    if (q.gt_evaluable) {
      gtBadge = q.gt_best_rank != null
        ? `<span class="gtRankBadge hit">rank=${q.gt_best_rank}${q.gt_best_stage ? ' / ' + q.gt_best_stage : ''}</span>`
        : `<span class="gtRankBadge miss">not found</span>`;
    }
    d.innerHTML = `${q.idx}. ${q.vuln_func} ${gtBadge}<span class="meta">${q.vuln_compiler}-${q.vuln_opt}</span>`;
    d.addEventListener('click', () => onSelect(q.idx));
    frag.appendChild(d);
  }
  container.appendChild(frag);
}
