export function renderQueryHeader(container, d) {
  const cve = (d.vuln_cves || []).join(', ') || 'N/A';
  const inlinedInto = d.vuln_inlined_into || [];
  const inlineNote = inlinedInto.length
    ? ` <span class="chip inline-chip" title="Outer function contains the inner one: in this target build, the code of ${d.vuln_func} was compiled into the body of ${inlinedInto.join(', ')}">${inlinedInto.map(c => `${c}(${d.vuln_func})`).join(', ')}</span>`
    : '';
  const field = (label, valueHtml) => `
    <div class="qh-field"><span class="qh-label">${label}</span>${valueHtml}</div>`;
  container.innerHTML = `
    <div class="qh-title">
      <span class="qh-label">Vulnerable reference</span><b>${d.vuln_func}</b>${inlineNote}
      <span class="qh-arrow">&#8594;</span>
      <span class="qh-label">Target binary</span><b>${d.target_project}/${d.target_binary}</b>
      <span class="chip">${d.target_compiler}-${d.target_opt}</span>
    </div>
    <div class="qh-fields">
      ${field('Reference build', `<b>${d.vuln_project}/${d.vuln_binary} ${d.vuln_compiler}-${d.vuln_opt}</b>`)}
      ${field('CVE', `<b>${cve}</b>`)}
      ${field('Reference tokens / basic blocks', `<b>${d.vuln_tokens} / ${d.vuln_blocks}</b>`)}
    </div>
  `;
}
