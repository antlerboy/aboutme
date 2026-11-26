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
  const match = document.querySelector('#catalogue-match');
  const permalink = document.querySelector('#catalogue-link');
  const missingPage = document.querySelector('[data-missing-page]');
  const stopwords = new Set('a an and are as at be been being but by can could did do does for from had has have he her here him his how i if in into is it its may me more most my no not of on one only or other our out over she should so some than that the their them then there these they this those through to too under up us very was we were what when where which who why will with would you your'.split(' '));
  const sourceTypes = { library: 'Curated library entry', 'chosen-path': 'Writing archive', syscoi: 'Community link record' };
  const pageSize = 24;
  let catalogue, activeTopic = 'all', visible = pageSize, current = [], closeMatches = false;
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

  function queryFromMissingPath() {
    return location.pathname.split('/').map(part => {
      try { return decodeURIComponent(part); } catch { return part; }
    }).filter(part => !/^(?:library|index\.[a-z]+|default\.[a-z]+|404(?:\.html)?)$/i.test(part))
      .join(' ').replace(/\.(?:html?|php|aspx?)\b/gi, '')
      .replace(/[-_./]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  if (missingPage) {
    missingPage.textContent = location.pathname;
    query.value = queryFromMissingPath();
    if (match) match.value = 'any';
    updateLink();
  }

  function tokenise(value) {
    return [...new Set((value.toLowerCase().match(/[a-z0-9][a-z0-9’'-]{1,}/g) || [])
      .map(token => token.replaceAll('’', "'").replace(/^'+|'+$/g, ''))
      .filter(token => token.length > 1 && !stopwords.has(token)))];
  }

  function oneEditApart(left, right) {
    if (Math.abs(left.length - right.length) > 1) return false;
    if (left.length === right.length) {
      const differences = [];
      for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) differences.push(index);
      return differences.length === 1 || (differences.length === 2 && differences[1] === differences[0] + 1 && left[differences[0]] === right[differences[1]] && left[differences[1]] === right[differences[0]]);
    }
    const [shorter, longer] = left.length < right.length ? [left, right] : [right, left];
    let shortIndex = 0, longIndex = 0, skipped = false;
    while (shortIndex < shorter.length && longIndex < longer.length) {
      if (shorter[shortIndex] === longer[longIndex]) { shortIndex += 1; longIndex += 1; }
      else if (skipped) return false;
      else { skipped = true; longIndex += 1; }
    }
    return true;
  }

  function scoreDocuments(terms, allowCloseMatches = false) {
    if (!terms.length) return catalogue.documents.map((document, position) => ({ document, position, score: 0 }));
    const scores = new Map(), counts = new Map();
    for (const term of terms) {
      const positions = new Map((catalogue.index[term] || []).map(position => [position, 5]));
      if (allowCloseMatches && term.length >= 4 && term.length <= 32) {
        for (const candidate of Object.keys(catalogue.index)) {
          if (oneEditApart(term, candidate)) for (const position of catalogue.index[candidate]) if (!positions.has(position)) positions.set(position, 1);
        }
      }
      for (const [position, quality] of positions) {
        counts.set(position, (counts.get(position) || 0) + 1);
        scores.set(position, (scores.get(position) || 0) + quality);
      }
    }
    return [...scores].filter(([position]) => match?.value === 'any' || counts.get(position) === terms.length).map(([position, score]) => {
      const document = catalogue.documents[position], title = document.title.toLowerCase(), excerpt = (document.excerpt || '').toLowerCase();
      const close = allowCloseMatches && score < terms.length * 5;
      for (const term of terms) { if (title.includes(term)) score += 4; else if (excerpt.includes(term)) score += 1; }
      if (title.includes(query.value.trim().toLowerCase())) score += 8;
      const aliases = tokenise(document.searchAliases || '');
      if (aliases.length && terms.every(term => aliases.includes(term) || (allowCloseMatches && term.length >= 4 && aliases.some(alias => oneEditApart(term, alias))))) score += 6;
      return { document, position, score, close };
    });
  }

  function updateLink() {
    const url = missingPage ? new URL('/library/search/', location.origin) : new URL(location.href);
    for (const key of ['q', 'year', 'sort', 'source', 'topic', 'match']) url.searchParams.delete(key);
    const state = { q: query.value.trim(), year: year.value, sort: sort.value, source: source?.value, topic: activeTopic, match: match?.value };
    for (const [key, value] of Object.entries(state)) if (value && value !== 'all' && value !== 'relevance') url.searchParams.set(key, value);
    if (!missingPage) history.replaceState(null, '', url);
    if (permalink) permalink.href = url.href;
  }

  function markTopic() {
    [...topics.querySelectorAll('button')].forEach(button => {
      const active = button.dataset.topic === activeTopic;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function restoreState() {
    // A missing address supplies path words only, never query strings or fragments.
    const params = missingPage ? new URLSearchParams() : new URL(location.href).searchParams;
    query.value = missingPage ? queryFromMissingPath() : params.get('q') || '';
    for (const [element, key, fallback] of [[year, 'year', 'all'], [sort, 'sort', 'relevance'], [source, 'source', 'all'], [match, 'match', missingPage ? 'any' : 'all']]) {
      if (!element) continue;
      const value = params.get(key) || fallback;
      element.value = [...element.options].some(option => option.value === value) ? value : fallback;
    }
    activeTopic = catalogue.topics.some(topic => topic.key === params.get('topic')) ? params.get('topic') : 'all';
    markTopic();
  }

  function apply() {
    if (!catalogue) return;
    const terms = tokenise(query.value.trim());
    closeMatches = false;
    // A misspelling can itself be a real word ('chat' for 'chart'). Rank close
    // matches alongside exact ones, with stronger weight for exact words.
    const matches = missingPage && !terms.length ? [] : scoreDocuments(terms, match?.value !== 'any');
    current = matches
      .filter(({ document }) => year.value === 'all' || document.year === year.value)
      .filter(({ document }) => activeTopic === 'all' || document.topics.includes(activeTopic))
      .filter(({ document }) => !source || source.value === 'all' || document.source === source.value || document.sourceKeys?.includes(source.value));
    closeMatches = current.some(result => result.close);
    current.sort((a, b) => {
      if (sort.value === 'oldest') return a.document.date.localeCompare(b.document.date);
      if (sort.value === 'newest' || !terms.length) return b.document.date.localeCompare(a.document.date);
      return b.score - a.score || b.document.date.localeCompare(a.document.date);
    });
    visible = pageSize;
    updateLink();
    render();
  }

  function provenance(document) {
    const keys = [...new Set(document.sourceKeys || [document.source || catalogue.sources?.[0]?.key])].filter(Boolean);
    return keys.map(key => {
      const label = catalogue.sources?.find(item => item.key === key)?.label || key;
      return `<span class="tag source-badge">${escape(label)} · ${escape(sourceTypes[key] || 'Catalogue record')}</span>`;
    }).join('');
  }

  function render() {
    const shown = current.slice(0, visible);
    status.textContent = `${current.length.toLocaleString()} item${current.length === 1 ? '' : 's'} found${closeMatches ? ' · close matches' : ''} · catalogue updated ${new Date(catalogue.generatedAt).toLocaleDateString('en-GB')}`;
    results.innerHTML = shown.map(({ document }) => `<article class="catalogue-result"><div><div class="tags provenance">${provenance(document)}</div>${document.date ? `<p class="eyebrow">${escape(document.date)}</p>` : ''}<h3><a href="${escape(document.url)}">${escape(document.title)}</a></h3><p>${escape(document.excerpt || 'No excerpt available.')}</p><div class="tags">${document.topics.map(topic => `<span class="tag">${escape(catalogue.topics.find(item => item.key === topic)?.label || topic)}</span>`).join('')}</div></div></article>`).join('');
    if (!shown.length) results.innerHTML = missingPage && !tokenise(query.value.trim()).length
      ? '<div class="note">Enter a word or phrase to search, or browse the <a href="/library/">library</a>.</div>'
      : '<div class="note">No matching entries. Try fewer words, choose ‘Any word’, or browse the <a href="/library/use/">practical routes</a>.</div>';
    more.classList.toggle('hidden', visible >= current.length);
  }

  function selectTopic(next) { activeTopic = next; markTopic(); apply(); }

  async function start() {
    try {
      const response = await fetch(missingPage ? '/library/search/catalogue.json' : 'catalogue.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      catalogue = await response.json();
      if (source && catalogue.sources?.length > 1) source.insertAdjacentHTML('beforeend', catalogue.sources.map(item => `<option value="${escape(item.key)}">${escape(item.label)}</option>`).join(''));
      else if (source) source.closest('.field').classList.add('hidden');
      year.insertAdjacentHTML('beforeend', catalogue.years.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join(''));
      topics.innerHTML = `<button class="topic active" type="button" data-topic="all" aria-pressed="true">All themes</button>${catalogue.topics.map(topic => `<button class="topic" type="button" data-topic="${escape(topic.key)}" aria-pressed="false">${escape(topic.label)}</button>`).join('')}`;
      topics.addEventListener('click', event => { const button = event.target.closest('button[data-topic]'); if (button) selectTopic(button.dataset.topic); });
      restoreState();
      apply();
    } catch (error) {
      status.textContent = 'The catalogue could not be loaded just now.';
      results.innerHTML = '<div class="note warning">Browse the <a href="/library/">public library</a>, <a href="https://chosen-path.org/">Chosen Path</a>, or <a href="https://stream.syscoi.com/">SysCoI</a> directly.</div>';
    }
  }

  query.addEventListener('input', apply);
  document.querySelector('#catalogue-form')?.addEventListener('submit', event => { event.preventDefault(); apply(); });
  year.addEventListener('change', apply);
  sort.addEventListener('change', apply);
  source?.addEventListener('change', apply);
  match?.addEventListener('change', apply);
  window.addEventListener('popstate', () => { if (catalogue) { restoreState(); apply(); } });
  more.addEventListener('click', () => { visible += pageSize; render(); });
  clear.addEventListener('click', () => {
    query.value = ''; year.value = 'all'; sort.value = 'relevance';
    if (source) source.value = 'all';
    if (match) match.value = missingPage ? 'any' : 'all';
    selectTopic('all'); query.focus();
  });
  start();
})();
