import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeWord, pickAnswer, scoreGuess, updateLetterScores } from '../src/games/palavra/rules.mjs';

test('ignores accents and cedillas', () => {
  assert.equal(normalizeWord('AÇÕES'), 'acoes');
  assert.deepEqual(scoreGuess('acoes', 'ações'), Array(5).fill('correct'));
});

test('reserves exact matches before scoring misplaced duplicate letters', () => {
  assert.deepEqual(scoreGuess('saias', 'casal'), ['present', 'correct', 'absent', 'correct', 'absent']);
  assert.deepEqual(scoreGuess('arara', 'carro'), ['present', 'present', 'absent', 'correct', 'absent']);
});

test('never immediately repeats the preceding answer', () => {
  for (let round = 0; round < 20; round++) {
    assert.equal(pickAnswer(['praia', 'saúde'], 'praia'), 'saúde');
  }
});

test('Termo snapshot preserves the guess and answer counts and accented spellings', async () => {
  const load = async filename => {
    const url = new URL(`../src/games/palavra/${filename}`, import.meta.url);
    return (await readFile(url, 'utf8')).trim().split('\n');
  };
  const [words, answers] = await Promise.all([load('palavras.txt'), load('respostas.txt')]);
  const dictionary = new Set(words);
  assert.equal(answers.length, 1442);
  assert.equal(words.length, 10589);
  const spellings = new Map(words.map(word => [normalizeWord(word), word]));
  assert.equal(spellings.size, words.length);
  assert.equal(spellings.get('unica'), 'única');
  assert.equal(spellings.get('aioli'), 'aïoli');
  assert.ok(answers.includes('única'));
  assert.equal(new Set(answers.map(normalizeWord)).size, answers.length);
  assert.ok(words.every(word => /^\p{Script=Latin}{5}$/u.test(word)));
  assert.ok(answers.every(answer => dictionary.has(answer)));
});

test('keyboard retains the strongest clue for each letter across guesses', () => {
  const known = new Map();
  updateLetterScores(known, 'arara', scoreGuess('arara', 'carro'));
  assert.equal(known.get('a'), 'present');
  assert.equal(known.get('r'), 'correct');
  updateLetterScores(known, 'mover', scoreGuess('mover', 'carro'));
  assert.equal(known.get('r'), 'correct');
  assert.equal(known.get('m'), 'absent');
  updateLetterScores(known, 'calão', scoreGuess('calão', 'carro'));
  assert.equal(known.get('a'), 'correct');
  assert.equal(known.get('o'), 'correct');
});
