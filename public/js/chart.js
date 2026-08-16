import { hexToInt } from './bbstrip.js';

export function gtTokenSpans(gtRanges, targetFn) {
  if (!gtRanges || !gtRanges.length || !targetFn) return [];
  const spans = [];
  for (const g of gtRanges) {
    let lo = null, hi = null;
    for (const bb of targetFn.basic_blocks) {
      const s = hexToInt(bb.start_addr_hex), e = hexToInt(bb.end_addr_hex);
      if (s < g.end && e > g.start) {
        lo = lo === null ? bb.token_start : Math.min(lo, bb.token_start);
        hi = hi === null ? bb.token_end : Math.max(hi, bb.token_end);
      }
    }
    if (lo !== null) spans.push([lo, hi]);
  }
  return spans;
}

export function setupStageChart(canvasId, points, color, gtSpans, bestRange, nTokens, tooltipFmt, onHover, otherSpans) {
  const canvas = document.getElementById(canvasId);
  const tooltip = document.getElementById('chartTooltip');
  const ctx = canvas.getContext('2d');

  const padL = 36, padR = 10, padT = 10, padB = 24;
  let cssW = 0, cssH = 0, plotW = 0, plotH = 0;

  function xOf(tok) { return padL + (tok / nTokens) * plotW; }
  function yOf(score) { return padT + (1 - score) * plotH; }

  const styles = getComputedStyle(document.documentElement);
  const cText = styles.getPropertyValue('--text-faint').trim();
  const cGrid = styles.getPropertyValue('--border').trim();
  const cGt = styles.getPropertyValue('--gt').trim();
  const cModel = styles.getPropertyValue('--model').trim();

  let highlighted = null;

  function draw() {
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.strokeStyle = cGrid; ctx.fillStyle = cText;
    ctx.font = '9px ' + styles.fontFamily;
    ctx.globalAlpha = 0.5;
    for (let s = 0; s <= 1.001; s += 0.25) {
      const y = yOf(s);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let s = 0; s <= 1.001; s += 0.25) {
      ctx.fillText(s.toFixed(2), 2, yOf(s) + 3);
    }
    ctx.strokeStyle = cGrid;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
    ctx.fillText('0', padL - 2, cssH - 8);
    ctx.fillText(nTokens + ' tok', padL + plotW - 32, cssH - 8);

    ctx.strokeStyle = cText; ctx.setLineDash([4, 3]); ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(padL, yOf(0.99)); ctx.lineTo(padL + plotW, yOf(0.99)); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    if (highlighted !== null && points[highlighted] && points[highlighted].range) {
      const [lo, hi] = points[highlighted].range;
      ctx.fillStyle = color; ctx.globalAlpha = 0.22;
      ctx.fillRect(xOf(lo), padT, Math.max(1, xOf(hi) - xOf(lo)), plotH);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = cGt; ctx.globalAlpha = 0.18;
    for (const [lo, hi] of gtSpans) {
      ctx.fillRect(xOf(lo), padT, Math.max(1, xOf(hi) - xOf(lo)), plotH);
    }
    ctx.globalAlpha = 1;

    if (otherSpans && otherSpans.length) {
      ctx.globalAlpha = 0.16;
      for (const group of otherSpans) {
        ctx.fillStyle = group.color;
        for (const [lo, hi] of group.spans) {
          ctx.fillRect(xOf(lo), padT, Math.max(1, xOf(hi) - xOf(lo)), plotH);
        }
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([2, 2]);
      for (const group of otherSpans) {
        ctx.strokeStyle = group.color; ctx.lineWidth = 1.2;
        for (const [lo, hi] of group.spans) {
          const x0 = xOf(lo), x1 = xOf(hi);
          ctx.strokeRect(x0, padT, Math.max(1, x1 - x0), plotH);
        }
      }
      ctx.setLineDash([]); ctx.lineWidth = 1;
    }

    if (bestRange) {
      const [bs, be] = bestRange;
      ctx.strokeStyle = cModel; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(xOf(bs), padT); ctx.lineTo(xOf(bs), padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xOf(be), padT); ctx.lineTo(xOf(be), padT + plotH); ctx.stroke();
      ctx.setLineDash([]); ctx.lineWidth = 1;
    }

    if (!points.length) return;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.3;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xOf(p.x), y = yOf(p.y);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    points.forEach((p, i) => {
      const x = xOf(p.x), y = yOf(p.y);
      const isHi = highlighted === i;
      ctx.beginPath();
      ctx.arc(x, y, isHi ? 4.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      if (isHi) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
    });
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    cssW = canvas.parentElement.clientWidth - 24;
    cssH = 200;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    plotW = cssW - padL - padR; plotH = cssH - padT - padB;
    draw();
  }

  function nearest(mx) {
    if (!points.length) return null;
    let best = null, bestD = Infinity;
    for (const p of points) {
      const dd = Math.abs(xOf(p.x) - mx);
      if (dd < bestD) { bestD = dd; best = p; }
    }
    return bestD < 10 ? best : null;
  }

  canvas.addEventListener('mousemove', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const p = nearest(mx);
    if (p) {
      highlighted = p.i;
      draw();
      tooltip.style.display = 'block';
      tooltip.style.left = (ev.clientX + 12) + 'px';
      tooltip.style.top = (ev.clientY - 10) + 'px';
      tooltip.textContent = tooltipFmt(p.w);
      if (onHover) onHover(p);
    } else {
      tooltip.style.display = 'none';
      if (onHover) onHover(null);
    }
  });
  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none'; highlighted = null; draw();
    if (onHover) onHover(null);
  });

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas.parentElement);

  resize();
  return {
    highlight(i) { highlighted = i; draw(); },
    destroy() { ro.disconnect(); },
  };
}
