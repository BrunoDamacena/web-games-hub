import { normalizeWord, pickAnswer, scoreGuess, updateLetterScores } from './rules.mjs';

const maxAttempts = 6;
const wordLength = 5;
const portugueseLetter = /^\p{Script=Latin}$/u;
const grid = document.querySelector('#word-grid');
const form = document.querySelector('#guess-form');
const submit = document.querySelector('#submit-guess');
const newRound = document.querySelector('#new-round');
const keyboard = document.querySelector('#word-keyboard');
const tutorial = document.querySelector('#word-tutorial');
const help = document.querySelector('#word-help');
const attempts = document.querySelector('#attempts');

const feedback = {
  correct: ['✓', 'no lugar certo'],
  present: ['↔', 'em outro lugar'],
  absent: ['×', 'sem ocorrência disponível'],
};

const tutorialKey = 'palavra-tutorial-seen';
let showTutorial = true;
try {
  showTutorial = localStorage.getItem(tutorialKey) !== '1';
} catch {
  // The tutorial remains available when browser storage is unavailable.
}

help.addEventListener('click', () => tutorial.showModal());
tutorial.addEventListener('close', () => {
  try {
    localStorage.setItem(tutorialKey, '1');
  } catch {
    // Closing still works without browser storage.
  }
  if (!submit.disabled) focusCell();
});
if (showTutorial) tutorial.showModal();

const letterKeys = new Map();
for (const letters of ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']) {
  const row = document.createElement('div');
  row.className = 'word-key-row';
  for (const letter of letters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'word-key';
    button.dataset.key = letter;
    button.textContent = letter.toUpperCase();
    letterKeys.set(letter, button);
    row.append(button);
  }
  keyboard.append(row);
}

const erase = document.createElement('button');
erase.type = 'button';
erase.className = 'word-key';
erase.dataset.key = 'Backspace';
erase.textContent = '⌫';
erase.setAttribute('aria-label', 'Apagar letra');
keyboard.lastElementChild.append(erase, submit);
keyboard.addEventListener('click', event => {
  const key = event.target.closest('button')?.dataset.key;
  if (!key || keyboard.disabled) return;
  if (key === 'Backspace') eraseLetter();
  else enterLetters(key);
  if (event.detail > 0) focusCell();
});

function drawKeyboard(scores) {
  for (const [letter, key] of letterKeys) {
    const score = scores.get(letter);
    key.dataset.score = score ?? '';
    key.dataset.mark = feedback[score]?.[0] ?? '';
    const label = letter.toUpperCase();
    key.setAttribute('aria-label', score ? `${label}, ${feedback[score][1]}` : label);
  }
}

async function loadWords(file) {
  const response = await fetch(new URL(file, import.meta.url));
  if (!response.ok) throw new Error('Não foi possível carregar o dicionário.');
  const words = (await response.text()).trim().split(/\r?\n/);
  if (!words.every(word => word.length === wordLength && [...word].every(letter => portugueseLetter.test(letter)))) {
    throw new Error('Dicionário inválido.');
  }
  return words;
}

const rows = Array.from({ length: maxAttempts }, () => {
  const row = document.createElement('li');
  const tiles = Array.from({ length: wordLength }, (_, position) => {
    const tile = document.createElement('span');
    tile.className = 'word-tile';
    tile.style.setProperty('--reveal-delay', `${position * 55}ms`);
    tile.setAttribute('aria-hidden', 'true');
    row.append(tile);
    return tile;
  });
  grid.append(row);
  return { row, tiles };
});

let selectedCell = 0;
const guessCells = Array.from({ length: wordLength }, (_, index) => {
  const tile = document.createElement('button');
  tile.className = 'word-tile word-cell';
  tile.type = 'button';

  tile.addEventListener('focus', () => selectCell(index));
  tile.addEventListener('click', () => {
    selectCell(index);
    focusCell();
  });
  tile.addEventListener('paste', event => {
    event.preventDefault();
    enterLetters(event.clipboardData.getData('text'));
    focusCell();
  });
  tile.addEventListener('keydown', event => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    switch (event.key) {
      case 'ArrowLeft':
        selectCell(index - 1);
        break;
      case 'ArrowRight':
        selectCell(index + 1);
        break;
      case 'Backspace':
        eraseLetter();
        break;
      case 'Enter':
        event.preventDefault();
        form.requestSubmit(submit);
        return;
      default:
        if (!portugueseLetter.test(event.key)) return;
        enterLetters(event.key);
    }
    event.preventDefault();
    focusCell();
  });
  return tile;
});

function selectCell(index) {
  guessCells[selectedCell].classList.remove('selected');
  selectedCell = Math.max(0, Math.min(wordLength - 1, index));
  guessCells[selectedCell].classList.add('selected');
}

function focusCell() {
  guessCells[selectedCell].focus({ preventScroll: true });
}

function setLetter(index, letter) {
  const tile = guessCells[index];
  tile.value = letter;
  tile.textContent = letter.toUpperCase();
  tile.setAttribute('aria-label', `Letra ${index + 1} de ${wordLength}: ${tile.textContent || 'vazia'}`);
}

function enterLetters(text) {
  const letters = [...text.normalize('NFC').toLowerCase()].filter(letter => portugueseLetter.test(letter));
  letters.slice(0, wordLength - selectedCell).forEach((letter, offset) => {
    setLetter(selectedCell + offset, letter);
  });
  selectCell(selectedCell + letters.length);
}

function eraseLetter() {
  if (!guessCells[selectedCell].value) selectCell(selectedCell - 1);
  setLetter(selectedCell, '');
}

function activateRow(index) {
  const { row } = rows[index];
  guessCells.forEach((_, index) => setLetter(index, ''));
  row.replaceChildren(...guessCells);
  row.removeAttribute('aria-hidden');
  row.setAttribute('aria-label', `Tentativa ${index + 1}`);
  selectCell(0);
}

function drawRow(index, word = '', scores = []) {
  const { row, tiles } = rows[index];
  row.replaceChildren(...tiles);
  row.setAttribute('aria-hidden', String(scores.length === 0));
  const descriptions = [];
  tiles.forEach((tile, position) => {
    const letter = word[position]?.toUpperCase() ?? '';
    const score = scores[position] ?? '';
    tile.textContent = letter;
    tile.dataset.score = score;
    tile.dataset.mark = feedback[score]?.[0] ?? '';
    if (score) descriptions.push(`${letter} ${feedback[score][1]}`);
  });
  row.setAttribute('aria-label', descriptions.join(', '));
}

try {
  const [words, answers] = await Promise.all([
    loadWords('./palavras.txt'),
    loadWords('./respostas.txt'),
  ]);
  const dictionary = new Map(words.map(word => [normalizeWord(word), word]));
  let answer;
  let played;
  const letterScores = new Map();

  function startRound() {
    answer = pickAnswer(answers, answer);
    played = 0;
    letterScores.clear();
    drawKeyboard(letterScores);
    keyboard.disabled = false;
    rows.forEach((_, index) => drawRow(index));
    attempts.textContent = `0/${maxAttempts}`;
    activateRow(played);
    submit.disabled = false;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submit.disabled) return;
    const letters = guessCells.map(cell => cell.value.normalize('NFC').toLowerCase());
    const invalidCell = letters.findIndex(letter => !portugueseLetter.test(letter));
    if (invalidCell !== -1) {
      selectCell(invalidCell);
      focusCell();
      return;
    }
    const word = dictionary.get(normalizeWord(letters.join('')));
    if (!word) {
      focusCell();
      return;
    }

    const scores = scoreGuess(word, answer);
    updateLetterScores(letterScores, word, scores);
    drawKeyboard(letterScores);
    const won = scores.every(score => score === 'correct');
    drawRow(played, won ? answer : word, scores);
    played++;
    attempts.textContent = `${played}/${maxAttempts}`;

    if (won || played === maxAttempts) {
      keyboard.disabled = true;
      submit.disabled = true;
      newRound.focus();
      return;
    }
    activateRow(played);
    focusCell();
  });

  newRound.addEventListener('click', () => {
    startRound();
    focusCell();
  });
  if (tutorial.open) {
    await new Promise(resolve => tutorial.addEventListener('close', resolve, { once: true }));
  }
  newRound.disabled = false;
  startRound();
  if (!tutorial.open) focusCell();
} catch (error) {
  console.error(error);
}
