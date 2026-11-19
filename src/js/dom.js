// Helper DOM: memilih dan membuat elemen.
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// createElement + setAttribute + appendChild. Teks lewat textContent (aman dari XSS).
export function el(tag, { className = '', text = '', attrs = {} } = {}, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
  children.forEach((child) => node.appendChild(child));
  return node;
}
