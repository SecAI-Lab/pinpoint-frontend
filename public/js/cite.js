// The reference for the paper this page visualizes, shown in the guide beneath
// the paper's own examples.

const BIB = `@inproceedings{pinpoint2026,
  title = {Localizing Vulnerabilities under Function Inlining Toward Precise Binary Patching},
  author = {Jeon, Mijin and Zhang, Yiyue and Koo, Hyungjoon},
  booktitle = {Proceedings of the 42nd Annual Computer Security Applications Conference (ACSAC '26)},
  year = {2026}
}`;

export function citeCard() {
  return `
    <div class="wCite">
      <div class="wCiteLabel">Cite this paper</div>
      <div class="wCiteRef">
        Mijin Jeon, Yiyue Zhang, and Hyungjoon Koo.
        &ldquo;Localizing Vulnerabilities under Function Inlining Toward Precise Binary
        Patching.&rdquo;
        <span class="wCiteVenue">In <i>Proceedings of the 42nd Annual Computer Security
        Applications Conference (ACSAC &rsquo;26)</i>, 2026.</span>
      </div>
      <pre class="wCiteBib">${BIB}</pre>
      <div class="wCiteActions">
        <button type="button" class="wCiteBtn" data-cite-copy>Copy BibTeX</button>
        <a class="wCiteBtn" href="https://github.com/SecAI-Lab/pinpoint"
           target="_blank" rel="noopener">Artifact &#8599;</a>
      </div>
    </div>`;
}

// Called once the card is in the DOM, since the guide renders lazily.
export function bindCite(scope) {
  const copyBtn = scope.querySelector('[data-cite-copy]');
  const bibEl = scope.querySelector('.wCiteBib');
  if (!copyBtn || !bibEl) return;

  function flash(text) {
    const was = copyBtn.textContent;
    copyBtn.textContent = text;
    setTimeout(() => { copyBtn.textContent = was; }, 1400);
  }

  copyBtn.addEventListener('click', async () => {
    try {
      // Absent over plain http on a non-localhost host, hence the fallback.
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(BIB);
      } else {
        const ta = document.createElement('textarea');
        ta.value = BIB;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand refused');
      }
      flash('Copied');
    } catch {
      // Last resort: select it so the reader can copy by hand.
      const r = document.createRange();
      r.selectNodeContents(bibEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      flash('Press ⌘/Ctrl+C');
    }
  });
}
