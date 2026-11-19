import { colors, generatePuzzle, maxColors, maxHeight } from './puzzle.mjs';
import { addExtraPeg, createGame, isCompletePeg, isSolved, moveRing, undoMove } from './rules.mjs';

const prompts = {
  start: 'Tap a peg to pick up its top ring.',
  empty: 'Choose a peg with a ring on it.',
};
const elements = Object.fromEntries(
  ['setup', 'colors', 'height', 'mystery', 'moves', 'board', 'status', 'win', 'result', 'next', 'undo', 'restart', 'extra', 'give-up']
    .map(id => [id, document.getElementById(id)]),
);

let puzzle;
let game;
let selected;
let phase = 'setup';

function say(message) {
  elements.status.textContent = message;
}

function render() {
  const focusedPeg = document.activeElement?.dataset.peg;
  const { cap, pegs, history, extra } = game;
  const finished = phase === 'finished';
  elements.setup.hidden = phase !== 'setup';
  elements['give-up'].hidden = phase !== 'playing';
  elements.moves.textContent = history.length;
  elements.undo.disabled = finished || history.length === 0;
  elements.restart.disabled = finished;
  elements.extra.disabled = extra || finished;
  elements.extra.lastChild.textContent = extra ? ' Peg added' : ' Extra peg';
  elements.win.hidden = !finished;
  elements.board.inert = finished;
  elements.board.classList.toggle('tall', cap > 5);
  elements.board.style.setProperty('--columns', pegs.length);
  elements.board.style.setProperty('--capacity', cap);

  const buttons = pegs.map((peg, index) => {
    const complete = isCompletePeg(peg, cap);
    const button = document.createElement('button');
    button.className = 'peg';
    button.type = 'button';
    button.dataset.peg = index;
    button.setAttribute('aria-pressed', selected === index);
    if (complete) button.setAttribute('aria-disabled', 'true');
    const names = peg.map(ring => complete || ring.revealed ? colors[ring.color] : 'mystery ring').reverse();
    button.setAttribute('aria-label', 'Peg ' + (index + 1) + ', ' +
      (names.length ? names.join(', ') + ' from top to bottom' : 'empty') +
      ', capacity ' + cap + (complete ? ', complete and locked' : ''));
    for (const part of ['post', 'foot']) {
      const shape = document.createElement('span');
      shape.className = part;
      shape.setAttribute('aria-hidden', 'true');
      button.append(shape);
    }
    peg.forEach((ring, slot) => {
      const shape = document.createElement('span');
      shape.className = 'ring';
      shape.setAttribute('aria-hidden', 'true');
      const visible = complete || ring.revealed;
      shape.dataset.color = visible ? ring.color : '?';
      if (!visible) shape.textContent = '?';
      shape.style.setProperty('--slot', slot);
      shape.classList.toggle('lifted', selected === index && slot === peg.length - 1);
      button.append(shape);
    });
    button.addEventListener('click', () => choose(index, button));
    return button;
  });
  elements.board.replaceChildren(...buttons);
  if (!finished && focusedPeg !== undefined) {
    buttons[focusedPeg]?.focus({ preventScroll: true });
  }
}

function start() {
  game = createGame(puzzle);
  selected = null;
  render();
  say(prompts.start);
}

function choose(index, button) {
  if (phase === 'finished') return;
  const target = game.pegs[index];
  if (isCompletePeg(target, game.cap)) {
    say('That peg is complete and locked.');
    return;
  }
  if (selected === index) {
    selected = null;
    render();
    say(prompts.start);
    return;
  }
  if (selected === null) {
    if (!target.length) {
      say(prompts.empty);
      return;
    }
    selected = index;
    render();
    say('Pick a peg for the ' + colors[target.at(-1).color] + ' ring.');
    return;
  }

  const result = moveRing(game, selected, index);
  if (result !== 'moved') {
    button.classList.remove('invalid');
    void button.offsetWidth;
    button.classList.add('invalid');
    say(result === 'full' ? 'That peg is full. Choose another peg.' : 'Choose an empty peg or one with the same color on top.');
    return;
  }

  if (isSolved(game)) {
    finish('Nicely sorted!', 'Puzzle complete in ' + game.history.length + ' moves.');
    return;
  }
  phase = 'playing';
  selected = null;
  render();
  say(prompts.start);
}

function finish(title, message) {
  phase = 'finished';
  selected = null;
  elements.result.textContent = title;
  render();
  say(message);
  elements.next.focus();
}

function newPuzzle() {
  const colorCount = Number(elements.colors.value);
  const cap = Number(elements.height.value);
  const layout = generatePuzzle(colorCount, cap, puzzle?.layout);
  puzzle = { cap, layout, mystery: elements.mystery.checked };
  start();
}

elements.setup.addEventListener('change', () => {
  if (phase === 'setup') newPuzzle();
});
elements.restart.addEventListener('click', () => {
  if (phase !== 'finished') start();
});
elements.undo.addEventListener('click', () => {
  if (phase === 'finished' || !undoMove(game)) return;
  selected = null;
  render();
  say('Move undone. ' + prompts.start);
});
elements.extra.addEventListener('click', () => {
  if (phase === 'finished' || !addExtraPeg(game)) return;
  render();
  say('An empty peg has been added.');
});
elements['give-up'].addEventListener('click', () => {
  if (phase === 'playing') finish('Game ended', 'Start a new game whenever you’re ready.');
});
elements.next.addEventListener('click', () => {
  if (phase !== 'finished') return;
  phase = 'setup';
  newPuzzle();
  elements.colors.focus();
});
for (const [select, max] of [[elements.colors, maxColors], [elements.height, maxHeight]]) {
  for (let value = 6; value <= max; value++) {
    const option = document.createElement('option');
    option.textContent = value;
    select.append(option);
  }
}
newPuzzle();
