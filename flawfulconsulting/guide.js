(() => {
  const input = document.querySelector('#guide-search');
  if (!input) return;
  const status = document.querySelector('#search-status');
  const results = document.querySelector('#search-results');
  let data;
  const render = () => {
    results.replaceChildren();
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) { status.textContent = 'Search chapter text, headings, and resources.'; return; }
    const hits = data.filter(row => words.every(word => `${row.title} ${row.chapter} ${row.text}`.toLowerCase().includes(word)));
    status.textContent = `${hits.length} matching section${hits.length === 1 ? '' : 's'}.`;
    for (const row of hits) {
      const article = document.createElement('article');
      const small = document.createElement('small'); small.textContent = row.chapter;
      const link = document.createElement('a'); link.href = row.url; link.textContent = row.title;
      const text = document.createElement('p'); text.textContent = row.text.slice(0, 210) + (row.text.length > 210 ? '…' : '');
      article.append(small, link, text); results.append(article);
    }
  };
  input.addEventListener('input', async () => {
    if (!data) {
      status.textContent = 'Loading the guide index…';
      try { const response = await fetch('/flawfulconsulting/search.json'); if (!response.ok) throw new Error('Index unavailable'); data = await response.json(); }
      catch { status.textContent = 'Search is unavailable. Use the chapter links above.'; return; }
    }
    render();
  });
})();
