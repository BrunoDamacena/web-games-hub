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

export function moveRing({ pegs, cap, history }, from, to) {
  const source = pegs[from];
  const target = pegs[to];
  const ring = source.at(-1);
  if (from === to || !ring) return 'invalid-source';
  if (isCompletePeg(source, cap)) return 'locked';
  if (target.length >= cap) return 'full';
  if (target.length && target.at(-1).color !== ring.color) return 'color-mismatch';

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
