import { $, el } from './dom.js';
import { subscribe, dispatch } from './store.js';
import {
  balanceOf, budgetStatus, escapeHTML, formatRupiah, inMonth, monthKey, spentByCategory, summarize, toISODate,
} from './utils.js';

// Tampilan per tingkat pemakaian. Nama class ditulis utuh agar terbaca Tailwind.
const LEVELS = {
  none: { fill: 'bg-teal', box: '', title: '' },
  ok: { fill: 'bg-income', box: 'border-l-4 border-income bg-income/10', title: 'Aman.' },
  warn: { fill: 'bg-warn', box: 'border-l-4 border-warn bg-warn/15', title: 'Hampir habis!' },
  over: { fill: 'bg-expense', box: 'border-l-4 border-expense bg-expense/10', title: 'Anggaran terlampaui!' },
};

// Transaksi pada bulan berjalan
const currentMonthTx = (transactions) => inMonth(transactions, monthKey(toISODate(new Date())));

// Ringkasan di hero (halaman beranda)
export function initHero() {
  subscribe(({ transactions }) => {
    const { income, expense } = summarize(currentMonthTx(transactions));
    const balance = balanceOf(transactions);

    $('#sum-month').textContent = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    $('#sum-balance').textContent = formatRupiah(balance);
    $('#sum-balance').classList.toggle('text-expense', balance < 0);
    $('#sum-income').textContent = formatRupiah(income);
    $('#sum-expense').textContent = formatRupiah(expense);
  });
}

// Anggaran bulanan dan rincian per kategori (halaman anggaran)
// Total jatah = anggaran dasar + pemasukan bulan ini
export function initBudget() {
  const track = $('#budget-track');
  const fill = $('#budget-fill');
  const alertBox = $('#budget-alert');
  const budgetInput = $('#budget-input');

  // Kalimat peringatan sesuai tingkat pemakaian
  const detail = (level, limit, expense, pct) => ({
    none: '',
    ok: `Pengeluaranmu masih terkendali. Sisa ${formatRupiah(limit - expense)}.`,
    warn: `Pemakaian sudah ${pct}%. Sisa ${formatRupiah(limit - expense)}.`,
    over: expense > limit
      ? `Melebihi batas sebesar ${formatRupiah(expense - limit)}.`
      : 'Jatah bulan ini sudah terpakai seluruhnya.',
  }[level]);

  const render = ({ transactions, budget }) => {
    const monthTx = currentMonthTx(transactions);
    const { income, expense } = summarize(monthTx);
    const limit = budget + income; // pemasukan menambah jatah anggaran
    const { pct, level } = budgetStatus(expense, limit);
    const view = LEVELS[level];

    // Rincian jatah
    $('#budget-base').textContent = formatRupiah(budget);
    $('#budget-income').textContent = `+ ${formatRupiah(income)}`;
    $('#budget-limit').textContent = formatRupiah(limit);

    // Bilah: lebar dan warna mengikuti level
    fill.style.width = `${Math.min(pct, 100)}%`;
    fill.className = `h-full rounded-full transition-all duration-300 ${view.fill}`;
    track.setAttribute('aria-valuenow', String(Math.min(pct, 100)));

    $('#budget-text').textContent = limit > 0
      ? `${formatRupiah(expense)} dari ${formatRupiah(limit)} (${pct}%)`
      : 'Anggaran belum diatur.';

    // Kotak peringatan berwarna (hijau, kuning, merah)
    alertBox.hidden = level === 'none';
    alertBox.className = `mt-2 rounded-lg px-4 py-3 text-sm ${view.box}`;
    alertBox.replaceChildren(
      el('strong', { text: view.title }),
      el('span', { text: ` ${detail(level, limit, expense, pct)}` }),
    );

    if (document.activeElement !== budgetInput) budgetInput.value = budget;

    // Rincian per kategori: urut dari yang terbesar
    const rows = Object.entries(spentByCategory(monthTx)).sort(([, a], [, b]) => b - a);
    $('#cat-list').innerHTML = rows.map(([name, total]) => `
      <li>
        <p class="flex justify-between gap-3"><span>${escapeHTML(name)}</span><strong>${formatRupiah(total)}</strong></p>
        <progress class="mt-1 h-2 w-full accent-teal" max="${expense}" value="${total}" aria-label="Porsi ${escapeHTML(name)}"></progress>
      </li>`).join('');
    $('#cat-empty').hidden = rows.length > 0;
  };

  // EVENT submit: simpan anggaran dasar baru
  $('#budget-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const value = Number(budgetInput.value);
    const error = $('#budget-error');
    if (budgetInput.value === '' || !Number.isInteger(value) || value < 0) {
      error.textContent = 'Anggaran harus bilangan bulat, minimal 0.';
      budgetInput.setAttribute('aria-invalid', 'true');
      return;
    }
    error.textContent = '';
    budgetInput.removeAttribute('aria-invalid');
    dispatch({ budget: value });
  });

  subscribe(render);
}