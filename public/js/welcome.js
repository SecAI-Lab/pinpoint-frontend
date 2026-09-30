import { PAPER_CASES } from './examples.js';
import { citeCard, bindCite } from './cite.js';

// One narrow column, read top to bottom: what the tool does, the four panes, the
// mechanism the fourth pane draws, then the paper's cases as plain links.

// each pane's body is a list of lines, one fact per line
const PANES = [
  ['Target binary', 'first column', [
    'One row per binary.',
    'Search by name, CVE, or vulnerable function.',
  ]],
  ['Vulnerable reference', 'second column', [
    'One query per row.',
    '<b>Badge</b>: rank, and the last executed stage.',
  ]],
  ['Ranking', 'table', [
    'Candidates by similarity.',
    '<b>Label</b>: inlining type.',
    '<b>Reported range</b>: where PinPoint places the vulnerable code.',
  ]],
  ['Window-level similarity scores', 'charts', [
    'One chart per stage that ran, so one or two.',
    'One point per window position.',
  ]],
];

const STAGES = [
  ['Stage 1', 'Whole-function matching.'],
  ['Stage 2', 'Basic-block-stride search. <span class="wDim">coarse-grained</span>'],
  ['Stage 3', 'Token-stride search. <span class="wDim">fine-grained</span>'],
];

const RULES = [
  ['Threshold &tau; = 0.99', 'PinPoint advances to the next stage only when the current stage fails to reach it.'],
  ['Size-ratio pruning', 'A candidate with fewer than &alpha; = 0.540 of the reference\'s tokens is skipped.'],
];

const LEGEND = [
  ['var(--gt)', 'Vulnerable range', 'where it actually is, from DWARF'],
  ['var(--model)', 'Reported range', 'produced by the last executed stage'],
  ['#c77dff', 'Other inlinee', 'a second vulnerable function in the candidate'],
];

// A wireframe of the app with the four numbered parts marked on it, drawn rather
// than screenshotted so it follows the theme and never goes stale.
function layoutMap() {
  const rows = (x, w, y0, n, gap) => Array.from({ length: n }, (_, k) =>
    `<line x1="${x}" y1="${y0 + k * gap}" x2="${x + w}" y2="${y0 + k * gap}"
       stroke="var(--border)" stroke-width="1.5" stroke-linecap="round"/>`).join('');
  const badge = (x, y, n) => `
    <circle cx="${x}" cy="${y}" r="10" fill="var(--bg)" stroke="var(--accent)" stroke-width="1.2"/>
    <circle cx="${x}" cy="${y}" r="10" fill="var(--accent-soft)"/>
    <text x="${x}" y="${y + 3.6}" text-anchor="middle" class="lmNum">${n}</text>`;
  return `
  <svg class="layoutMap" viewBox="0 0 360 196" role="img"
       aria-label="Wireframe of the page: the first column lists target binaries (1), the second lists vulnerable references (2), the table on the right is the ranking (3), and the charts below it belong to the selected candidate (4).">
    <rect x="0.75" y="0.75" width="358.5" height="194.5" rx="8"
          fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
    <line x1="0.75" y1="26" x2="359.25" y2="26" stroke="var(--border)" stroke-width="1.5"/>
    <line x1="76" y1="26" x2="76" y2="195.25" stroke="var(--border)" stroke-width="1.5"/>
    <line x1="158" y1="26" x2="158" y2="195.25" stroke="var(--border)" stroke-width="1.5"/>
    <line x1="158" y1="118" x2="359.25" y2="118" stroke="var(--border)" stroke-width="1.5"/>

    ${rows(12, 52, 42, 9, 15)}
    ${rows(88, 58, 42, 9, 15)}

    <!-- 3: a ranking table, so it is drawn as one -->
    <line x1="170" y1="44" x2="348" y2="44" stroke="var(--border)" stroke-width="2"/>
    ${rows(170, 178, 60, 4, 14)}
    ${[196, 238, 288].map(x =>
      `<line x1="${x}" y1="32" x2="${x}" y2="106" stroke="var(--border)"
         stroke-width="1" opacity=".55"/>`).join('')}

    <!-- 4: one chart per stage, drawn as two stacked panels -->
    <line x1="158" y1="152" x2="359.25" y2="152" stroke="var(--border)" stroke-width="1"
          opacity=".7" stroke-dasharray="3 3"/>
    <rect x="250" y="122" width="30" height="24" fill="var(--gt)" opacity=".22"/>
    <path d="M172 144 L198 140 L224 142 L250 132 L268 124 L292 131 L318 140 L344 145"
          fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="250" y="164" width="30" height="24" fill="var(--gt)" opacity=".22"/>
    <path d="M172 186 L198 183 L224 185 L250 175 L268 166 L292 173 L318 182 L344 187"
          fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/>

    ${badge(42, 110, 1)}
    ${badge(117, 110, 2)}
    ${badge(182, 72, 3)}
    ${badge(182, 156, 4)}
  </svg>`;
}

function chartAnatomy() {
  const grid = [0, 0.5, 1]
    .map(v => `<line x1="44" y1="${112 - 88 * v}" x2="536" y2="${112 - 88 * v}"
        stroke="var(--border)" stroke-width="1" opacity=".6"/>
      <text x="38" y="${115 - 88 * v}" text-anchor="end" class="anAx">${v.toFixed(1)}</text>`).join('');
  return `
  <svg class="anatomy" viewBox="0 0 552 140" role="img"
       aria-label="A sliding-window chart: similarity on the y axis, window position on the x axis, an orange band for the true location of the vulnerable code, blue dashed markers for PinPoint's answer, and a dashed threshold at 0.99.">
    ${grid}
    <line x1="44" y1="22" x2="44" y2="112" stroke="var(--border)" stroke-width="1"/>

    <rect x="296" y="22" width="106" height="90" fill="var(--gt)" opacity=".16"/>
    <line x1="312" y1="22" x2="312" y2="112" stroke="var(--model)" stroke-width="1.4" stroke-dasharray="4 3"/>
    <line x1="392" y1="22" x2="392" y2="112" stroke="var(--model)" stroke-width="1.4" stroke-dasharray="4 3"/>

    <line x1="44" y1="23" x2="536" y2="23" stroke="var(--text-faint)" stroke-width="1"
          stroke-dasharray="4 3" opacity=".8"/>
    <text x="536" y="17" text-anchor="end" class="anAx">0.99</text>

    <path d="M50 103 L86 99 L122 105 L158 88 L194 93 L230 73 L266 58 L302 39 L338 27 L352 25 L388 42 L424 71 L460 94 L496 101 L532 105"
          fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/>
    <g fill="var(--accent)">
      <circle cx="50" cy="103" r="1.7"/><circle cx="86" cy="99" r="1.7"/><circle cx="122" cy="105" r="1.7"/>
      <circle cx="158" cy="88" r="1.7"/><circle cx="194" cy="93" r="1.7"/><circle cx="230" cy="73" r="1.7"/>
      <circle cx="266" cy="58" r="1.7"/><circle cx="302" cy="39" r="1.7"/><circle cx="338" cy="27" r="1.7"/>
      <circle cx="352" cy="25" r="3.2"/>
      <circle cx="388" cy="42" r="1.7"/><circle cx="424" cy="71" r="1.7"/><circle cx="460" cy="94" r="1.7"/>
      <circle cx="496" cy="101" r="1.7"/><circle cx="532" cy="105" r="1.7"/>
    </g>
    <text x="352" y="13" text-anchor="middle" class="anTag">best window</text>
    <line x1="352" y1="15" x2="352" y2="21" stroke="var(--accent)" stroke-width="1"/>

    <text x="14" y="67" text-anchor="middle" class="anAx" transform="rotate(-90 14 67)">similarity</text>
    <text x="44" y="127" class="anAx">start of candidate</text>
    <text x="536" y="127" text-anchor="end" class="anAx">end</text>
  </svg>`;
}

function caseLink(c, i) {
  return `
    <button type="button" class="wCase" data-case="${i}" title="${c.caption}">
      <span class="wCaseFig">${c.figure}</span>
      <span class="wCaseName">${c.title}</span>
      <span class="wCaseRoute"><code>${c.refFunc}</code> &rarr; <code>${c.target}</code></span>
      <span class="wCaseGo">&rarr;</span>
    </button>`;
}

export function renderWelcome(container, onOpenCase) {
  container.innerHTML = `
  <div class="welcome">
    <p class="wLede">
      <span>A vulnerable callee can be absorbed into a larger inliner or fragmented across
      non-contiguous regions, no longer surviving as an independent function.</span>
      <span>PinPoint localizes known vulnerabilities under such function inlining, to support
      precise binary patching.</span>
    </p>

    <div class="wGrid">
      <section class="wSection">
        <h3>Reading the page</h3>
        ${layoutMap()}
          <ol class="wList">
          ${PANES.map(([title, where, body], i) => `
            <li>
              <span class="wNum">${i + 1}</span>
              <span class="wItemHead"><b>${title}</b><span class="wWhere">${where}</span></span>
              <span class="wItemBody">${body.map(l => `<span>${l}</span>`).join('')}</span>
            </li>`).join('')}
        </ol>
      </section>

      <section class="wSection">
        <h3>How the search works</h3>
        <p class="wPara">A threshold-gated three-stage cascade, each stage using a different window
        size. At Stages 2 and 3, sliding windows are compared against the vulnerable reference.</p>
        <dl class="wStages">
          ${STAGES.map(([name, body]) => `<dt>${name}</dt><dd>${body}</dd>`).join('')}
        </dl>
        <dl class="wStages wRules">
          ${RULES.map(([name, body]) => `<dt>${name}</dt><dd>${body}</dd>`).join('')}
        </dl>

        ${chartAnatomy()}
        <ul class="wLegend">
          ${LEGEND.map(([c, name, note]) =>
            `<li><span class="sw" style="background:${c}"></span>
             <span class="wLegendText"><b>${name}</b> ${note}</span></li>`).join('')}
        </ul>
      </section>

      <section class="wSection">
        <h3>Examples from the paper <span class="wSectionNote">Figure 6</span></h3>
        <div class="wCases">${PAPER_CASES.map(caseLink).join('')}</div>
        ${citeCard()}
      </section>
    </div>
  </div>`;

  container.querySelectorAll('.wCase').forEach(btn => {
    btn.addEventListener('click', () => onOpenCase(PAPER_CASES[+btn.dataset.case]));
  });

  bindCite(container);
}
