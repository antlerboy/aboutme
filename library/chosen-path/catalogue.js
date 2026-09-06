(() => {
  const query = document.querySelector('#catalogue-query');
  const year = document.querySelector('#catalogue-year');
  const sort = document.querySelector('#catalogue-sort');
  const topics = document.querySelector('#catalogue-topics');
  const status = document.querySelector('#catalogue-status');
  const results = document.querySelector('#catalogue-results');
  const more = document.querySelector('#catalogue-more');
  const clear = document.querySelector('#catalogue-clear');
  const source = document.querySelector('#catalogue-source');
  const pageSize = 24;
  let catalogue;
  let activeTopic = 'all';
  let visible = pageSize;
  let current = [];

  const escape = value => String(value ?? '').replaceAll('—', ', ').replaceAll('–', '-').replaceAll(' , ', ', ')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  function tokenise(value) {
    return [...new Set((value.toLowerCase().match(/[a-z0-9][a-z0-9’'-]{1,}/g) || [])
      .map(token => token.replaceAll('’', "'").replace(/^'+|'+$/g, ''))
      .filter(token => token.length > 1))];
  }

  function scoreDocuments(terms) {
    if (!terms.length) return catalogue.documents.map((document, position) => ({ document, position, score: 0 }));
    const scores = new Map();
    for (const term of terms) {
      for (const position of catalogue.index[term] || []) scores.set(position, (scores.get(position) || 0) + 1);
    }
    return [...scores].map(([position, score]) => {
      const document = catalogue.documents[position];
      const title = document.title.toLowerCase();
      const excerpt = document.excerpt.toLowerCase();
      for (const term of terms) {
        if (title.includes(term)) score += 4;
        else if (excerpt.includes(term)) score += 1;
      }
      return { document, position, score };
    });
  }

  function apply() {
    if (!catalogue) return;
    const terms = tokenise(query.value.trim());
    current = scoreDocuments(terms)
      .filter(({ document }) => year.value === 'all' || document.year === year.value)
      .filter(({ document }) => activeTopic === 'all' || document.topics.includes(activeTopic))
      .filter(({ document }) => !source || source.value === 'all' || document.source === source.value);

    const direction = sort.value;
    current.sort((a, b) => {
      if (direction === 'oldest') return a.document.date.localeCompare(b.document.date);
      if (direction === 'newest' || !terms.length) return b.document.date.localeCompare(a.document.date);
      return b.score - a.score || b.document.date.localeCompare(a.document.date);
    });
    visible = pageSize;
    render();
  }

  function render() {
    const shown = current.slice(0, visible);
    status.textContent = `${current.length.toLocaleString()} item${current.length === 1 ? '' : 's'} found · catalogue updated ${new Date(catalogue.generatedAt).toLocaleDateString('en-GB')}`;
    results.innerHTML = shown.map(({ document }) => `<article class="catalogue-result"><div><p class="eyebrow">${escape(document.date)}</p><h3><a href="${escape(document.url)}">${escape(document.title)}</a></h3><p>${escape(document.excerpt || 'No excerpt available.')}</p><div class="tags">${document.topics.map(topic => `<span class="tag">${escape(catalogue.topics.find(item => item.key === topic)?.label || topic)}</span>`).join('')}</div></div></article>`).join('');
    if (!shown.length) results.innerHTML = '<div class="note">No matching posts. Try fewer or different words.</div>';
    more.classList.toggle('hidden', visible >= current.length);
  }

  function selectTopic(next) {
    activeTopic = next;
    [...topics.querySelectorAll('button')].forEach(button => button.classList.toggle('active', button.dataset.topic === next));
    apply();
  }

  async function start() {
    try {
      const response = await fetch('catalogue.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      catalogue = await response.json();
      if (source && catalogue.sources?.length > 1) {
        source.insertAdjacentHTML('beforeend', catalogue.sources.map(item => `<option value="${escape(item.key)}">${escape(item.label)}</option>`).join(''));
      } else if (source) source.closest('.field').classList.add('hidden');
      year.insertAdjacentHTML('beforeend', catalogue.years.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join(''));
      topics.innerHTML = `<button class="topic active" type="button" data-topic="all">All themes</button>${catalogue.topics.map(topic => `<button class="topic" type="button" data-topic="${escape(topic.key)}">${escape(topic.label)}</button>`).join('')}`;
      topics.addEventListener('click', event => {
        const button = event.target.closest('button[data-topic]');
        if (button) selectTopic(button.dataset.topic);
      });
      apply();
    } catch (error) {
      status.textContent = 'The catalogue could not be loaded just now.';
      results.innerHTML = '<div class="note warning">You can still browse the <a href="https://chosen-path.org/">Chosen Path site</a> directly.</div>';
    }
  }

  query.addEventListener('input', apply);
  year.addEventListener('change', apply);
  sort.addEventListener('change', apply);
  source?.addEventListener('change', apply);
  more.addEventListener('click', () => { visible += pageSize; render(); });
  clear.addEventListener('click', () => {
    query.value = '';
    year.value = 'all';
    sort.value = 'relevance';
    if (source) source.value = 'all';
    selectTopic('all');
    query.focus();
  });
  start();
})();
