export const colors = { C: 'coral', B: 'blue', P: 'purple', L: 'gold', G: 'mint' };

export function generatePuzzle(colorCount, height, previous) {
  const solved = Object.keys(colors).slice(0, colorCount).map(color => Array(height).fill(color));
  solved.push([], []);

  let best;
  let bestScore = 0;
  // Try several walks so an early shuffle that traps matching rings at the base
  // does not determine the final layout.
  for (let attempt = 0; attempt < 6; attempt++) {
    const board = solved.map(peg => [...peg]);
    let lastMove;
    // Each shuffle move can be reversed under the normal placement rules.
    // Leaving a matching ring (or an empty peg) makes the original peg a legal destination.
    for (let step = 0; step < colorCount * height * 6; step++) {
      const moves = [];
      board.forEach((source, from) => {
        if (!source.length || (source.length > 1 && source.at(-1) !== source.at(-2))) return;
        board.forEach((target, to) => {
          if (from === to || target.length === height) return;
          if (lastMove?.from === to && lastMove.to === from) return;
          moves.push({ from, to });
        });
      });
      if (!moves.length) break;
      const { from, to } = moves[Math.floor(Math.random() * moves.length)];
      board[to].push(board[from].pop());
      lastMove = { from, to };

      // A color change near the base breaks up more of the original stack.
      let score = 0;
      for (const peg of board) {
        for (let slot = 1; slot < peg.length; slot++) {
          if (peg[slot] !== peg[slot - 1]) score += height - slot;
        }
      }
      if (score && score >= bestScore && board.some(peg => !peg.length)) {
        best = board.map(peg => [...peg]);
        bestScore = score;
      }
    }
  }

  // Make two reversible moves to create a mixed stack if no walk did.
  if (!best) {
    best = solved.map(peg => [...peg]);
    best[colorCount].push(best[1].pop());
    best[1].push(best[0].pop());
  }

  // Different peg positions give a fresh layout even if a shuffle repeats.
  if (JSON.stringify(best) === JSON.stringify(previous)) best.push(best.shift());
  return best;
}
