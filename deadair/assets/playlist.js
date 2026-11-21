'use strict';

const form = document.querySelector('#filters');
const search = document.querySelector('#find-track');
const rank = document.querySelector('#rank');
const count = document.querySelector('#matches');
const normalise = (value) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const rows = Array.from(document.querySelectorAll('tbody tr'), (row) => ({
  row,
  rank: row.dataset.rank,
  terms: normalise(Array.from(row.cells, (cell) => cell.textContent).join(' ')),
}));

function filterTracks() {
  const terms = normalise(search.value).split(' ').filter(Boolean);
  let matches = 0;
  for (const item of rows) {
    const visible =
      (!rank.value || rank.value === item.rank) && terms.every((term) => item.terms.includes(term));
    item.row.hidden = !visible;
    if (visible) matches++;
  }
  count.textContent =
    matches === 0
      ? 'No tracks match. Try another search or clear the filters.'
      : matches === rows.length
        ? '197 tracks'
        : matches + (matches === 1 ? ' track' : ' tracks') + ' of 197';
}

form.hidden = false;
form.addEventListener('input', filterTracks);
form.addEventListener('change', filterTracks);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  filterTracks();
});
form.addEventListener('reset', () => requestAnimationFrame(filterTracks));
