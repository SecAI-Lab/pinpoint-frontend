const SECTIONS = [
  {
    title: 'Stages',
    rows: [
      ['Stage 1', 'Whole-function embedding (one comparison per candidate).'],
      ['Stage 2', 'Basic-block-stride sliding window (slides one block at a time).'],
      ['Stage 3', 'Token-stride sliding window (slides one token at a time; finer-grained).'],
      ['τ = 0.99 (dashed line in charts)', 'Early-exit threshold. A stage reaching it stops the search, so the next stage never runs.'],
    ],
  },
  {
    title: 'Label (inlining type)',
    rows: [
      ['V', 'Type I: candidate is the vulnerable function itself, standalone.'],
      ['NV-V', 'Type II: candidate is a non-vulnerable function with the vulnerable code inlined into it.'],
      ['V-NV', 'Type III: candidate is the vulnerable function, with extra non-vulnerable code also inlined in.'],
      ['V-V', 'Type IV: candidate is a vulnerable function that ALSO contains a different vulnerable inlinee.'],
      ['NV', 'Not a match: this candidate has no relationship to the queried vulnerability.'],
    ],
  },
  {
    title: 'Window & selection',
    rows: [
      ['GT', 'Ground truth, the DWARF-derived byte range that is actually vulnerable.'],
      ['Best / selected window', 'The range PinPoint reports for a candidate, in Stage-2 basic-block or Stage-3 token coordinates.'],
      ['Containment count', 'Tie-break rule: among windows sharing the max similarity score, count how many of those windows’ START positions fall inside each one’s own span. The window(s) with the highest count are reported.'],
    ],
  },
  {
    title: 'Reference vs. target',
    rows: [
      ['Reference', 'The vulnerable function (f_V) being searched for, drawn from the reference database D.'],
      ['Reference build', 'The compiler/optimization level that reference was compiled under.'],
      ['Candidate', 'A function in the target binary being compared against the reference.'],
      ['Target binary', 'The (possibly different) binary being searched for that vulnerability.'],
      ['DB: regular', 'Default compiler/optimization builds.'],
      ['DB: fno_inline', 'Extra reference builds compiled with -fno-inline, added for Type II to IV cases so the vulnerable function survives as a standalone reference.'],
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
