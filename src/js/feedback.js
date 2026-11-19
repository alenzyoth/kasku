import { $ } from './dom.js';
import { sendFeedback } from './api.js';
import { log } from './utils.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME = /^[\p{L}\s.'-]+$/u; // huruf (termasuk beraksen), spasi, titik, apostrof, tanda hubung
const FIELDS = ['nama', 'email', 'pesan'];
const MAX_PESAN = 500;

// Fungsi murni: mengembalikan objek berisi pesan error per kolom ({} berarti semua valid)
export const validateFeedback = ({ nama = '', email = '', pesan = '' }) => {
  const errors = {};

  const n = nama.trim();
  if (!n) errors.nama = 'Nama wajib diisi.';
  else if (n.length < 2) errors.nama = 'Nama minimal 2 karakter.';
  else if (!NAME.test(n)) errors.nama = 'Nama hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung.';

  const e = email.trim();
  if (!e) errors.email = 'Email wajib diisi.';
  else if (!EMAIL.test(e)) errors.email = 'Format email belum benar. Contoh: nama@email.com';

  const p = pesan.trim();
  if (!p) errors.pesan = 'Masukan wajib diisi.';
  else if (p.length < 10) errors.pesan = 'Masukan minimal 10 karakter.';
  else if (p.length > MAX_PESAN) errors.pesan = `Masukan maksimal ${MAX_PESAN} karakter.`;

  return errors;
};

// Form masukan: validasi per kolom lalu fetch POST
export function initFeedback() {
  const form = $('#feedback-form');
  const status = $('#fb-status');
  const submit = $('button[type="submit"]', form);
  let timer;

  const say = (message, { isError = false } = {}) => {
    clearTimeout(timer); // pesan baru membatalkan penghitung waktu pesan lama
    status.textContent = message;
    status.classList.toggle('text-expense', isError);
    status.classList.toggle('text-income', !isError);
    if (message && !isError) timer = setTimeout(() => { status.textContent = ''; }, 6000); // hanya pesan sukses yang hilang sendiri
  };

  // Tampilkan atau hapus error pada satu kolom (pesan + border merah lewat aria-invalid)
  const showError = (key, message) => {
    $(`#err-${key}`).textContent = message ?? '';
    if (message) $(`#fb-${key}`).setAttribute('aria-invalid', 'true');
    else $(`#fb-${key}`).removeAttribute('aria-invalid');
  };

  const values = () => Object.fromEntries(new FormData(form));
  const checkField = (key) => showError(key, validateFeedback(values())[key]);
  const updateCount = () => { $('#fb-count').textContent = `${$('#fb-pesan').value.length}/${MAX_PESAN}`; };

  // Validasi saat pindah kolom (focusout menggelembung, blur tidak)
  form.addEventListener('focusout', (e) => {
    if (FIELDS.includes(e.target.name)) checkField(e.target.name);
  });

  // Error langsung hilang begitu isian diperbaiki
  form.addEventListener('input', (e) => {
    const key = e.target.name;
    if (key === 'pesan') updateCount();
    if (FIELDS.includes(key) && e.target.hasAttribute('aria-invalid')) checkField(key);
    if (status.textContent) say('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = values();
    const errors = validateFeedback(data);
    FIELDS.forEach((key) => showError(key, errors[key]));

    const firstError = FIELDS.find((key) => errors[key]);
    if (firstError) {
      say('Periksa kembali isian yang bertanda merah.', { isError: true });
      $(`#fb-${firstError}`).focus();
      return;
    }

    submit.setAttribute('disabled', '');
    say('Mengirim...');
    try {
      const { id } = await sendFeedback({ nama: data.nama.trim(), email: data.email.trim(), pesan: data.pesan.trim() }); // fetch POST
      say(`Terima kasih, ${data.nama.trim()}. Masukanmu tercatat (ID ${id}).`);
      form.reset();
      FIELDS.forEach((key) => showError(key));
      updateCount();
    } catch (error) {
      log('error', error);
      say('Pengiriman gagal. Coba lagi nanti.', { isError: true });
    } finally {
      submit.removeAttribute('disabled');
    }
  });

  updateCount();
}