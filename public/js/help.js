const SECTIONS = [
  {
    title: 'Stages',
    rows: [
      ['Stage 1', 'Whole function, one comparison.'],
      ['Stage 2', 'Sliding window, one block per step.'],
      ['Stage 3', 'Sliding window, one token per step.'],
      ['τ = 0.99', 'Early-exit threshold. Hitting it skips later stages.'],
    ],
  },
  {
    title: 'Label',
    rows: [
      ['V', 'Type I. The vulnerable function, standalone.'],
      ['NV-V', 'Type II. Vulnerable code inlined into a clean function.'],
      ['V-NV', 'Type III. The vulnerable function with other code inlined in.'],
      ['V-V', 'Type IV. Vulnerable, and holds a second vulnerable inlinee.'],
      ['NV', 'No relation to the query.'],
    ],
  },
  {
    title: 'Window',
    rows: [
      ['GT', 'The byte range that is actually vulnerable, from DWARF.'],
      ['Selected window', 'What PinPoint reports, in Stage-2 blocks or Stage-3 tokens.'],
      ['Containment count', 'Tie-break: among top-scoring windows, the one covering the most other window starts wins.'],
    ],
  },
  {
    title: 'Reference vs. target',
    rows: [
      ['Reference', 'The vulnerable function being searched for.'],
      ['Reference build', 'Compiler and optimization level it was built with.'],
      ['Candidate', 'A function in the target binary.'],
      ['Target binary', 'The binary being searched.'],
      ['regular', 'Default builds.'],
      ['fno_inline', '-fno-inline builds, so Type II-IV vulns survive standalone.'],
    ],
  },
];

function renderSections() {
  return SECTIONS.map(sec => `
    <div class="helpSection">
      <h3>${sec.title}</h3>
      <dl>
        ${sec.rows.map(([term, def]) => `<dt>${term}</dt><dd>${def}</dd>`).join('')}
      </dl>
    </div>
  `).join('');
}

export function initHelp(button) {
  const overlay = document.createElement('div');
  overlay.className = 'helpOverlay';
  overlay.innerHTML = `
    <div class="helpPanel" role="dialog" aria-label="Terminology guide">
      <div class="helpHead">
        <h2>Terminology guide</h2>
        <button type="button" class="helpClose" aria-label="Close">&times;</button>
      </div>
      <div class="helpBody">${renderSections()}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.classList.remove('open');
  const open = () => overlay.classList.add('open');

  button.addEventListener('click', open);
  overlay.querySelector('.helpClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}
