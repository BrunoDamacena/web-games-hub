export const colors = {
  C: 'coral', B: 'blue', P: 'purple', L: 'gold', G: 'mint',
  T: 'teal', R: 'red', I: 'indigo', O: 'orange', K: 'pink',
  S: 'sky', V: 'olive', M: 'magenta', A: 'amber', N: 'navy',
  E: 'emerald', U: 'plum', D: 'brown', Y: 'lime', H: 'slate',
};
export const maxColors = Object.keys(colors).length;
export const maxHeight = 20;

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function mixingScore(board, height) {
  let changes = 0;
  let matchingTopRings = 0;
  let groupedRings = 0;
  let matchingBases = 0;
  for (const peg of board) {
    if (peg.length < 2) continue;
    if (peg[0] === peg[1]) {
      if (height <= 5) return -Infinity;
      matchingBases++;
    }
    // Prefer shorter runs at the exposed end, then reward changes throughout.
    let topRun = 1;
    while (topRun < peg.length && peg.at(-1 - topRun) === peg.at(-1)) topRun++;
    matchingTopRings += topRun - 1;
    let run = 1;
    for (let slot = 1; slot < peg.length; slot++) {
      if (peg[slot] !== peg[slot - 1]) {
        changes++;
        run = 1;
      } else {
        groupedRings += run++;
      }
    }
  }
  if (!changes) return -Infinity;
  // When layouts mix equally well, favor spreading the free slots across pegs.
  const spreadBonus = board.every(peg => peg.length) ? 0.5 : 0;
  if (height <= 5) return changes - height * matchingTopRings + spreadBonus;
  return changes - height * matchingTopRings - 3 * matchingBases - groupedRings + spreadBonus;
}

function exploreShuffles(palette, height, fallback) {
  const baseTransfers = (palette.length + 1) * (height - 1);
  const budget = 99 * baseTransfers; // The fallback used the first batch of transfers.
  let best = fallback;
  let bestScore = mixingScore(best, height);
  let transfers = 0;
  let useMixedStart = height > 3;

  while (transfers < budget) {
    // The fallback already has mixed bases. Continuing its reverse shuffle
    // spends more of the budget exploring ways to break up tall top runs.
    const board = useMixedStart
      ? fallback.map(peg => [...peg])
      : [...palette.map(color => Array(height).fill(color)), []];
    useMixedStart = height > 3 && !useMixedStart;
    const guideMoves = height > 5;
    let lastFrom;
    let lastTo;
    // Bound each walk so it can try another route after a dead end.
    for (let step = 0; step < 4 * baseTransfers && transfers < budget; step++) {
      const moves = [];
      const mixingMoves = [];
      for (const [from, source] of board.entries()) {
        if (!source.length || (source.length > 1 && source.at(-1) !== source.at(-2))) continue;
        const color = source.at(-1);
        for (const [to, target] of board.entries()) {
          if (from === to || target.length === height || (from === lastTo && to === lastFrom)) continue;
          // Reversing this move must never require taking a ring from a locked peg.
          if (target.length === height - 1 && target.every(ring => ring === color)) continue;
          const move = [from, to];
          moves.push(move);
          if (guideMoves && target.length && target.at(-1) !== source.at(-1) &&
              (target.length === 1 || target[0] !== target[1])) {
            mixingMoves.push(move);
          }
        }
      }
      if (!moves.length) break;
      const candidates = mixingMoves.length && Math.random() < 0.7 ? mixingMoves : moves;
      const [from, to] = candidates[Math.floor(Math.random() * candidates.length)];
      board[to].push(board[from].pop());
      lastFrom = from;
      lastTo = to;
      transfers++;

      const score = mixingScore(board, height);
      if (score >= bestScore) {
        best = board.map(peg => [...peg]);
        bestScore = score;
      }
    }
  }
  return best;
}

export function generatePuzzle(colorCount, height, previous) {
  const palette = Object.keys(colors).slice(0, colorCount);
  shuffle(palette);
  const donors = palette.map(color => Array(height).fill(color));
  const spare = [];
  const board = [...donors, spare];

  // Alternate transfers from two single-color donors. Keeping some rings
  // on each donor leaves room to build another interleaved stack.
  const reserve = height <= 5 ? 1 : Math.floor(height / 3);
  const [first, second] = donors;
  while (first.length > 1) spare.push(first.pop());
  for (let i = 0; i < reserve; i++) {
    first.push(second.pop());
    if (i < reserve - 1) first.push(spare.pop());
  }
  while (spare.length > reserve) first.push(spare.pop());

  let base = spare;
  let donor = second;
  for (const nextDonor of donors.slice(2)) {
    const rings = [];
    for (let i = 0; i < reserve; i++) {
      rings.push(nextDonor.pop());
      if (donor.length > reserve) rings.push(donor.pop());
    }
    while (donor.length > reserve) rings.push(donor.pop());
    if (reserve === 1) shuffle(rings);
    base.push(...rings);
    base = donor;
    donor = nextDonor;
  }
  while (donor.length) base.push(donor.pop());

  const layout = exploreShuffles(palette, height, board);
  shuffle(layout);
  if (JSON.stringify(layout) === JSON.stringify(previous)) {
    const differentPeg = layout.findIndex(peg => peg.join('') !== layout[0].join(''));
    if (differentPeg === -1) return board;
    layout.push(...layout.splice(0, differentPeg));
  }
  return layout;
}
