// Original AccessReplay fixture. MIT license, same as the repository.
// No network access. Synthetic catalog only.

const root = document.documentElement;
const build = root.dataset.build || '';
const dialog = document.getElementById('cart-dialog');
const form = document.getElementById('search-form');
const query = document.getElementById('q');
const status = document.getElementById('status');
const results = document.getElementById('results');
const cart = document.getElementById('cart');
const place = document.getElementById('place');
let opener = null;

function openCart(event) {
  opener = event.currentTarget;
  status.textContent = 'Pen added.';
  root.dataset.appState = 'cart-open';
  dialog.showModal();
  document.getElementById('close-cart').focus();
}

function closeCart() {
  if (!dialog.open) return;
  dialog.close();
  // Chrome restores the dialog invoker during close(). Focusing body in that
  // same turn does not stick. Blur after close leaves focus on the document.
  if (build === 'focus-mutant') {
    const active = document.activeElement;
    if (active && typeof active.blur === 'function') active.blur();
  } else if (opener) {
    opener.focus();
  }
  root.dataset.appState = 'browsing';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  results.replaceChildren();
  const item = document.createElement('li');
  const add = document.createElement('button');
  add.id = 'add-pen';
  add.type = 'button';
  add.textContent = 'Add pen';
  add.addEventListener('click', openCart);
  item.append(add);
  results.append(item);
  status.textContent = `1 result for ${query.value}.`;
  root.dataset.appState = 'results';
});

cart.addEventListener('click', openCart);
place.addEventListener('click', () => {
  status.textContent = 'Demo order recorded.';
  root.dataset.appState = 'submitted';
});
document.getElementById('close-cart').addEventListener('click', closeCart);
dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCart();
});

if (build === 'tab-loop') {
  const offerA = document.createElement('button');
  offerA.id = 'trap-a';
  offerA.type = 'button';
  offerA.textContent = 'Offer A';
  const offerB = document.createElement('button');
  offerB.id = 'trap-b';
  offerB.type = 'button';
  offerB.textContent = 'Offer B';
  const cycle = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    (document.activeElement === offerA ? offerB : offerA).focus();
  };
  offerA.addEventListener('keydown', cycle);
  offerB.addEventListener('keydown', cycle);
  place.parentElement.before(offerA, offerB);
}

if (build === 'timeout') {
  root.dataset.appState = 'booting';
  root.dataset.appReady = 'false';
} else {
  root.dataset.appState = 'browsing';
  root.dataset.appReady = 'true';
}
