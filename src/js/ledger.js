import { $, el } from './dom.js';
import { CATEGORIES, ALL_CATEGORIES } from './data.js';
import { getState, subscribe, dispatch } from './store.js';
import { addTx, removeTx, sortTx, filterTx, validateTx, formatRupiah, formatDate, toISODate } from './utils.js';

// Form tambah transaksi + daftar riwayat + filter
export function initLedger() {
  const form = $('#tx-form');
  const list = $('#tx-list');
  const empty = $('#tx-empty');
  const count = $('#tx-count');
  const search = $('#tx-search');
  const filterType = $('#tx-filter-type');
  const filterCat = $('#tx-filter-cat');
  let filters = { type: 'semua', category: 'semua', keyword: '' };

  // Opsi kategori mengikuti jenis (pemasukan/pengeluaran) yang dipilih
  const fillCategories = (type) =>
    $('#tx-category').replaceChildren(...CATEGORIES[type].map((c) => el('option', { text: c, attrs: { value: c } })));

  const resetForm = () => {
    form.reset();
    fillCategories('expense');
    $('#tx-date').value = toISODate(new Date());
  };

  filterCat.append(...ALL_CATEGORIES.map((c) => el('option', { text: c, attrs: { value: c } })));
  resetForm();

  // Membangun <li> dengan createElement (teks pengguna lewat textContent)
  const buildItem = ({ id, desc, type, category, amount, date }) => {
    const isIncome = type === 'income';
    return el('li', { className: 'flex items-center gap-3 py-3', attrs: { 'data-id': id } },
      el('span', { className: 'min-w-0 flex-1' },
        el('strong', { className: 'block truncate', text: desc }),
        el('span', { className: 'text-sm', text: `${formatDate(date)}, ${category}` })),
      el('span', {
        className: `font-bold ${isIncome ? 'text-income' : 'text-expense'}`,
        text: `${isIncome ? '+' : '-'}${formatRupiah(amount)}`,
      }),
      el('button', {
        className: 'rounded-lg px-2 py-1 text-sm hover:bg-expense/10 hover:text-expense',
        text: 'Hapus',
        attrs: { type: 'button', 'aria-label': `Hapus transaksi: ${desc}` },
      }));
  };

  const render = ({ transactions }) => {
    const visible = sortTx(filterTx(transactions, filters));
    list.replaceChildren(...visible.map(buildItem));
    count.textContent = `${visible.length} dari ${transactions.length} transaksi`;
    empty.textContent = transactions.length ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi. Catat yang pertama lewat formulir.';
    empty.hidden = visible.length > 0;
  };

  const showErrors = (errors) => {
    [['desc', '#tx-desc', '#err-desc'], ['amount', '#tx-amount', '#err-amount'], ['date', '#tx-date', '#err-date']]
      .forEach(([key, inputSel, errSel]) => {
        $(errSel).textContent = errors[key] ?? '';
        if (errors[key]) $(inputSel).setAttribute('aria-invalid', 'true');
        else $(inputSel).removeAttribute('aria-invalid');
      });
  };

  // EVENT change: ganti jenis -> ganti opsi kategori
  form.addEventListener('change', (e) => {
    if (e.target.name === 'type') fillCategories(e.target.value);
  });

  // EVENT submit: validasi dulu, baru simpan
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const errors = validateTx(data);
    showErrors(errors);
    const firstError = ['desc', 'amount', 'date'].find((key) => errors[key]);
    if (firstError) {
      $(`#tx-${firstError}`).focus();
      return;
    }
    dispatch({
      transactions: addTx(getState().transactions, {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        desc: data.desc.trim(),
        type: data.type,
        category: data.category,
        amount: Number(data.amount),
        date: data.date,
      }),
    });
    resetForm();
    $('#tx-desc').focus();
  });

  // Event delegation: satu pendengar di <ul> melayani semua baris, termasuk yang baru dibuat
  list.addEventListener('click', (e) => {
    if (!e.target.matches('button')) return;
    dispatch({ transactions: removeTx(getState().transactions, e.target.closest('li').dataset.id) });
  });

  // EVENT input / change pada filter
  search.addEventListener('input', () => { filters = { ...filters, keyword: search.value }; render(getState()); });
  filterType.addEventListener('change', () => { filters = { ...filters, type: filterType.value }; render(getState()); });
  filterCat.addEventListener('change', () => { filters = { ...filters, category: filterCat.value }; render(getState()); });

  $('#btn-clear').addEventListener('click', () => {
    if (window.confirm('Hapus semua transaksi? Tindakan ini tidak bisa dibatalkan.')) dispatch({ transactions: [] });
  });

  subscribe(render);
}
