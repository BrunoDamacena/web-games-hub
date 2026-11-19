import { colors, generatePuzzle, maxColors, maxHeight } from './puzzle.mjs';
import { addExtraPeg, createGame, isCompletePeg, isSolved, moveRing, undoMove } from './rules.mjs';

const prompts = {
  start: 'Toque em um pino para pegar o anel do topo.',
  empty: 'Escolha um pino com pelo menos um anel.',
};
const elements = Object.fromEntries(
  ['setup', 'colors', 'height', 'mystery', 'moves', 'move-label', 'board', 'status', 'win', 'result', 'next', 'undo', 'restart', 'extra', 'give-up']
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
  elements['move-label'].textContent = history.length === 1 ? 'JOGADA' : 'JOGADAS';
  elements.undo.disabled = finished || history.length === 0;
  elements.restart.disabled = finished;
  elements.extra.disabled = extra || finished;
  elements.extra.lastChild.textContent = extra ? ' Pino adicionado' : ' Pino extra';
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
    const names = peg.map(ring => complete || ring.revealed ? colors[ring.color] : 'anel misterioso').reverse();
    button.setAttribute('aria-label', 'Pino ' + (index + 1) + ', ' +
      (names.length ? names.join(', ') + ' (de cima para baixo)' : 'vazio') +
      ', capacidade para ' + cap + ' anéis' + (complete ? ', completo e bloqueado' : ''));
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
    say('Esse pino está completo e bloqueado.');
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
    say('Escolha um pino para o anel ' + colors[target.at(-1).color] + '.');
    return;
  }

  const result = moveRing(game, selected, index);
  if (result !== 'moved') {
    button.classList.remove('invalid');
    void button.offsetWidth;
    button.classList.add('invalid');
    say(result === 'full' ? 'Esse pino está cheio. Escolha outro.' : 'Escolha um pino vazio ou com um anel da mesma cor no topo.');
    return;
  }

  if (isSolved(game)) {
    const moves = game.history.length;
    finish('Parabéns!', `Você organizou os anéis em ${moves} ${moves === 1 ? 'jogada' : 'jogadas'}.`);
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
  say('Jogada desfeita. ' + prompts.start);
});
elements.extra.addEventListener('click', () => {
  if (phase === 'finished' || !addExtraPeg(game)) return;
  render();
  say('Um pino vazio foi adicionado.');
});
elements['give-up'].addEventListener('click', () => {
  if (phase === 'playing') finish('Partida encerrada', 'Comece uma nova partida quando quiser.');
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
