// Bottom-right citation card: the reference for the paper this page visualizes,
// plus its BibTeX entry, kept out of the way until asked for.
export function initCite(root, button, panel, copyBtn, bibEl) {
  function setOpen(open) {
    panel.hidden = !open;
    button.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
  }
  setOpen(false);

  button.addEventListener('click', () => setOpen(panel.hidden));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); button.focus(); }
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !root.contains(e.target)) setOpen(false);
  });

  function flash(text) {
    const was = copyBtn.textContent;
    copyBtn.textContent = text;
    setTimeout(() => { copyBtn.textContent = was; }, 1400);
  }

  copyBtn.addEventListener('click', async () => {
    const bib = bibEl.textContent.trim();
    try {
      // Absent over plain http on a non-localhost host, hence the fallback.
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bib);
      } else {
        const ta = document.createElement('textarea');
        ta.value = bib;
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
