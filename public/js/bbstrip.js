export function hexToInt(h) { return h ? parseInt(h, 16) : 0; }

export function tokenRangeToBBRange(fnData, lo, hi) {
  if (!fnData || !fnData.basic_blocks.length || lo == null || hi == null) return null;
  let startBb = null, endBb = null;
  for (const bb of fnData.basic_blocks) {
    if (bb.token_start < hi && bb.token_end > lo) {
      if (startBb === null) startBb = bb.bb_idx;
      endBb = bb.bb_idx;
    }
  }
  return startBb === null ? null : { start_bb: startBb, end_bb: endBb };
}
