export function normalizeWord(word) {
  return word.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export function scoreGuess(guess, answer) {
  const letters = normalizeWord(guess);
  const target = normalizeWord(answer);
  const remaining = [...target];
  const scores = [...letters].map((letter, index) => {
    if (letter !== target[index]) return 'absent';
    remaining[index] = null;
    return 'correct';
  });

  for (const [index, letter] of [...letters].entries()) {
    if (scores[index] === 'correct') continue;
    const match = remaining.indexOf(letter);
    if (match === -1) continue;
    remaining[match] = null;
    scores[index] = 'present';
  }
  return scores;
}

export function pickAnswer(answers, previous) {
  const lastIndex = answers.indexOf(previous);
  if (lastIndex === -1 || answers.length === 1) {
    return answers[Math.floor(Math.random() * answers.length)];
  }

  const index = Math.floor(Math.random() * (answers.length - 1));
  return answers[index < lastIndex ? index : index + 1];
}

export function updateLetterScores(known, guess, scores) {
  const priority = { absent: 1, present: 2, correct: 3 };
  for (const [index, letter] of [...normalizeWord(guess)].entries()) {
    const score = scores[index];
    if (priority[score] > (priority[known.get(letter)] ?? 0)) {
      known.set(letter, score);
    }
  }
}
