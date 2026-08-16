function matchesTerm(f, term) {
  return f.key.toLowerCase().includes(term)
    || f.vuln_funcs.some(vf => vf.toLowerCase().includes(term))
    || f.cves.some(c => c.toLowerCase().includes(term));
}

export function renderFileList(container, countEl, allFiles, rawTerm, currentFile, onSelect) {
  const terms = rawTerm.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
  const files = terms.length
    ? allFiles.filter(f => terms.some(t => matchesTerm(f, t)))
    : allFiles;
  countEl.textContent = `${files.length} / ${allFiles.length} files`;
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const f of files) {
    const d = document.createElement('div');
    d.className = 'list-item' + (f.key === currentFile ? ' active' : '');
    d.textContent = f.key;
    if (f.cves.length) d.title = `CVEs queried against this target: ${f.cves.join(', ')}`;
    d.addEventListener('click', () => onSelect(f.key));
    frag.appendChild(d);
  }
  container.appendChild(frag);
}
