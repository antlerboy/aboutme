import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const readerRecordings = JSON.parse(readFileSync(join(root, "scripts/reader-recordings.json"), "utf8"));

const h = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const nav = `<header><div class="wrap top"><a class="brand" href="/">Benjamin P Taylor ,  antlerboy</a><nav class="nav" aria-label="Library navigation"><a href="/library/">Library</a><a href="/library/publications/">Browse</a><a href="/library/articles-and-essays/">Writing</a><a href="/library/talks-and-sessions/">Talks</a><a href="/library/search/">Search all</a><a href="/">Home</a></nav></div></header>`;

function shell({ slug, title, description, eyebrow = 'Public work library', lead = description, body, scripts = [] }) {
  const canonical = `https://antlerboy.com/library/${slug ? `${slug}/` : ''}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${h(title)} | Benjamin P Taylor</title>
  <meta name="description" content="${h(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="stylesheet" href="/library/style.css">
</head>
<body>
${nav}
<main>
  <section class="hero"><div class="wrap">${slug ? `<div class="crumbs"><a href="/library/">Library</a> / ${h(title)}</div>` : ''}<p class="eyebrow">${h(eyebrow)}</p><h1>${h(title)}</h1><p class="lead">${h(lead)}</p></div></section>
${body}
</main>
<footer><div class="wrap">Benjamin P Taylor ,  <a href="/library/">working public library</a> · <a href="https://github.com/antlerboy/aboutme/issues/1">Suggest a correction or addition</a></div></footer>
${scripts.map(src => `<script src="${h(src)}"></script>`).join('\n')}
</body>
</html>\n`;
}

function save(slug, content) {
  const path = join(root, 'library', slug, 'index.html');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function tagList(tags = []) {
  return `<div class="tags">${tags.map(tag => `<span class="tag">${h(tag.replaceAll('-', ' '))}</span>`).join('')}</div>`;
}

function card(item) {
  return `<article class="card" data-tags="${h((item.tags || []).join(' '))}">${item.kicker ? `<p class="eyebrow">${h(item.kicker)}</p>` : ''}<h3>${h(item.title)}</h3><p>${h(item.description)}</p>${tagList(item.tags)}<a class="go" href="${h(item.url)}">${h(item.action || 'Open')} →</a></article>`;
}

function cardSection(title, description, items, { alt = false, toolbar = false } = {}) {
  return `<section class="section${alt ? ' alt' : ''}"><div class="wrap"><div class="section-head"><h2>${h(title)}</h2>${description ? `<p>${h(description)}</p>` : ''}</div>${toolbar ? `<div class="toolbar"><input id="q" class="search" type="search" placeholder="Search titles, themes and descriptions" aria-label="Search this page"><div class="filters"><button class="filter active" data-filter="all">All</button><button class="filter" data-filter="systems">Systems</button><button class="filter" data-filter="public-services">Public services</button><button class="filter" data-filter="practice">Practice</button><button class="filter" data-filter="writing">Writing</button><button class="filter" data-filter="reference">Reference</button></div></div><p id="result-count" class="count"></p>` : ''}<div class="grid">${items.map(card).join('')}</div></div></section>`;
}

function resources(items) {
  return `<ul class="resource-list">${items.map(item => `<li><strong><a href="${h(item.url)}">${h(item.title)}</a></strong><small>${h(item.meta)}</small><p>${h(item.description)}</p></li>`).join('')}</ul>`;
}

function resourcePage({ slug, title, description, eyebrow = 'Body of work', groups, note, actions = [] }) {
  const body = groups.map((group, index) => `<section class="section${index % 2 ? ' alt' : ''}"><div class="wrap"><div class="section-head"><h2>${h(group.title)}</h2>${group.description ? `<p>${h(group.description)}</p>` : ''}</div>${resources(group.items)}${group.note ? `<div class="note">${h(group.note)}</div>` : ''}</div></section>`).join('')
    + (note || actions.length ? `<section class="section"><div class="wrap">${note ? `<div class="note">${h(note)}</div>` : ''}${actions.length ? `<div class="actions">${actions.map(action => `<a class="button" href="${h(action.url)}">${h(action.title)}</a>`).join('')}</div>` : ''}</div></section>` : '');
  save(slug, shell({ slug, title, description, eyebrow, body }));
}

const waysIn = [
  { title: 'Published writing', description: 'Articles, chapters, and the occasional older curiosity.', tags: ['writing'], url: '/library/articles-and-essays/' },
  { title: 'Preprints and working papers', description: 'Substantial work made available before or outside formal publication.', tags: ['writing'], url: '/library/preprints-and-working-papers/' },
  { title: 'Talks, teaching, and workshops', description: 'Public sessions and cleaned presentation material.', tags: ['practice'], url: '/library/talks-and-sessions/' },
  { title: 'RedQuadrant and PSTA reference', description: 'Selected organisational methods, reports, and historical reference documents.', tags: ['public-services', 'reference'], url: '/library/redquadrant-psta-reference/' },
  { title: 'Search everything', description: 'One search across this library, Chosen Path, and the Systems Community of Inquiry.', tags: ['writing', 'index'], url: '/library/search/' },
  { title: 'Search Chosen Path', description: 'A keyword catalogue of the essays and fragments on chosen-path.org.', tags: ['writing', 'index'], url: '/library/chosen-path/' },
  { title: 'Search the Systems Community of Inquiry', description: 'A parallel catalogue of public posts on SysCoi.', tags: ['systems', 'index'], url: '/library/syscoi/' },
  { title: 'Search this library', description: 'Search the curated papers, talks, podcasts, videos, tools, models, and reference material.', tags: ['index'], url: '/library/catalogue/' },
  { title: 'Browse by form', description: 'Writing, recordings, visual work, reports, and communities.', tags: ['index'], url: '/library/publications/' },
];

const themes = [
  { title: 'Systems leadership, change, and convening', description: 'Ways of seeing and acting across organisational boundaries.', tags: ['systems', 'leadership'], url: '/library/systems-leadership-change-practice/' },
  { title: 'Four dynamics and robust systems', description: 'Differentiation, homogenisation, individuation, and integration.', tags: ['systems', 'practice'], url: '/library/four-dynamics/' },
  { title: 'Relational public services', description: 'Relationships, judgement, and the conditions around relational practice.', tags: ['public-services', 'practice'], url: '/library/relational-public-services/' },
  { title: 'Viable System Model', description: 'Several routes into Stafford Beer’s model and its use in practice.', tags: ['systems', 'practice'], url: '/library/viable-system-model/' },
  { title: 'Outcomes and complexity', description: 'Outcomes as results of complex adaptive systems.', tags: ['public-services', 'systems'], url: '/library/outcomes-and-complexity/' },
  { title: 'Facilitation and systems consulting', description: 'Helping from inside a system without pretending to stand outside it.', tags: ['systems', 'practice'], url: '/library/facilitation-and-systems-consulting/' },
  { title: 'Five core leadership practices', description: 'Intent, honest conversations, clarity, culture, and learning.', tags: ['leadership', 'practice'], url: '/library/five-core-practices/' },
  { title: 'Large-group processes', description: 'Whole-system and participatory methods, with a searchable process collection.', tags: ['practice'], url: '/library/large-group-processes/' },
  { title: 'Productive conversations', description: 'Conversation as infrastructure for shared understanding and learning.', tags: ['practice', 'leadership'], url: '/library/productive-conversations/' },
  { title: 'Four quadrants of thinking threats', description: 'A model for noticing ways in which systems thinking can go wrong.', tags: ['systems'], url: '/library/four-quadrants/' },
  { title: 'Cybernetics is not the banana', description: 'A story about cybernetics, representation, and practice transfer.', tags: ['systems', 'practice'], url: '/library/cybernetics-is-not-the-banana/' },
  { title: 'Public-service transformation', description: 'Adaptive councils, commissioning, learning, and reform.', tags: ['public-services'], url: '/library/public-service-transformation/' },
];

save('', shell({
  slug: '',
  title: 'A working library',
  description: 'A selected library of Benjamin P Taylor’s public writing, talks, tools, models, recordings, and reference material.',
  eyebrow: 'Public work library',
  lead: 'A selected collection of Benjamin P Taylor’s public writing, talks, tools, models, recordings, and reference material. It is a working library, and not complete.',
  body: cardSection('Find a way in', 'Use the route that best fits what you are looking for.', waysIn, { toolbar: true })
    + cardSection('Recurring themes', 'Ideas and practices I keep returning to, often in unfinished or changing forms.', themes, { alt: true }),
  scripts: ['/library/app.js'],
}));

const publicationCollections = [
  ...waysIn.slice(0, 8),
  { title: 'Podcasts', description: 'Shows I have co-hosted and interviews with other practitioners.', tags: ['audio'], url: '/library/podcasts/' },
  { title: 'Videos and recorded conversations', description: 'Presentations, panels, and recorded conversations.', tags: ['video'], url: '/library/videos/' },
  { title: 'Visual models and short publications', description: 'Diagrams, visual arguments, and short publications.', tags: ['visual'], url: '/library/visual-models/' },
  { title: 'Groups and communities', description: 'Public communities, networks, and shared learning spaces.', tags: ['community'], url: '/library/groups-and-communities/' },
];
save('publications', shell({ slug: 'publications', title: 'Browse the library', description: 'Browse writing, talks, recordings, visual work, reports, and organisational reference material.', eyebrow: 'Collections', body: cardSection('Collections', 'Different routes into the same body of work.', publicationCollections, { toolbar: true }), scripts: ['/library/app.js'] }));

const articles = [
 ...readerRecordings.written,
  { kicker: '2026 · chapter appendix', title: 'What can systems thinking and change learn to become?', description: 'An appendix to Understanding Systems to Change the World, setting out eight challenges and eight practical responses.', tags: ['systems', 'writing'], url: 'https://chosen-path.org/wp-content/uploads/2026/04/benjamin_taylor_what_can_systems_change_learn_to_become_appendix_from_understanding_systems_to_change_the_world.pdf' },
  { kicker: '2021 · article', title: 'Tips on making place-based working work', description: 'Practical advice on place-based public-service work.', tags: ['public-services', 'writing'], url: 'https://www.dropbox.com/scl/fi/epj0a6h6o3d0ijpr1fe8a/Benjamin-Taylor_-Tips-on-making-place-based-working-work-_-Local-Government-Chronicle-LGC.pdf?rlkey=d3fxipow0pkv4hk6bxpifmhwq&dl=0' },
  { kicker: '2020 · article', title: 'Capturing learning ,  learning network', description: 'Learning, evidence, and organisational memory.', tags: ['practice', 'writing'], url: 'https://www.dropbox.com/scl/fi/izo3g2vqi7uq0adwzaff2/Benjamin-Taylor-MJ-piece-on-capturing-learning-learning-network.pdf?rlkey=tqtc6qn54hkdk9tihktbosuc0&dl=0' },
  { kicker: '2020 · article', title: 'Scenario planning and speculative futures ,  learning network', description: 'Scenario planning and learning under uncertainty.', tags: ['practice', 'writing'], url: 'https://www.dropbox.com/scl/fi/czi6rwr905rbyeufxz456/Benjamin-Taylor-LGC-piece-on-scenario-planning-speculative-futures-learning-network.pdf?rlkey=qv8kn2foa86j2fpl6nl5mwb1t&dl=0' },
  { kicker: '2019 · article', title: 'I’m a little bit sick of paradigm shifts', description: 'An argument for greater care with grand claims of transformation.', tags: ['public-services', 'writing'], url: 'https://www.dropbox.com/scl/fi/aejh9uen8msqm7jftuob8/Benjamin-Taylor-I-m-a-little-bit-sick-of-paradigm-shifts-Local-Government-Chronicle-LGC.pdf?rlkey=dpucq5mmnvd5qvm7umk4be6wp&dl=0' },
  { kicker: '2019 · article', title: 'The nonsense of ‘chairman’', description: 'A short piece on language, convention, and power.', tags: ['writing'], url: 'https://www.dropbox.com/scl/fi/x49gk0o0c2pj2to6bzjhu/The-nonsense-of-chairman.pdf?rlkey=2c7muu5ial2bn3ifba4q8ralz&dl=0' },
  { kicker: '2019 · article', title: 'Healing our divided communities', description: 'Division, community, and public leadership.', tags: ['public-services', 'writing'], url: 'https://www.dropbox.com/scl/fi/h0r5oclzze7bj4ujwp65b/Benjamin-Taylor_-Healing-our-divided-communities-Local-Government-Chronicle-LGC.pdf?rlkey=szy8j5d9fm8ck36f218edm57o&dl=0' },
  { kicker: '2019 · article', title: 'What disconnects policy and delivery? Class warfare', description: 'The social and organisational distance between policy and delivery.', tags: ['public-services', 'writing'], url: 'https://www.dropbox.com/scl/fi/m1vclwpjwbikgg73b2slm/What-disconnects-policy-and-delivery-Class-warfare-Opinion-LGC.pdf?rlkey=26vl9nle3dr6rzs0gieja5ydu&dl=0' },
  { kicker: '2019 · article', title: 'We must find a future where systems change can take root', description: 'The conditions required for systems change.', tags: ['systems', 'writing'], url: 'https://www.dropbox.com/scl/fi/6wwckqg9dq49yhq1nz7rn/We-must-find-a-future-where-systems-change-can-take-root-Opinion-LGC.pdf?rlkey=ecsfovlrz4vcqszjmtgpk3ftf&dl=0' },
  { kicker: '2011 · journal article', title: 'The situation facing UK public libraries and the need to change the status and approach of interlending', description: 'A peer-reviewed early article, included here as a curiosity rather than as part of the current systems canon.', tags: ['public-services', 'writing'], url: 'https://doi.org/10.1108/02641611111164618' },
  { kicker: '2026 · earlier working paper', title: 'The ladder of relationality in public service', description: 'The earlier solo paper remains available. A substantially updated, co-authored version is listed under preprints as Degrees of relationality.', tags: ['public-services', 'writing'], url: 'https://docs.google.com/document/d/1FewYqWndCJbjGYOlkWFZGBHxbs3AM4lA/edit?usp=sharing', action: 'Open earlier version' },
];
save('articles-and-essays', shell({ slug: 'articles-and-essays', title: 'Published articles and essays', description: 'Published writing, with early and superseded material labelled rather than silently erased.', eyebrow: 'Writing', lead: 'Published writing, with early and superseded material labelled rather than silently erased.', body: cardSection('Writing', '', articles, { toolbar: true }) + `<section class="section alt"><div class="wrap"><div class="note"><strong>Looking for current unfinished work?</strong> The latest substantial manuscripts are separated into <a href="/library/preprints-and-working-papers/">preprints and working papers</a>.</div></div></section>`, scripts: ['/library/app.js'] }));

const preprints = [
  { kicker: 'v12 · 26 August 2026', title: 'Degrees of relationality', description: 'Benjamin P Taylor and Philip Boxer. Preprint/working paper; the updated development of the earlier ladder paper.', tags: ['public-services', 'writing'], url: '/library/files/preprints/2026-degrees-of-relationality-v12-taylor-boxer.pdf' },
  { kicker: 'v9 · 20 August 2026', title: 'The demand side of public services', description: 'Philip Boxer and Benjamin P Taylor. Preprint/working paper.', tags: ['public-services', 'writing'], url: '/library/files/preprints/2026-the-demand-side-of-public-services-v9-boxer-taylor.pdf' },
  { kicker: 'v4 · 20 August 2026', title: 'Anxiety, ideology and the evacuation of the public realm', description: 'Philip Boxer and Benjamin P Taylor. Preprint/working paper.', tags: ['public-services', 'writing'], url: '/library/files/preprints/2026-anxiety-ideology-and-the-evacuation-of-the-public-realm-v4-boxer-taylor.pdf' },
  { kicker: 'v3 · 20 August 2026', title: 'Service systems, citizen ecosystems, and the politics we deny', description: 'Benjamin P Taylor. Towards a binocular public service science. Preprint/working paper.', tags: ['public-services', 'systems', 'writing'], url: '/library/files/preprints/2026-service-systems-citizen-ecosystems-and-the-politics-we-deny-v3-taylor.pdf' },
];
save('preprints-and-working-papers', shell({ slug: 'preprints-and-working-papers', title: 'Preprints and working papers', description: 'Current substantial manuscripts shared before or outside formal publication.', eyebrow: 'Writing in progress', lead: 'Current substantial manuscripts shared before or outside formal publication. These versions may change and should not be treated as peer-reviewed final articles.', body: cardSection('Current manuscripts', 'Version, author order, and date are stated explicitly.', preprints, { toolbar: true }), scripts: ['/library/app.js'] }));

const scio = [
 ...readerRecordings.recordings.filter(item => item.tags.includes('scio')),
  { kicker: 'September 2025 · SysPrac25', title: 'Systemic consulting: rethinking the consultant’s role', description: 'A public SCiO workshop resource on consulting as partnership, dialogue, and co-creation.', tags: ['systems', 'practice', 'scio'], url: 'https://www.systemspractice.org/resources/systemic-consulting-rethinking-consultants-role-workshop-sysprac25' },
  { kicker: 'December 2024 · SCiO', title: 'Large-group processes', description: 'A detailed public deck on whole-system and participatory methods.', tags: ['systems', 'practice', 'scio'], url: '/library/files/talks/large-group-processes.pdf' },
  { kicker: 'November 2024 · SCiO', title: 'Productive conversations', description: 'Honest, constructive conversations and shared learning.', tags: ['practice', 'scio'], url: 'https://www.dropbox.com/scl/fi/ztetuy2oydh3va0c4u5zm/2024-111-20-SCiO-Benjamin-P-Taylor-productive-conversations-v1.2.pdf?rlkey=69mwjlj2yyr6nc0hkl9aral3m&dl=0' },
  { kicker: '2022 · SCiO', title: 'Systems leadership, change, theory and practice', description: 'A public SCiO resource on systems leadership and change.', tags: ['systems', 'leadership', 'scio'], url: 'https://www.systemspractice.org/resources/systems-leadership-change-theory-and-practice' },
  { kicker: 'April 2021 · SCiO', title: 'Metaphor', description: 'Niki Jobson and Benjamin P Taylor on metaphor, framing, and problem-setting.', tags: ['systems', 'practice', 'scio'], url: 'https://www.systemspractice.org/resources/metaphor-presented-scio-development-event' },
  { kicker: 'January 2021 · SCiO', title: 'The four quadrants of thinking threats', description: 'A public SCiO resource on responsibility and pathologies in systems thinking.', tags: ['systems', 'scio'], url: 'https://www.systemspractice.org/resources/four-quadrants-thinking-threats' },
];

const suppliedTalks = [
  { kicker: '2025', title: 'Better conversations for better realities', description: 'Learning loops to break the devil’s bargain.', tags: ['practice', 'leadership'], url: '/library/files/talks/better-conversations-for-better-realities.pdf' },
  { kicker: '2025', title: 'Outcomes are the results of complex adaptive systems', description: 'A public-service outcomes presentation.', tags: ['systems', 'public-services'], url: '/library/files/talks/outcomes-and-complex-adaptive-systems.pdf' },
  { kicker: '2025', title: 'Viable System Model lecture', description: 'A long-form teaching deck on Stafford Beer’s Viable System Model.', tags: ['systems', 'practice'], url: '/library/files/talks/viable-system-model-lecture.pdf' },
  { kicker: '2025', title: 'Systems convening and boundary work', description: 'A compact set of core slides on convening across boundaries.', tags: ['systems', 'leadership'], url: '/library/files/talks/systems-convening-and-boundaries.pdf' },
  { kicker: '2025', title: 'Spaces and leadership stands', description: 'A short working deck on systemic position and leadership response.', tags: ['leadership', 'practice'], url: '/library/files/talks/spaces-and-leadership-stands.pdf' },
  { kicker: '2024', title: 'Positive dynamics of differentiation and integration', description: 'An ISSS presentation on differentiation, homogenisation, individuation, and integration.', tags: ['systems', 'practice'], url: '/library/files/talks/positive-dynamics-differentiation-and-integration.pdf' },
  { kicker: '2024', title: 'Clarity practices', description: 'Five core management and leadership practices, with a focus on clarity.', tags: ['leadership', 'practice'], url: '/library/files/talks/clarity-practices.pdf' },
  { kicker: '2023', title: 'Power, systems, and the Viable System Model', description: 'A Metaphorum presentation connecting VSM, power, and human systems dynamics.', tags: ['systems', 'practice'], url: '/library/files/talks/power-systems-and-the-viable-system-model.pdf' },
  { kicker: '2023', title: 'A simplification of the Viable System Model', description: 'A concise four-slide introduction to organisational viability.', tags: ['systems'], url: '/library/files/talks/simplifying-the-viable-system-model.pdf' },
  { kicker: '2023', title: 'Introduction to four dynamics', description: 'Segmentation, blending, empowerment, and harmonisation.', tags: ['systems', 'practice'], url: '/library/files/talks/introduction-to-four-dynamics.pdf' },
  { kicker: '2023', title: 'Systems leadership, change, theory and practice', description: 'A substantial public presentation on systems leadership, change, theory, and convening.', tags: ['systems', 'leadership'], url: '/library/files/talks/systems-leadership-change-theory-and-practice.pdf' },
  { kicker: 'Working reference', title: 'Five key questions for transformation', description: 'A one-page prompt for thinking about purpose, system, activity, and learning.', tags: ['public-services', 'practice'], url: '/library/files/talks/five-key-questions-for-transformation.pdf' },
];

const recentTalks = [
  { kicker: 'June 2026 · TRIP26', title: 'Why do relational public services fail?', description: 'Conference presentation.', tags: ['public-services'], url: 'https://www.dropbox.com/scl/fi/2fupfdismqxnr5glp7l0i/2026-06-25-TRIP26-Benjamin-Taylor-why-do-relational-public-services-fail-v1.0BT.pdf?rlkey=bminwqzpruwghaukmsq0t86f6&dl=0' },
  { kicker: '2026 · STSP26', title: 'Systems practice is a humanism', description: 'Conference presentation.', tags: ['systems'], url: 'https://www.dropbox.com/scl/fi/n0egk8yt4fvu9fqbud4kj/Benjamin-P-Taylor-at-STSP26-systems-practice-is-a-humanism.pdf?rlkey=rahzsmimaa6z1qn4d4haci2gp&dl=0' },
  { kicker: 'March 2026 · STSP26', title: 'Systems consulting and facilitation', description: 'Conference presentation.', tags: ['systems', 'practice'], url: 'https://www.dropbox.com/scl/fi/ca3lalnnjdkt06rx39nm6/2026-03-24-STSP26-systems-conulting-and-facilitation-Benjamin-P-Taylor.pdf?rlkey=u5txcu880d7ht4ceu8ognmu7z&dl=0' },
];
save('talks-and-sessions', shell({ slug: 'talks-and-sessions', title: 'Talks, teaching, and workshops', description: 'Public sessions and presentation slides.', eyebrow: 'Public sessions', lead: 'Public talks, workshops, and presentation slides.', body: cardSection('Recent public sessions', '', recentTalks, { toolbar: true }) + cardSection('Public SCiO sessions', 'Recordings, workshop resources, and presentation slides.', scio, { alt: true }) + cardSection('Presentation slides', 'Download slides on systems practice, leadership, and public-service change.', suppliedTalks), scripts: ['/library/app.js'] }));

const podcasts = [
  ...readerRecordings.podcasts,
  { title: 'Unprofessionalism episode 018', description: 'Professionalism, judgement, competence, and difficult truths.', tags: ['audio'], url: 'https://chosen-path.org/2026/06/10/professionalism-can-support-judgement-competence-and-care-but-it-often-means-knowing-how-to-keep-difficult-truths-in-a-socially-acceptable-form/' },
  { title: 'Why Service Design Thinking ,  service design in government and public services', description: 'Service design in government and public services.', tags: ['audio', 'public-services'], url: 'https://podcasts.apple.com/us/podcast/service-design-in-government-and-public-services/id1104134900?i=1000384105616' },
  { title: 'The Human Current 040', description: 'The myth of the machine and human systems.', tags: ['audio', 'systems'], url: 'https://soundcloud.com/humancurrent/040-the-myth-of-the' },
  { title: 'The Human Current 038', description: 'A philosophical look at company culture.', tags: ['audio'], url: 'https://soundcloud.com/humancurrent/038-a-philosophical-look-at' },
  { title: 'The Prime Domino 003 ,  Benjamin Taylor, RedQuadrant', description: 'RedQuadrant’s approach to public-service improvement.', tags: ['audio', 'public-services'], url: 'https://podcasts.apple.com/gb/podcast/primedomino-003-benjamin-taylor-redquadrant/id974705792?i=1000340913686' },
  { title: 'Business 901 ,  the RedQuadrant method of public service transformation', description: 'A conversation on RedQuadrant’s approach.', tags: ['audio', 'public-services'], url: 'https://business901.com/blog1/the-redquadrant-method-of-public-service-transformation' },
  { title: 'workshops.work episode 257', description: 'Exploring the ethical lines between facilitation and manipulation.', tags: ['audio', 'practice'], url: 'https://podcasts.apple.com/us/podcast/257-exploring-the-ethical-lines-between-facilitation/id1456264052?i=1000646218514' },
  { title: 'Values and Leadership episode 36', description: 'A recorded conversation on values and leadership.', tags: ['audio', 'leadership'], url: 'https://www.youtube.com/watch?v=AFfgoQroTcM' },
  { title: 'The Outliers Inn', description: 'I used to co-host The Outliers Inn with Joseph Paris. Conversations about operational excellence, organisations, and the occasional drink.', tags: ['audio'], url: 'https://theoutliersinn.com/' },
  { title: 'State of Readiness ,  Benjamin Taylor, RedQuadrant', description: 'A guest conversation on change and readiness.', tags: ['audio', 'public-services'], url: 'https://opexsociety.org/podcasts/state-of-readiness-benjamin-taylor-redquadrant/' },
  { title: 'Complexity Live', description: 'A recorded conversation on complexity.', tags: ['audio', 'systems'], url: 'https://www.youtube.com/watch?v=Cyt5BpLeC1A' },
  { title: '10,000 Swamp Leaders episode 70', description: 'Differentiation, integration, and four dynamics of groups.', tags: ['audio', 'systems'], url: 'https://www.10000swampleaders.com/benjamin-taylor-differentiation-integration-and-four-dynamics-of-groups/' },
  { title: '10,000 Swamp Leaders episode 39', description: 'Problems with Adaptive Leadership and consulting.', tags: ['audio', 'leadership'], url: 'https://www.10000swampleaders.com/benjamin-taylor-there-are-problems-with-adaptive-leadership-and-consulting/' },
  { title: '10,000 Swamp Leaders episode 21', description: 'The abundance and variety of systems traditions.', tags: ['audio', 'systems'], url: 'https://www.10000swampleaders.com/benjamin-taylor-the-abundance-of-systems/' },
];
save('podcasts', shell({ slug: 'podcasts', title: 'Podcasts and audio conversations', description: 'Shows I have co-hosted and guest conversations about systems, leadership, and public services.', eyebrow: 'Audio', lead: 'I used to co-host The Outliers Inn. Here are that archive and my guest conversations about systems, leadership, consulting, and public services.', body: cardSection('Episodes and programmes', '', podcasts, { toolbar: true }) + cardSection('Written interviews', '', readerRecordings.written, { alt: true }), scripts: ['/library/app.js'] }));

const stateReports = [
  { title: 'Public Service: State of Transformation 2018 ,  main PSTA report', meta: '2018 · PSTA report', description: 'The principal conference report and think pieces.', url: 'https://www.dropbox.com/scl/fi/o063q8z79w4jlllnsu3vh/public-service-state-of-transformation-2018-report-from-the-public-service-transformation-academy-e-version.pdf?rlkey=wa35fr9zllc1ktwzpv8a1t69e&dl=0' },
  { title: 'State of emergency ,  RedQuadrant shadow report', meta: '2018 · RedQuadrant report', description: 'The RedQuadrant shadow report alongside the PSTA publication.', url: '/library/files/reference/2018-state-of-transformation-redquadrant-shadow-report.pdf' },
  { title: 'State of Transformation process and survey', meta: '2018 · PSTA process and survey report', description: 'The survey design, process, and evidence supporting the 2018 work.', url: 'https://www.dropbox.com/scl/fi/k40d5dwosj1zazpphaf1q/PSTA-public-service-state-of-transformation-process-and-survey-v2.0.pdf?rlkey=6jxlq3zop4pynael1m5ydkx2c&dl=0' },
  { title: 'State of Transformation report 2019', meta: '2019 · PSTA report', description: 'The main 2019 report.', url: 'https://www.dropbox.com/scl/fi/nxaelfh4uqy1g818v134a/PSTA-state-of-transformation-report-2019-web-version.pdf?rlkey=gaublmq1d5zz8f5nm5o90xwlf&dl=0' },
  { title: 'State of Transformation survey 2019', meta: '2019 · PSTA and PSSE survey report', description: 'The full 2019 survey report.', url: 'https://www.dropbox.com/scl/fi/rjn18l01shgalkvkal6ar/State-of-Transformation-2019-survey-from-the-PSTA-and-PSSE.pdf?rlkey=wr3fb4fja5xj4nktscqsz5z3t&dl=0' },
];
for (const slug of ['state-of-transformation', 'reports-and-surveys']) {
  resourcePage({ slug, title: slug === 'state-of-transformation' ? 'Public Service: State of Transformation' : 'Reports and surveys', description: 'The five principal State of Transformation reports from 2018 and 2019.', eyebrow: 'Selected reports', groups: [{ title: 'Five main reports', description: 'This index keeps the three principal 2018 publications and the two principal 2019 publications. Individual chapters, case studies, fragments, and promotional pages are not duplicated here.', items: stateReports }] });
}

const referenceGroups = [
  { title: 'State of Transformation', description: 'The five principal conference and survey reports.', items: stateReports },
  { title: 'Leadership, change, and systems', items: [
    { title: 'Ten principles for public service leadership', meta: '2019 · RedQuadrant', description: 'The developed leadership framework.', url: 'https://www.dropbox.com/scl/fi/npesqpvt96sl0p1tof3gl/2019-01-28-RedQuadrant-ten-principles-for-public-service-leadership-v2.8BT.pdf?rlkey=yx1zpw8tseh58fu65qt9nztin&dl=0' },
    { title: 'Ten principles ,  checklist for leaders', meta: '2019 · RedQuadrant', description: 'A companion checklist.', url: 'https://www.dropbox.com/scl/fi/awh74euij0k9rcmnkj357/Ten-principles-for-public-service-leadership-checklist-for-leaders-v-January-2019.pdf?rlkey=blbzo54i8k1b26jkc9y16dpzs&dl=0' },
    { title: 'The Adaptive Council model', meta: '2020 · PSTA and RedQuadrant', description: 'A model of adaptive public-service organisation.', url: 'https://www.dropbox.com/scl/fi/97ws4kurk5iie4cffefn8/2020-11-18-the-Public-Service-Transformation-Academy-and-Redquadrant-the-adaptive-council-model-v0.2BT.pdf?rlkey=nflc0i3ee2lgbdcrhrmqv58dx&dl=0' },
    { title: 'The RedQuadrant tool shed ,  overview', meta: 'Reference guide', description: 'An overview of the shared methods collection.', url: 'https://www.dropbox.com/scl/fi/h3syu8m8v9syxe5s9y990/The-RedQuadrant-tool-shed-overview.pdf?rlkey=ikuuv37y7xcdtxu5l5gxbbx28&dl=0' },
    { title: 'Drawing systems ,  a primer', meta: 'RedQuadrant · archived reference', description: 'A short visual introduction to drawing systems.', url: '/library/files/reference/drawing-systems-primer.pdf' },
    { title: 'Systems archetypes ,  a primer', meta: 'RedQuadrant · archived reference', description: 'A compact primer on recurring system-dynamics patterns.', url: '/library/files/reference/systems-archetypes-primer.pdf' },
    { title: 'Core systems-change slide set', meta: '2020 · historical working reference', description: 'A substantial working slide set retained for reference; it is not presented as a finished publication.', url: '/library/files/reference/redquadrant-systems-change-framework.pdf' },
  ] },
  { title: 'Public-service methods and models', items: [
    { title: 'Seven ways to save and improve ,  Lean Management Journal', meta: '2012 · published article', description: 'The original published article.', url: 'https://www.dropbox.com/scl/fi/qh6whyxapbf6eebpp1qru/Lean-Management-Journal-Jan-Feb-2012-seven-ways-to-save-and-improve.pdf?rlkey=a18x90ruwvok53bewo04y4jjz&dl=0' },
    { title: 'Seven ways to save and improve ,  developed RedQuadrant account', meta: 'RedQuadrant · book excerpt', description: 'The later developed account of the framework.', url: '/library/files/reference/redquadrant-seven-ways-to-save-and-improve.pdf' },
    { title: 'Demand management sampler', meta: 'RedQuadrant · archived reference', description: 'A whole-system account of approaches to demand.', url: '/library/files/reference/redquadrant-demand-management-sampler.pdf' },
    { title: 'Commissioning infographic', meta: 'RedQuadrant · visual reference', description: 'A compact visual account of commissioning.', url: 'https://www.dropbox.com/scl/fi/mmcqpewdddb7t86lnda1v/commissioning-infographic.pdf?rlkey=t6kkns96z7qxxw498h16d0z5i&dl=0' },
    { title: 'Public-service business model', meta: 'RedQuadrant · reference', description: 'A business-model-on-a-page and service view.', url: 'https://www.dropbox.com/scl/fi/txhb9u33yj51bg8tau1p1/RedQuadrant-public-service-business-model-on-a-page-and-service-view.pdf?rlkey=d9t0ufwo6nawdtcu4496yhewo&dl=0' },
    { title: 'VECIT change model', meta: 'RedQuadrant · reference', description: 'A concise model for testing the conditions required for change.', url: 'https://www.dropbox.com/scl/fi/pefnbq25tn11v3kefh0t9/VECIT-change-model.pdf?rlkey=092wmbm1wdto8nzgwc18kmq64&dl=0' },
    { title: 'How outsourcing can fail ,  and how to fix it', meta: 'RedQuadrant · reference', description: 'Structural failure modes and practical responses.', url: 'https://www.dropbox.com/scl/fi/mkbd6a3h73rgqjic4okj2/how-outsourcing-can-fail-and-how-to-fix-it.pdf?rlkey=viyztdrpk8qkdrqn7xedvxlu1&dl=0' },
    { title: 'How IT outsourcing can fail ,  SCiO', meta: 'SCiO public resource', description: 'The public SCiO resource page for the outsourcing argument.', url: 'https://www.systemspractice.org/resources/how-it-outsourcing-can-fail-and-how-fix-it' },
  ] },
];
resourcePage({ slug: 'redquadrant-psta-reference', title: 'RedQuadrant and PSTA reference library', description: 'A selected organisational shelf of public RedQuadrant and Public Service Transformation Academy material.', eyebrow: 'Organisational reference', groups: referenceGroups, note: 'This is a selected historical and practice reference shelf. Inclusion does not mean that every document is current, definitive, or solely authored by Benjamin; the organisation and date are stated where known.' });

resourcePage({ slug: 'relational-public-services', title: 'Relational public services', description: 'Relationships, judgement, and the organisational conditions around relational practice.', groups: [{ title: 'Current and earlier material', items: [
  { title: 'Degrees of relationality', meta: '2026 · v12 · Benjamin P Taylor and Philip Boxer · preprint', description: 'The current, substantially updated paper.', url: '/library/files/preprints/2026-degrees-of-relationality-v12-taylor-boxer.pdf' },
  { title: 'The ladder of relationality in public service', meta: '2026 · earlier solo working paper', description: 'Retained as an earlier stage in the argument. An updated co-authored version is available above.', url: 'https://docs.google.com/document/d/1FewYqWndCJbjGYOlkWFZGBHxbs3AM4lA/edit?usp=sharing' },
  { title: 'The demand side of public services', meta: '2026 · v9 · Philip Boxer and Benjamin P Taylor · preprint', description: 'A companion account of the demand-side problem.', url: '/library/files/preprints/2026-the-demand-side-of-public-services-v9-boxer-taylor.pdf' },
  { title: 'Why do relational public services fail? ,  TRIP26', meta: '2026 · presentation', description: 'Conference presentation.', url: 'https://www.dropbox.com/scl/fi/2fupfdismqxnr5glp7l0i/2026-06-25-TRIP26-Benjamin-Taylor-why-do-relational-public-services-fail-v1.0BT.pdf?rlkey=bminwqzpruwghaukmsq0t86f6&dl=0' },
  { title: 'Collection of posts on relational public services', meta: '2026 · Chosen Path', description: 'A reading route through the related posts.', url: 'https://chosen-path.org/2026/03/21/collection-of-posts-on-relational-public-services/' },
] }] });

resourcePage({ slug: 'facilitation-and-systems-consulting', title: 'Facilitation and systems consulting', description: 'Helping from inside a system without pretending to stand outside it.', groups: [{ title: 'Material', items: [
  { title: 'Systemic consulting: rethinking the consultant’s role', meta: '2025 · SysPrac25 · SCiO public resource', description: 'Consulting as partnership, dialogue, and co-creation.', url: 'https://www.systemspractice.org/resources/systemic-consulting-rethinking-consultants-role-workshop-sysprac25' },
  { title: 'Systems consulting and facilitation ,  STSP26', meta: '2026 · conference presentation', description: 'A later conference presentation on systems consulting and facilitation.', url: 'https://www.dropbox.com/scl/fi/ca3lalnnjdkt06rx39nm6/2026-03-24-STSP26-systems-conulting-and-facilitation-Benjamin-P-Taylor.pdf?rlkey=u5txcu880d7ht4ceu8ognmu7z&dl=0' },
  { title: 'Metaphor', meta: '2021 · Niki Jobson and Benjamin P Taylor · SCiO', description: 'Metaphor, framing, and problem-setting.', url: 'https://www.systemspractice.org/resources/metaphor-presented-scio-development-event' },
  { title: 'The Peter Block community exercise', meta: 'Practice note', description: 'A short exercise on community and participation.', url: 'https://www.dropbox.com/scl/fi/pd58brghxfzi7hmcjpq5e/The-Peter-Block-community-exercise.pdf?rlkey=effn2ww7mw5jak96bg43zazga&dl=0' },
  { title: 'Large-group processes collection', meta: 'Interactive collection', description: 'Search and compare whole-system and participatory methods.', url: 'https://antlerboy.github.io/largegroupprocess/' },
] }] });

resourcePage({ slug: 'four-dynamics', title: 'Four dynamics and robust systems', description: 'Differentiation, homogenisation, individuation, and integration, and how their interplay shapes robust groups and organisations.', groups: [{ title: 'Material', items: [
  { title: 'Positive dynamics of differentiation and integration', meta: '2024 · ISSS presentation · corrected file', description: 'The full presentation on the four dynamics.', url: '/library/files/talks/positive-dynamics-differentiation-and-integration.pdf' },
  { title: 'Introduction to four dynamics', meta: '2023 · presentation', description: 'A shorter introduction to segmentation, blending, empowerment, and harmonisation.', url: '/library/files/talks/introduction-to-four-dynamics.pdf' },
  { title: 'Power, systems, and the Viable System Model', meta: '2023 · Metaphorum presentation', description: 'The four dynamics in relation to VSM, power, and human systems.', url: '/library/files/talks/power-systems-and-the-viable-system-model.pdf' },
] }] });

resourcePage({ slug: 'systems-leadership-change-practice', title: 'Systems leadership, change, and convening', description: 'Ways of seeing and acting across organisational boundaries, including systems convening.', groups: [{ title: 'Material', items: [
  { title: 'Systems leadership, change, theory and practice', meta: '2023 · presentation', description: 'A substantial public presentation bringing together the main argument.', url: '/library/files/talks/systems-leadership-change-theory-and-practice.pdf' },
  { title: 'Systems convening and boundary work', meta: '2025 · core slides', description: 'A compact route into convening and boundary work.', url: '/library/files/talks/systems-convening-and-boundaries.pdf' },
  { title: 'Spaces and leadership stands', meta: '2025 · working deck', description: 'Systemic position and possible leadership responses.', url: '/library/files/talks/spaces-and-leadership-stands.pdf' },
  { title: 'Systems leadership, change, theory and practice ,  SCiO', meta: 'SCiO public resource', description: 'The SCiO resource page and presentation.', url: 'https://www.systemspractice.org/resources/systems-leadership-change-theory-and-practice' },
] }] });

resourcePage({ slug: 'viable-system-model', title: 'Viable System Model', description: 'Practical routes into Stafford Beer’s Viable System Model and its use in organisations and public services.', groups: [{ title: 'Material', items: [
  { title: 'Viable System Model lecture', meta: '2025 · long-form teaching deck', description: 'A comprehensive introduction and teaching resource.', url: '/library/files/talks/viable-system-model-lecture.pdf' },
  { title: 'A simplification of the Viable System Model', meta: '2023 · four-slide introduction', description: 'A concise way into organisational viability.', url: '/library/files/talks/simplifying-the-viable-system-model.pdf' },
  { title: 'Power, systems, and the Viable System Model', meta: '2023 · Metaphorum presentation', description: 'VSM through the lenses of power and human systems dynamics.', url: '/library/files/talks/power-systems-and-the-viable-system-model.pdf' },
  { title: 'Systems Innovation London VSM workshop', meta: '2019 · with Patrick Hoverstadt', description: 'Workshop material co-delivered with Patrick Hoverstadt.', url: 'https://www.dropbox.com/scl/fi/nuzy6oofhmi2zoeu1a4jk/2019-09-03-Systems-Innovation-London-VSM-workshop.pdf?rlkey=u0orouifyc8yzwvgxqamq56ix&dl=0' },
] }] });

resourcePage({ slug: 'outcomes-and-complexity', title: 'Outcomes and complexity', description: 'Why outcomes arise from complex adaptive systems rather than being produced by individual services alone.', groups: [{ title: 'Material', items: [
  { title: 'Outcomes are the results of complex adaptive systems', meta: '2025 · presentation', description: 'A direct introduction to the argument and its public-service implications.', url: '/library/files/talks/outcomes-and-complex-adaptive-systems.pdf' },
  { title: 'Outcomes thinking, with Benjamin Taylor for LGE', meta: '2022 · video', description: 'A recorded introduction to outcomes thinking.', url: 'https://www.dropbox.com/scl/fi/0xfike9t4l078sg7r4r8z/Outcomes-thinking-with-Benjamin-Taylor-for-LGE.mp4?rlkey=sb9sybgi09gqqdcpe51iuk794&dl=0' },
] }] });

resourcePage({ slug: 'five-core-practices', title: 'Five core leadership practices', description: 'Intent, honest conversations, clarity, culture, and learning as practical disciplines of leadership.', groups: [{ title: 'Material', items: [
  { title: 'Clarity practices', meta: '2024 · presentation', description: 'An extended teaching deck on clarity and the five core practices.', url: '/library/files/talks/clarity-practices.pdf' },
  { title: 'Five core leadership practices ,  StretchCon', meta: '2022 · extended presentation', description: 'The five practices with reading recommendations.', url: 'https://www.dropbox.com/scl/fi/mumd3h20uux050a6noe7q/2022-11-28-Benjamin-Taylor-five-core-leadership-practices-for-Stretchcon-extended-with-reading-recommendations.pdf?rlkey=zc8jzlmbelk81jn1xxaw1y80c&dl=0' },
  { title: 'Five core leadership practices for LinkedIn', meta: '2021 · short visual account', description: 'A compact introduction.', url: 'https://www.dropbox.com/scl/fi/dojeq5hdnlcezbieuhn3c/Benjamin-Taylor-five-core-leadership-practices-for-linkedin.pdf?rlkey=bnv58vc15zll8rli72i7x8yhl&dl=0' },
] }] });

resourcePage({ slug: 'large-group-processes', title: 'Large-group processes', description: 'Whole-system and participatory methods, with a searchable collection and a detailed teaching deck.', groups: [{ title: 'Material', items: [
  { title: 'Large-group processes', meta: '2024 · SCiO presentation', description: 'The detailed public teaching deck.', url: '/library/files/talks/large-group-processes.pdf' },
  { title: 'Large-group processes microsite', meta: 'Interactive collection', description: 'Search and compare whole-system and participatory methods.', url: 'https://antlerboy.github.io/largegroupprocess/' },
  { title: 'Interrogate the large-group-process mentor', meta: 'ChatGPT mentor', description: 'Ask about method choice, process design, risks, and adaptation.', url: 'https://link.redquadrant.com/ChatGPTlargegroupprocessmentor' },
] }], note: 'The collection includes work by many authors and organisations. Attribution and the terms of the original sources apply.' });

resourcePage({ slug: 'productive-conversations', title: 'Productive conversations', description: 'Conversation as practical infrastructure for truth-seeking, shared understanding, commitment, and learning.', groups: [{ title: 'Material', items: [
  { title: 'Better conversations for better realities', meta: '2025 · presentation', description: 'Learning loops to break the devil’s bargain.', url: '/library/files/talks/better-conversations-for-better-realities.pdf' },
  { title: 'Productive conversations ,  SCiO', meta: '2024 · presentation', description: 'A practical session on honest, constructive conversations and shared learning.', url: 'https://www.dropbox.com/scl/fi/ztetuy2oydh3va0c4u5zm/2024-111-20-SCiO-Benjamin-P-Taylor-productive-conversations-v1.2.pdf?rlkey=69mwjlj2yyr6nc0hkl9aral3m&dl=0' },
  { title: 'The Left-Hand Column exercise', meta: '2021 · exercise', description: 'Noticing the gap between what is thought and what is said.', url: 'https://www.dropbox.com/scl/fi/pi2on6gywe0k61w9r3hp5/2021-02-17-RedQuadrant-the-Left-Hand-Column-exercise.pdf?rlkey=z542btrygdabkb2pdfpq2u9dr&dl=0' },
] }] });

resourcePage({ slug: 'public-service-transformation', title: 'Public-service transformation', description: 'Adaptive councils, commissioning, learning communities, and the wider practice of public-service transformation.', groups: [{ title: 'Material', items: [
  { title: 'Five key questions for transformation', meta: 'Working reference', description: 'A one-page prompt about purpose, system, activity, and learning.', url: '/library/files/talks/five-key-questions-for-transformation.pdf' },
  { title: 'The Adaptive Council model', meta: '2020 · PSTA and RedQuadrant', description: 'A model of adaptive public-service organisation.', url: 'https://www.dropbox.com/scl/fi/97ws4kurk5iie4cffefn8/2020-11-18-the-Public-Service-Transformation-Academy-and-Redquadrant-the-adaptive-council-model-v0.2BT.pdf?rlkey=nflc0i3ee2lgbdcrhrmqv58dx&dl=0' },
  { title: 'Public Service: State of Transformation', meta: '2018-2019 · five reports', description: 'The principal PSTA and RedQuadrant reports and surveys.', url: '/library/state-of-transformation/' },
] }] });

function catalogueBody(note, links = '', withSource = false) {
  return `<section class="section"><div class="wrap"><div class="note">${note}</div>${links}<div class="catalogue-controls"><label class="field field-wide"><span>Ask in keywords</span><input id="catalogue-query" class="search" type="search" placeholder="For example: relational public services, cybernetics, power"></label><label class="field"><span>Year</span><select id="catalogue-year"><option value="all">All years</option></select></label><label class="field"><span>Order</span><select id="catalogue-sort"><option value="relevance">Relevance</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>${withSource ? '<label class="field"><span>Source</span><select id="catalogue-source"><option value="all">All sources</option></select></label>' : ''}</div><div><p class="eyebrow">Try a theme</p><div id="catalogue-topics" class="topic-list"></div></div><p id="catalogue-status" class="count" aria-live="polite">Loading the catalogue…</p><div id="catalogue-results" class="catalogue-results"></div><div class="catalogue-actions"><button id="catalogue-more" class="button hidden" type="button">Show more</button><button id="catalogue-clear" class="button" type="button">Clear</button></div></div></section>`;
}

const searchScript = ['/library/chosen-path/catalogue.js'];
save('chosen-path', shell({ slug: 'chosen-path', title: 'Search Chosen Path', description: 'A keyword catalogue of the public essays and fragments on chosen-path.org.', eyebrow: 'Searchable writing archive', lead: 'Chosen Path is Benjamin P Taylor’s main blog: essays, arguments, working notes, and fragments on public services, systems, change, and practice.', body: catalogueBody('<strong>A search aid, not an oracle.</strong> This catalogue indexes public posts from Chosen Path. Older posts may no longer represent my view.', '<div class="actions"><a class="button primary" href="https://chosen-path.org/">Visit Chosen Path</a><a class="button" href="/library/syscoi/">Search SysCoi</a><a class="button" href="/library/search/">Search everything</a></div>'), scripts: searchScript }));
save('syscoi', shell({ slug: 'syscoi', title: 'Search the Systems Community of Inquiry', description: 'A keyword catalogue of public posts from the Systems Community of Inquiry.', eyebrow: 'Searchable systems weblog', lead: 'The Systems Community of Inquiry is a long-running shared weblog and link stream about systems, cybernetics, complexity, and related practice.', body: catalogueBody('<strong>A broad community record.</strong> SysCoi contains linked material from many authors and sources. Inclusion is not endorsement, and the original source and attribution remain decisive.', '<div class="actions"><a class="button primary" href="https://stream.syscoi.com/">Visit SysCoi</a><a class="button" href="/library/chosen-path/">Search Chosen Path</a><a class="button" href="/library/search/">Search everything</a></div>'), scripts: searchScript }));
save('catalogue', shell({ slug: 'catalogue', title: 'Search the public library', description: 'Search Benjamin P Taylor’s curated public library, including writing, talks, podcasts, tools, models, recordings, and reference material.', eyebrow: 'Curated catalogue', lead: 'Search the library itself, including papers, working papers, talks, podcasts, videos, tools, models, collections, and reference documents.', body: catalogueBody('<strong>The catalogue follows the public library.</strong> It searches titles, descriptions, formats, and themes. It does not search the full text inside every linked PDF or recording.', '<div class="actions"><a class="button" href="/library/chosen-path/">Search Chosen Path</a><a class="button" href="/library/syscoi/">Search SysCoi</a><a class="button primary" href="/library/search/">Search everything</a></div>'), scripts: searchScript }));
save('search', shell({ slug: 'search', title: 'Search all public work', description: 'Search the public library, Chosen Path, and the Systems Community of Inquiry together.', eyebrow: 'Combined catalogue', lead: 'One search across the curated public library, Chosen Path, and the Systems Community of Inquiry.', body: catalogueBody('<strong>Three different kinds of collection.</strong> The library is curated; Chosen Path is Benjamin’s writing archive; SysCoi is a much broader community link stream. Search results preserve those distinctions.', '<div class="actions"><a class="button" href="/library/catalogue/">Library only</a><a class="button" href="/library/chosen-path/">Chosen Path only</a><a class="button" href="/library/syscoi/">SysCoi only</a></div>', true), scripts: searchScript }));

console.log('Rebuilt the curated library pages.');

save('videos', shell({ slug: 'videos', title: 'Videos and recorded conversations', description: 'Recorded talks, interviews, and public sessions with Benjamin P Taylor.', eyebrow: 'Watch', body: cardSection('Interviews', '', readerRecordings.podcasts.filter(item => item.tags.includes('video') || item.video).map(item => ({...item, url:item.video || item.url})), {toolbar:true}) + cardSection('Public talks and sessions', '', readerRecordings.recordings, {alt:true}), scripts: ['/library/app.js'] }));
