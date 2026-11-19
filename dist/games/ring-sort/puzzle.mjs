export const colors = { C: 'coral', B: 'blue', P: 'purple', L: 'gold', G: 'mint' };

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

export function generatePuzzle(colorCount, height, previous) {
  const palette = Object.keys(colors).slice(0, colorCount);
  shuffle(palette);
  const donors = palette.map(color => Array(height).fill(color));
  const spare = [];
  const board = [...donors, spare];

  // Pull from single-color stacks so every transfer can be reversed.
  // Borrow the spare to expose the first base, then leave one ring on it.
  const [first, second] = donors;
  while (first.length > 1) spare.push(first.pop());
  first.push(second.pop());
  while (spare.length > 1) first.push(spare.pop());

  // Fill the current base from two donors. Leave one ring on the earlier
  // donor so it can become the base of the next stack.
  let base = spare;
  let donor = second;
  for (const nextDonor of donors.slice(2)) {
    const rings = [nextDonor.pop()];
    while (donor.length > 1) rings.push(donor.pop());
    shuffle(rings);
    base.push(...rings);
    base = donor;
    donor = nextDonor;
  }
  while (donor.length) base.push(donor.pop());

  shuffle(board);
  if (JSON.stringify(board) === JSON.stringify(previous)) board.push(board.shift());
  return board;
}
