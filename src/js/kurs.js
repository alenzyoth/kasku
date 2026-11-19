import { $ } from './dom.js';
import { getUsdRate } from './api.js';
import { subscribe } from './store.js';
import { balanceOf, formatRupiah, log } from './utils.js';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// Kurs dari API publik: loading, sukses, dan error state
export function initRate() {
  const loading = $('#rate-loading');
  const errorBox = $('#rate-error');
  const result = $('#rate-result');
  const refresh = $('#rate-refresh');
  let rate = null;
  let updated = '';
  let balance = 0;

  const renderResult = () => {
    if (rate === null) return;
    $('#rate-value').textContent = `1 USD = ${formatRupiah(rate)}`;
    $('#rate-balance').textContent = usd.format(balance / rate);
    $('#rate-updated').textContent = `Diperbarui: ${new Date(updated).toLocaleString('id-ID')}`;
    result.hidden = false;
  };

  // async/await + try/catch/finally
  const load = async () => {
    loading.hidden = false;
    errorBox.hidden = true;
    refresh.setAttribute('disabled', '');
    try {
      ({ rate, updated } = await getUsdRate());
      renderResult();
    } catch (error) {
      log('error', error);
      $('#rate-error-msg').textContent = error instanceof TypeError
        ? 'Tidak bisa terhubung ke server kurs. Periksa koneksi internetmu lalu coba lagi.'
        : error.message;
      errorBox.hidden = false;
    } finally {
      loading.hidden = true;
      refresh.removeAttribute('disabled');
    }
  };

  // Saldo ikut diperbarui otomatis setiap transaksi berubah
  subscribe(({ transactions }) => { balance = balanceOf(transactions); renderResult(); });
  refresh.addEventListener('click', load);
  load();
}
