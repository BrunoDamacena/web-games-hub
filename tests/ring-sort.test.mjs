import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colors, generatePuzzle } from '../dist/games/ring-sort/puzzle.mjs';
import { addExtraPeg, createGame, isSolved, moveRing, undoMove } from '../dist/games/ring-sort/rules.mjs';

const layout = [['B', 'C'], ['C'], ['B'], []];

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
  t.mock.method(Math, 'random', () => 0.57);
  for (let count = 2; count <= 5; count++) {
    for (let cap = 2; cap <= 5; cap++) {
      const layout = generatePuzzle(count, cap);
      assert.equal(layout.length, count + 2);
      assert.ok(layout.some(peg => peg.length === 0));
      assert.ok(layout.every(peg => peg.length <= cap));
      assert.equal(isSolved(createGame({ layout, cap })), false);
      const expected = Object.keys(colors).slice(0, count).flatMap(color => Array(cap).fill(color));
      assert.deepEqual(layout.flat().sort(), expected.sort());
      assert.notDeepEqual(generatePuzzle(count, cap, layout), layout);
    }
  }
});

test('a generated puzzle can be solved using the normal move rules', t => {
  let seed = 42;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  const cap = 3;
  const pending = [createGame({ layout: generatePuzzle(3, cap), cap })];
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

test('tall puzzles regularly mix the two bottom rings', t => {
  let seed;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  let mixedBases = 0;
  for (let sample = 1; sample <= 40; sample++) {
    seed = sample;
    const layout = generatePuzzle(5, 5);
    mixedBases += layout.filter(peg => peg.length >= 2 && peg[0] !== peg[1]).length;
  }
  assert.ok(mixedBases >= 80, `Expected at least two mixed bases per board on average, got ${mixedBases / 40}`);
});
