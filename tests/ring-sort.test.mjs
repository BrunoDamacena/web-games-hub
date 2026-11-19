import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colors, generatePuzzle } from '../src/games/ring-sort/puzzle.mjs';
import { addExtraPeg, canMakeProgress, createGame, hasValidMoves, isSolved, moveRing, undoMove } from '../src/games/ring-sort/rules.mjs';

const layout = [['B', 'C'], ['C'], ['B'], []];

test('detects a deadlock after a legal move leaves only mismatches and full targets', () => {
  const game = createGame({ layout: [['A', 'C'], ['B', 'C'], [], ['B', 'A']], cap: 2 });
  assert.equal(hasValidMoves(game), true);
  assert.equal(moveRing(game, 3, 2), 'moved');
  const stuck = structuredClone(game);
  assert.equal(hasValidMoves(game), false);
  assert.equal(canMakeProgress(game), false);
  assert.equal(isSolved(game), false);
  assert.deepEqual(game, stuck);

  const solved = createGame({ layout: [['A', 'A'], []], cap: 2 });
  assert.equal(isSolved(solved), true);
  assert.equal(hasValidMoves(solved), false);
});

test('detects a forced loop even when rings can still move', () => {
  const game = createGame({ layout: [['C', 'C'], ['C', 'A'], ['A', 'B'], ['A', 'B', 'B']], cap: 3 });
  assert.equal(hasValidMoves(game), true);
  assert.equal(canMakeProgress(game), false);
  assert.equal(moveRing(game, 3, 2), 'moved');
  assert.equal(canMakeProgress(game), false);
  assert.equal(moveRing(game, 2, 3), 'moved');
  assert.equal(canMakeProgress(game), false);
});

test('recognizes a top run that can be removed across multiple pegs', () => {
  const game = createGame({
    layout: ['BBC', 'BAC', 'ADD', 'DCC', 'ADAB'].map(peg => [...peg]),
    cap: 4,
  });
  assert.equal(canMakeProgress(game), true);
  assert.equal(moveRing(game, 3, 0), 'moved');
  assert.equal(canMakeProgress(game), true);
  assert.equal(moveRing(game, 3, 1), 'moved');
  assert.equal(game.pegs[3].at(-1).color, 'D');
});

test('moves one top ring onto an empty peg or matching color', () => {
  const game = createGame({ layout, cap: 2 });
  assert.equal(moveRing(game, 0, 3), 'moved');
  assert.equal(moveRing(game, 3, 1), 'moved');
  assert.deepEqual(game.pegs.map(peg => peg.map(ring => ring.color)), [['B'], ['C', 'C'], ['B'], []]);
  assert.equal(game.history.length, 2);
});

test('rejects invalid sources, full pegs, and mismatched colors without mutating the game', () => {
  const game = createGame({ layout, cap: 2 });
  const before = structuredClone(game);
  assert.equal(moveRing(game, 3, 1), 'invalid-source');
  assert.equal(moveRing(game, 1, 1), 'invalid-source');
  assert.equal(moveRing(game, 1, 0), 'full');
  assert.equal(moveRing(game, 0, 2), 'color-mismatch');
  assert.deepEqual(game, before);
});

test('undo reverses moves in order and can reopen a solved board', () => {
  const game = createGame({ layout, cap: 2 });
  assert.equal(undoMove(game), false);
  assert.equal(moveRing(game, 0, 1), 'moved');
  assert.equal(isSolved(game), false);
  assert.equal(moveRing(game, 0, 2), 'moved');
  assert.equal(isSolved(game), true);
  assert.equal(undoMove(game), true);
  assert.equal(isSolved(game), false);
  assert.equal(undoMove(game), true);
  assert.deepEqual(game, createGame({ layout, cap: 2 }));
});

test('completed pegs are locked during play and undo can reverse their completion', () => {
  const game = createGame({ layout, cap: 2 });
  assert.equal(moveRing(game, 0, 1), 'moved');
  const completed = structuredClone(game);
  assert.equal(moveRing(game, 1, 3), 'locked');
  assert.equal(moveRing(game, 0, 1), 'full');
  assert.deepEqual(game, completed);

  assert.equal(undoMove(game), true);
  assert.equal(moveRing(game, 1, 3), 'moved');
});

test('mystery rings reveal at the top and stay revealed after undo', () => {
  const puzzle = { layout, cap: 2, mystery: true };
  const game = createGame(puzzle);
  assert.deepEqual(game.pegs[0].map(ring => ring.revealed), [false, true]);
  moveRing(game, 0, 1);
  assert.equal(game.pegs[0][0].revealed, true);
  undoMove(game);
  assert.equal(game.pegs[0][0].revealed, true);
  assert.equal(createGame(puzzle).pegs[0][0].revealed, false);
});

test('adds one extra peg per attempt and disables the booster after a win', () => {
  const puzzle = { layout, cap: 2 };
  const game = createGame(puzzle);
  assert.equal(addExtraPeg(game), true);
  assert.deepEqual(game.pegs.at(-1), []);
  assert.equal(addExtraPeg(game), false);
  const restarted = createGame(puzzle);
  assert.equal(restarted.pegs.length, layout.length);
  assert.equal(restarted.extra, false);
  moveRing(restarted, 0, 1);
  moveRing(restarted, 0, 2);
  assert.equal(addExtraPeg(restarted), false);
});

test('generates a fresh mixed board with the requested ring counts and space', t => {
  let seed = 57;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  for (let count = 2; count <= 5; count++) {
    for (let cap = 2; cap <= 5; cap++) {
      const expected = Object.keys(colors).slice(0, count).flatMap(color => Array(cap).fill(color)).sort();
      let previous;
      for (let sample = 0; sample < 40; sample++) {
        const layout = generatePuzzle(count, cap, previous);
        assert.equal(layout.length, count + 1);
        assert.ok(layout.every(peg => peg.length <= cap && (peg.length < 2 || peg[0] !== peg[1])));
        assert.equal(isSolved(createGame({ layout, cap })), false);
        assert.deepEqual(layout.flat().sort(), expected);
        assert.notDeepEqual(layout, previous);
        previous = layout;
      }
    }
  }
});

test('a generated puzzle with no empty peg can be solved using the normal move rules', t => {
  let seed = 42;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  const cap = 3;
  const board = Array.from({ length: 30 }, () => generatePuzzle(3, cap))
    .find(pegs => pegs.every(peg => peg.length));
  assert.ok(board, 'Expected a board with the spare slots split across pegs');
  const pending = [createGame({ layout: board, cap })];
  const visited = new Set();
  while (pending.length) {
    const game = pending.pop();
    if (isSolved(game)) return;
    const key = game.pegs.map(peg => peg.map(ring => ring.color).join('')).sort().join('|');
    if (visited.has(key)) continue;
    visited.add(key);

    for (let from = 0; from < game.pegs.length; from++) {
      if (!game.pegs[from].length) continue;
      for (let to = 0; to < game.pegs.length; to++) {
        const candidate = { cap, pegs: structuredClone(game.pegs), history: [] };
        if (moveRing(candidate, from, to) === 'moved') pending.push(candidate);
      }
    }
  }
  assert.fail('The generated board had no legal solution');
});

test('tall puzzles rarely group matching rings at the top', t => {
  let seed = 42;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  let matchingTops = 0;
  for (let sample = 0; sample < 30; sample++) {
    const layout = generatePuzzle(5, 5);
    matchingTops += layout.filter(peg => peg.length > 1 && peg.at(-1) === peg.at(-2)).length;
  }
  assert.ok(matchingTops <= 15, `Expected at most 15 matching tops across 30 boards, got ${matchingTops}`);
});

test('supports 20 colors, 20 rings per stack, and both limits together', () => {
  for (const [count, cap] of [[20, 2], [2, 20], [20, 20]]) {
    const layout = generatePuzzle(count, cap);
    assert.equal(layout.length, count + 1);
    assert.ok(layout.every(peg => peg.length <= cap));
    const expected = Object.keys(colors).slice(0, count).flatMap(color => Array(cap).fill(color)).sort();
    assert.deepEqual(layout.flat().sort(), expected);
  }
});


test('maximum-size puzzles break up long runs throughout the stacks', t => {
  let seed = 42;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  for (let sample = 0; sample < 4; sample++) {
    const layout = generatePuzzle(20, 20);
    const matchingNeighbors = layout.reduce((total, peg) =>
      total + peg.filter((color, slot) => slot > 0 && color === peg[slot - 1]).length, 0);
    assert.ok(matchingNeighbors < 150, `Expected fewer matching neighbors, got ${matchingNeighbors}`);
  }
});
