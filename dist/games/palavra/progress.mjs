import { maxAttempts } from './rules.mjs';

const historyKey = 'palavra-round-history';
let sessionHistory = [];

function readHistory() {
  try {
    const entries = JSON.parse(localStorage.getItem(historyKey));
    if (!Array.isArray(entries)) return [];
    return entries.filter(entry =>
      Number.isInteger(entry?.guesses) && entry.guesses >= 1 && entry.guesses <= maxAttempts &&
      (entry.won === true || (entry.won === false && entry.guesses === maxAttempts))
    );
  } catch {
    return [];
  }
}

export function recordRound(guesses, won) {
  const history = [...readHistory(), ...sessionHistory, { guesses, won }];
  try {
    localStorage.setItem(historyKey, JSON.stringify(history));
    sessionHistory = [];
  } catch {
    sessionHistory.push({ guesses, won });
  }
}

function renderProgress() {
  const history = [...readHistory(), ...sessionHistory];
  // The last row counts losses, separately from sixth-guess wins.
  const counts = Array(maxAttempts + 1).fill(0);
  let wins = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const { guesses, won } of history) {
    if (won) {
      counts[guesses - 1]++;
      wins++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      counts[maxAttempts]++;
      streak = 0;
    }
  }

  document.querySelector('#games-played').textContent = history.length;
  document.querySelector('#win-rate').textContent = history.length
    ? `${Math.round(100 * wins / history.length)}%`
    : '0%';
  document.querySelector('#current-streak').textContent = streak;
  document.querySelector('#best-streak').textContent = bestStreak;

  const largest = Math.max(1, ...counts);
  const rows = counts.map((count, index) => {
    const row = document.createElement('li');
    const bar = document.createElement('span');
    bar.className = 'word-chart-bar';
    bar.style.setProperty('--bar-width', count / largest);
    bar.textContent = count;
    if (count === 0) bar.classList.add('word-chart-empty');

    const label = document.createElement('span');
    if (index === maxAttempts) {
      label.textContent = '💀';
      label.setAttribute('role', 'img');
      label.setAttribute('aria-label', 'Derrotas');
    } else {
      label.textContent = index + 1;
    }
    row.append(label, bar);
    return row;
  });
  document.querySelector('#guess-distribution').replaceChildren(...rows);
}

const progress = document.querySelector('#word-progress');
document.querySelector('#open-progress').addEventListener('click', () => {
  renderProgress();
  progress.showModal();
});
