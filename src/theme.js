(() => {
  const storageKey = 'web-games-hub-theme';
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  let control;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // The theme control still works when storage is unavailable.
  }

  function applyTheme() {
    const theme = preference === 'system'
      ? (systemTheme.matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = theme;
    control?.setAttribute('aria-checked', String(theme === 'dark'));
  }

  applyTheme();
  systemTheme.addEventListener('change', applyTheme);

  document.addEventListener('DOMContentLoaded', () => {
    control = document.querySelector('#site-theme');
    applyTheme();
    control.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme();

      try {
        localStorage.setItem(storageKey, preference);
      } catch {
        // The current page keeps the chosen theme.
      }
    });
    control.hidden = false;
  });
})();
