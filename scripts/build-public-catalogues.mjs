import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputRoot = resolve(process.argv[2] || 'library');
const stopwords = new Set(`a an and are as at be been being but by can could did do does for from had has have he her here him his how i if in into is it its may me more most my no not of on one only or other our out over she should so some than that the their them then there these they this those through to too under up us very was we were what when where which who why will with would you your`.split(' '));
const topicRules = [
  ['systems', 'Systems, cybernetics, and complexity', ['system', 'systems', 'cybernetic', 'cybernetics', 'complexity', 'complex']],
  ['public-services', 'Public services', ['public service', 'public services', 'council', 'commissioning', 'government']],
  ['relational', 'Relational practice', ['relational', 'relationship', 'relationships', 'human learning systems']],
  ['leadership', 'Leadership and organisation', ['leadership', 'leader', 'organisation', 'organization', 'management']],
  ['change', 'Change and transformation', ['change', 'transformation', 'reform', 'intervention']],
  ['power', 'Power and politics', ['power', 'politics', 'political', 'ideology']],
  ['practice', 'Practice, consulting, and facilitation', ['practice', 'consulting', 'consultant', 'facilitation', 'workshop']],
  ['audio', 'Podcasts and audio', ['podcast', 'audio', 'recording', 'episode']],
];

function decodeEntities(text = '') {
  const named = { amp: '&', apos: "'", quot: '"', lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', rarr: '→' };
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, code) => {
    if (code[0] === '#') {
      const hex = code[1].toLowerCase() === 'x';
      return String.fromCodePoint(Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return named[code.toLowerCase()] ?? `&${code};`;
  });
}

function plain(html = '') {
  return decodeEntities(decodeEntities(html)).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(text) {
  return [...new Set((text.toLowerCase().match(/[a-z0-9][a-z0-9’'-]{1,}/g) || []).map(token => token.replaceAll('’', "'").replace(/^'+|'+$/g, '')).filter(token => token.length > 1 && !stopwords.has(token)))];
}

function topicsFor(text, explicit = []) {
  const lower = text.toLowerCase();
  return [...new Set([...explicit, ...topicRules.filter(([, , rules]) => rules.some(rule => lower.includes(rule))).map(([key]) => key)])];
}

async function fetchWordPress(endpoint, source) {
  async function fetchPage(page) {
    const url = new URL(endpoint);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    url.searchParams.set('_fields', source.fullText ? 'id,date,link,title,excerpt,content' : 'id,date,link,title,excerpt');
    const response = await fetch(url, { headers: { 'user-agent': 'antlerboy-public-catalogue/2.0' } });
    if (!response.ok) throw new Error(`${source.label} returned ${response.status} for page ${page}`);
    return { posts: await response.json(), totalPages: Number(response.headers.get('x-wp-totalpages') || 1) };
  }
  const first = await fetchPage(1);
  const posts = [...first.posts];
  const pages = Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => index + 2);
  const concurrency = 10;
  for (let index = 0; index < pages.length; index += concurrency) {
    const batches = await Promise.all(pages.slice(index, index + concurrency).map(fetchPage));
    for (const batch of batches) posts.push(...batch.posts);
  }
  if (!posts.length) throw new Error(`${source.label} returned no public posts.`);
  return posts.map(post => {
    const title = plain(post.title?.rendered);
    const excerpt = [...plain(post.excerpt?.rendered)].slice(0, 420).join('');
    const content = plain(post.content?.rendered || '');
    return { id: `${source.key}-${post.id}`, date: post.date.slice(0, 10), year: post.date.slice(0, 4), title, url: post.link, excerpt, topics: topicsFor(`${title} ${excerpt} ${content}`), source: source.key };
  });
}

function libraryDocuments() {
  const manifest = JSON.parse(readFileSync('library/manifest.json', 'utf8'));
  const pages = manifest.pages.map(page => ({ id: `library-page-${page.slug}`, date: '', year: '', title: page.title, url: `/library/${page.slug}/`, excerpt: page.description || '', topics: topicsFor(`${page.title} ${page.description || ''} ${(page.tags || []).join(' ')}`, page.tags || []), source: 'library' }));
  const resources = manifest.resources.map((resource, index) => ({ id: `library-resource-${index}`, date: String(resource.year || ''), year: String(resource.year || ''), title: resource.title, url: resource.url, excerpt: [resource.description, resource.format].filter(Boolean).join(' · '), topics: topicsFor(`${resource.title} ${resource.description || ''} ${(resource.tags || []).join(' ')} ${resource.format || ''}`, resource.tags || []), source: 'library' }));
  return [...pages, ...resources];
}

function catalogue(documents, sources) {
  const index = Object.create(null);
  documents.forEach((document, position) => {
    for (const token of tokens(`${document.title} ${document.excerpt} ${document.topics.join(' ')}`)) (index[token] ||= []).push(position);
  });
  return { generatedAt: new Date().toISOString(), documents, index, years: [...new Set(documents.map(document => document.year).filter(Boolean))].sort((a, b) => b.localeCompare(a)), topics: topicRules.map(([key, label]) => ({ key, label })), sources };
}

function save(slug, data) {
  const path = resolve(outputRoot, slug, 'catalogue.json');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
  console.log(`Indexed ${data.documents.length} items in ${path}`);
}

const sourceList = [
  { key: 'chosen-path', label: 'Chosen Path', url: 'https://chosen-path.org/', fullText: true },
  { key: 'syscoi', label: 'Systems Community of Inquiry', url: 'https://stream.syscoi.com/', fullText: false },
  { key: 'library', label: 'Antlerboy public library', url: 'https://antlerboy.com/library/' },
];
function existingDocuments(slug) {
  return JSON.parse(readFileSync(resolve(outputRoot, slug, 'catalogue.json'), 'utf8')).documents;
}
const reuse = process.env.CATALOGUE_REUSE === '1';
const chosen = reuse ? existingDocuments('chosen-path') : await fetchWordPress('https://public-api.wordpress.com/wp/v2/sites/chosenpath.wordpress.com/posts', sourceList[0]);
const syscoi = reuse ? existingDocuments('syscoi') : await fetchWordPress('https://public-api.wordpress.com/wp/v2/sites/syscoi.wordpress.com/posts', sourceList[1]);
const library = libraryDocuments();
save('chosen-path', catalogue(chosen, [sourceList[0]]));
save('syscoi', catalogue(syscoi, [sourceList[1]]));
save('catalogue', catalogue(library, [sourceList[2]]));
save('search', catalogue([...library, ...chosen, ...syscoi], sourceList));
