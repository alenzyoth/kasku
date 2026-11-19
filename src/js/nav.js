import { $, $$ } from './dom.js';

// Navbar toggle (Codelab Modul 2): classList + setAttribute + event click/keydown
export function initNav() {
  const button = $('#menu-btn');
  const menu = $('#menu');
  const setOpen = (open) => {
    menu.classList.toggle('hidden', !open);
    button.setAttribute('aria-expanded', String(open));
  };
  button.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  $$('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
}
