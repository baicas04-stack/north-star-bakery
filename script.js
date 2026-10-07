'use strict';
// Product objects and favorite IDs keep display data separate from saved choices.
const products = [
  { id: 'loaf', name: 'Signature Loaf', price: '$8' },
  { id: 'pastries', name: 'Breakfast pastries', price: '$3–$6 each' },
  { id: 'cake', name: 'Celebration cake', price: 'from $30' }
];
const storageKey = 'northStarBakeryFavorites';
let favorites = loadFavorites();
let storageAvailable = true;
function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(id => products.some(p => p.id === id)))] : [];
  } catch { return []; }
}
function saveFavorites() {
  try { localStorage.setItem(storageKey, JSON.stringify(favorites)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites, id];
  saveFavorites();
  renderFavorites();
}
function renderFavorites() {
  const options = document.querySelector('#favorite-options');
  if (!options) return;
  options.replaceChildren();
  products.forEach(product => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.product = product.id;
    button.setAttribute('aria-pressed', String(favorites.includes(product.id)));
    button.textContent = `${favorites.includes(product.id) ? 'Remove' : 'Save'} ${product.name}`;
    button.addEventListener('click', () => {
      toggleFavorite(product.id);
      document.querySelector(`[data-product="${product.id}"]`).focus();
    });
    options.append(button);
  });
  const list = document.querySelector('#favorite-list');
  list.replaceChildren();
  products.filter(p => favorites.includes(p.id)).forEach(product => {
    const item = document.createElement('li');
    item.textContent = `${product.name} — ${product.price}`;
    list.append(item);
  });
  document.querySelector('#favorite-status').textContent =
    `${favorites.length} favorite${favorites.length === 1 ? '' : 's'} selected. ` +
    (storageAvailable ? (favorites.length ? 'Saved in this browser.' : 'Choose an item above.') : 'Browser storage is unavailable; choices last for this visit.');
  document.querySelector('#clear-favorites').disabled = favorites.length === 0;
}
const validationRules = {
  'customer-name': value => !value ? 'Enter your name.' : value.length < 2 || value.length > 80 ? 'Use 2–80 characters for your name.' : '',
  email: value => !value ? 'Enter your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 120 ? 'Enter a valid email, such as name@example.com.' : '',
  'request-type': value => !['preorder', 'question'].includes(value) ? 'Choose a request type.' : '',
  details: value => value.length < 10 || value.length > 1000 ? 'Use 10–1,000 characters for your request.' : '',
  allergies: value => value.length > 500 ? 'Keep allergy notes under 500 characters.' : '',
  'pickup-date': value => {
    if (!value) return document.querySelector('#request-type').value === 'preorder' ? 'Choose a pickup date for your preorder.' : '';
    const date = new Date(`${value}T12:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return !Number.isFinite(date.getTime()) || date < today ? 'Choose today or a future pickup date.' : date.getDay() === 1 ? 'Choose a day other than Monday; the bakery is closed.' : '';
  }
};
function validateField(id) {
  const field = document.getElementById(id);
  const message = validationRules[id](field.value.trim());
  document.getElementById(`${id}-error`).textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}
function initializeForm() {
  const form = document.querySelector('#request-form');
  if (!form) return;
  // Native required attributes remain available when JavaScript is disabled.
  form.noValidate = true;
  Object.keys(validationRules).forEach(id => {
    const field = document.getElementById(id);
    const error = document.createElement('span');
    error.id = `${id}-error`; error.className = 'field-error'; error.setAttribute('aria-live', 'polite');
    field.after(error);
    field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
    field.addEventListener('input', () => {
      document.querySelector('#form-status').textContent = '';
      if (field.getAttribute('aria-invalid') === 'true') validateField(id);
    });
    field.addEventListener('blur', () => validateField(id));
  });
  document.querySelector('#request-type').addEventListener('change', () => validateField('pickup-date'));
  const names = products.filter(p => favorites.includes(p.id)).map(p => p.name);
  document.querySelector('#saved-favorites').textContent = names.length ? `Your saved favorites: ${names.join(', ')}. Include quantities in your request.` : 'Save favorites on the Products page to remember items for your request.';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = Object.keys(validationRules).filter(id => !validateField(id));
    const status = document.querySelector('#form-status');
    if (invalid.length) {
      status.textContent = 'Please correct the marked fields. Your entries have been kept.';
      document.getElementById(invalid[0]).focus();
    } else status.textContent = 'Your demo request passes validation. No request has been sent or reserved.';
  });
}
renderFavorites();
const clearButton = document.querySelector('#clear-favorites');
if (clearButton) clearButton.addEventListener('click', () => { favorites = []; saveFavorites(); renderFavorites(); });
initializeForm();
