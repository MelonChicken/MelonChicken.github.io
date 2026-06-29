// src/scripts/theme.js — ported from the demo's themeSwitch. Default = lab (dark).
// Usage: import in BaseLayout with <script> (client). The toggle button id = #themeSwitch.
function labelFor(t) { return t === 'lab' ? '> LAB_MODE' : '> STD_MODE'; }

export function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme') || 'lab'; // <-- default dark; set to 'normal' for light
  root.setAttribute('data-theme', saved);
  const btn = document.querySelector('#themeSwitch');
  if (btn) {
    btn.innerHTML = labelFor(saved);
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'lab' ? 'normal' : 'lab';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      btn.innerHTML = labelFor(next);
    });
  }
}
