import { $ } from './dom.js';
import { getSample, wait } from './api.js';
import { getState, dispatch } from './store.js';
import { addDays, log, mergeUnique, toISODate } from './utils.js';

// Tombol "Muat data contoh": fetch GET ke file JSON lokal
export function initSample() {
  const button = $('#btn-sample');
  const status = $('#data-status');

  button.addEventListener('click', async () => {
    button.setAttribute('disabled', '');
    status.textContent = 'Memuat data contoh...';
    try {
      // Promise.all: tunggu data DAN jeda 400 ms, supaya keadaan "memuat" tidak berkedip
      const [rows] = await Promise.all([getSample(), wait(400)]);
      const incoming = rows.map(({ desc, type, category, amount, daysAgo }, i) => ({
        id: `contoh-${i + 1}`, desc, type, category, amount, date: toISODate(addDays(-daysAgo)),
      }));
      const before = getState().transactions.length;
      const merged = mergeUnique(getState().transactions, incoming);
      dispatch({ transactions: merged });
      const added = merged.length - before;
      status.textContent = added ? `${added} transaksi contoh ditambahkan.` : 'Data contoh sudah ada.';
    } catch (error) {
      log('error', error);
      status.textContent = error instanceof TypeError
        ? 'Data contoh tidak bisa dimuat. Buka halaman lewat Live Server, bukan klik dua kali file HTML.'
        : error.message;
    } finally {
      button.removeAttribute('disabled');
    }
  });
}
