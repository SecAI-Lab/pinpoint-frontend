const SECTIONS = [
  {
    title: 'Staged search',
    rows: [
      ['Size-ratio pruning', 'Already applied here. A candidate whose token size falls below 54% of the vulnerable reference (\u03b1 = 0.540) is skipped before matching.'],
      ['Stage 1', 'Whole-function comparison. Entry stage for Type I.'],
      ['Stage 2', 'Block-stride search. A window slides one basic block per step. Entry stage for Types II-IV.'],
      ['Stage 3', 'Token-stride search. One token per step, for ranges block boundaries miss.'],
      ['Threshold (0.99)', 'The stage that reaches it ends the search, and its score becomes the final one.'],
    ],
  },
  {
    title: 'Label (inlining type)',
    rows: [
      ['outer(inner)', 'The outer function has the inner one inlined into it.'],
      ['V', 'Type I. Standalone vulnerable function; keeps its own boundary.'],
      ['NV-V', 'Type II. Non-vulnerable function that inlines a vulnerable one.'],
      ['V-NV', 'Type III. Vulnerable function that inlines non-vulnerable ones.'],
      ['V-V', 'Type IV. Vulnerable function that inlines another vulnerable one.'],
      ['NV', 'Unrelated to this query.'],
    ],
  },
  {
    title: 'Localization',
    rows: [
      ['Ground truth', 'The vulnerable address range, recovered from DWARF metadata.'],
      ['Reported range', 'Where PinPoint places the vulnerability inside the candidate.'],
      ['Ranking', 'Candidate functions ordered by similarity score.'],
      ['Containment count', 'Tie-break: among top-scoring windows, the one covering the most other window starts wins.'],
    ],
  },
  {
    title: 'Corpus',
    rows: [
      ['Vulnerable reference', 'The compiled vulnerable function being searched for.'],
      ['Candidate', 'A function recovered from the target binary.'],
      ['Target binary', 'The binary being inspected.'],
      ['Reference configuration', 'The compiler and optimization level the reference was compiled with. The eight default builds are two compilers \u00d7 -O0 through -O3.'],
      ['default', 'GCC and Clang, -O0 through -O3, inlining left as the compiler chose.'],
      ['fno_inline', '-fno-inline builds, so Types II-IV still have a standalone reference.'],
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
