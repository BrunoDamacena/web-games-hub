export function createGame({ layout, cap, mystery }) {
  const pegs = layout.map(peg => peg.map((color, slot) => ({
    color,
    revealed: !mystery || slot === peg.length - 1,
  })));
  return { pegs, cap, history: [], extra: false };
}

export function isCompletePeg(peg, cap) {
  return peg.length === cap && peg.every(ring => ring.color === peg[0].color);
}

export function isSolved({ pegs, cap }) {
  return pegs.every(peg => peg.length === 0 || isCompletePeg(peg, cap));
}

function moveBlocker(source, target, cap) {
  const ring = source.at(-1);
  if (source === target || !ring) return 'invalid-source';
  if (isCompletePeg(source, cap)) return 'locked';
  if (target.length >= cap) return 'full';
  if (target.length && target.at(-1).color !== ring.color) return 'color-mismatch';
}

export function hasValidMoves({ pegs, cap }) {
  return pegs.some(source => pegs.some(target => !moveBlocker(source, target, cap)));
}

export function canMakeProgress({ pegs, cap }) {
  let emptySlots = 0;
  const slotsByColor = new Map();
  for (const peg of pegs) {
    const top = peg.at(-1);
    if (!top) {
      emptySlots += cap;
    } else {
      slotsByColor.set(top.color, (slotsByColor.get(top.color) ?? 0) + cap - peg.length);
    }
  }

  // Until a whole top run moves, the exposed colors stay the same. Moving
  // part of a run changes its size and the space on other matching pegs
  // by the same amount, so it cannot make a previously blocked run removable.
  return pegs.some(peg => {
    if (!peg.length || isCompletePeg(peg, cap)) return false;
    const { color } = peg.at(-1);
    let run = 1;
    while (run < peg.length && peg.at(-1 - run).color === color) run++;
    const available = emptySlots + slotsByColor.get(color) - (cap - peg.length);
    return available >= run;
  });
}

export function moveRing({ pegs, cap, history }, from, to) {
  const source = pegs[from];
  const target = pegs[to];
  const blocker = moveBlocker(source, target, cap);
  if (blocker) return blocker;

  history.push({ from, to });
  target.push(source.pop());
  if (source.length) source.at(-1).revealed = true;
  return 'moved';
}

export function undoMove({ pegs, history }) {
  const move = history.pop();
  if (!move) return false;
  pegs[move.from].push(pegs[move.to].pop());
  return true;
}

export function addExtraPeg(game) {
  if (game.extra || isSolved(game)) return false;
  game.pegs.push([]);
  game.extra = true;
  return true;
}
