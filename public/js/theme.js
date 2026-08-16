export function initTheme(button) {
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    button.textContent = theme === 'dark' ? '☀️' : '🌙';
    button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    localStorage.setItem('vulnviz-theme', theme);
  }
  applyTheme(localStorage.getItem('vulnviz-theme') || 'dark');
  button.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}
