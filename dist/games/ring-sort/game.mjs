import { colors, generatePuzzle } from './puzzle.mjs';
import { addExtraPeg, createGame, isSolved, moveRing, undoMove } from './rules.mjs';

const prompts = {
  start: 'Tap a peg to pick up its top ring.',
  empty: 'Choose a peg with a ring on it.',
};
const elements = Object.fromEntries(
  ['setup', 'colors', 'height', 'mystery', 'moves', 'board', 'status', 'win', 'next', 'undo', 'restart', 'extra']
    .map(id => [id, document.getElementById(id)]),
);

let puzzle;
let game;
let selected;

function say(message) {
  elements.status.textContent = message;
}

function render() {
  const focusedPeg = document.activeElement?.dataset.peg;
  const { cap, pegs, history, extra } = game;
  const won = isSolved(game);
  elements.moves.textContent = history.length;
  elements.undo.disabled = history.length === 0;
  elements.extra.disabled = extra || won;
  elements.extra.lastChild.textContent = extra ? ' Peg added' : ' Extra peg';
  elements.win.hidden = !won;
  elements.board.inert = won;
  elements.board.dataset.size = pegs.length;
  elements.board.style.setProperty('--columns', pegs.length);
  elements.board.style.setProperty('--capacity', cap);

  const buttons = pegs.map((peg, index) => {
    const button = document.createElement('button');
    button.className = 'peg';
    button.type = 'button';
    button.dataset.peg = index;
    button.setAttribute('aria-pressed', selected === index);
    const names = peg.map(ring => ring.revealed ? colors[ring.color] : 'mystery ring').reverse();
    button.setAttribute('aria-label', 'Peg ' + (index + 1) + ', ' +
      (names.length ? names.join(', ') + ' from top to bottom' : 'empty') + ', capacity ' + cap);
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
      shape.dataset.color = ring.revealed ? ring.color : '?';
      if (!ring.revealed) shape.textContent = '?';
      shape.style.setProperty('--slot', slot);
      shape.classList.toggle('lifted', selected === index && slot === peg.length - 1);
      button.append(shape);
    });
    button.addEventListener('click', () => choose(index, button));
    return button;
  });
  elements.board.replaceChildren(...buttons);
  if (focusedPeg !== undefined) {
    (won ? elements.next : buttons[focusedPeg])?.focus({ preventScroll: true });
  }
}

function start() {
  game = createGame(puzzle);
  selected = null;
  render();
  say(prompts.start);
}

function choose(index, button) {
  const target = game.pegs[index];
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

  selected = null;
  render();
  say(isSolved(game) ? 'Puzzle complete in ' + game.history.length + ' moves.' : prompts.start);
}

function newPuzzle() {
  const colorCount = Number(elements.colors.value);
  const cap = Number(elements.height.value);
  const layout = generatePuzzle(colorCount, cap, puzzle?.layout);
  puzzle = { cap, layout, mystery: elements.mystery.checked };
  start();
}

elements.setup.addEventListener('submit', event => {
  event.preventDefault();
  newPuzzle();
});
elements.restart.addEventListener('click', start);
elements.undo.addEventListener('click', () => {
  if (!undoMove(game)) return;
  selected = null;
  render();
  say('Move undone. ' + prompts.start);
});
elements.extra.addEventListener('click', () => {
  if (!addExtraPeg(game)) return;
  render();
  say('An empty peg has been added.');
});
elements.next.addEventListener('click', () => {
  newPuzzle();
  elements.board.firstElementChild.focus({ preventScroll: true });
});
newPuzzle();
