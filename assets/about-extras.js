(() => {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const portrait = document.getElementById('portrait-shell');
  const branches = portrait ? [...portrait.querySelectorAll('.antler-branch')] : [];
  let antlerTimers = [];

  function clearAntlers() {
    antlerTimers.forEach(clearTimeout);
    antlerTimers = [];
    branches.forEach(branch => branch.classList.remove('visible'));
  }

  if (portrait && branches.length) {
    portrait.addEventListener('pointerenter', () => {
      clearAntlers();
      branches.forEach((branch, index) => {
        const delay = reduceMotion ? 2600 : 2600 + (index * 1450);
        antlerTimers.push(setTimeout(() => branch.classList.add('visible'), delay));
      });
    });
    portrait.addEventListener('pointerleave', clearAntlers);
    portrait.addEventListener('focusout', event => {
      if (!portrait.contains(event.relatedTarget)) clearAntlers();
    });
  }

  const bananaButton = document.getElementById('banana-button');
  const bananaDialog = document.getElementById('banana-dialog');
  if (bananaButton && bananaDialog) bananaButton.addEventListener('click', () => bananaDialog.showModal());

  const gallery = [
    { label: 'young Republican Congressman mode', src: 'assets/portraits/young-republican-congressman.svg' },
    { label: 'Poet mode', src: 'assets/portraits/poet.svg' },
    { label: 'Tired mode', src: 'assets/portraits/bbc-1.svg' },
    { label: 'earnest BBC report mode', src: 'assets/portraits/bbc-young.svg' },
    { label: 'earnest BBC report mode', src: 'assets/portraits/bbc-2.svg' },
    { label: 'AI-enhanced mode', src: 'assets/portraits/ai-enhanced.svg' },
    { label: 'Jaws mode', src: 'assets/portraits/tedx.svg' },
    { label: 'conference mode', src: 'assets/portraits/seminar.svg' },
    { label: 'conference mode', src: 'assets/portraits/conference-1.svg' },
    { label: 'workshop mode', src: 'assets/portraits/workshop.svg' },
    { label: 'TEDx mode', src: 'assets/portraits/jaws.svg' },
    { label: 'holiday mode', src: 'assets/portraits/holiday.svg' },
    { label: 'seminar mode', src: 'assets/portraits/conference-2.svg' },
    { label: 'psychedelic mode', src: 'assets/portraits/psychedelic.svg' },
    { label: 'Unprofessionalism mode', src: 'assets/portraits/unprofessionalism.svg', href: 'https://podcasts.apple.com/jp/podcast/unprofessionalism/id1456264052' }
  ];

  const galleryDialog = document.getElementById('gallery-dialog');
  const galleryOpen = document.getElementById('portrait-button');
  const galleryImage = document.getElementById('gallery-image');
  const galleryTitle = document.getElementById('gallery-title');
  const galleryLink = document.getElementById('gallery-link');
  const galleryImageButton = document.getElementById('gallery-image-button');
  let lastPortrait = -1;

  function randomIndex(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const bucket = new Uint32Array(1);
      window.crypto.getRandomValues(bucket);
      return bucket[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function renderRandomPortrait() {
    let next = randomIndex(gallery.length);
    if (gallery.length > 1 && next === lastPortrait) next = (next + 1) % gallery.length;
    lastPortrait = next;
    const item = gallery[next];
    galleryImage.src = item.src;
    galleryImage.alt = `Benjamin P Taylor; ${item.label}`;
    galleryTitle.textContent = item.label;
    if (item.href) {
      galleryLink.href = item.href;
      galleryLink.classList.add('visible');
      galleryLink.textContent = 'Listen to the Unprofessionalism episode';
    } else {
      galleryLink.removeAttribute('href');
      galleryLink.classList.remove('visible');
      galleryLink.textContent = '';
    }
  }

  if (galleryImageButton) {
    galleryImageButton.disabled = true;
    galleryImageButton.setAttribute('aria-label', 'Random Benjamin portrait');
  }

  if (galleryOpen && galleryDialog) {
    galleryOpen.setAttribute('aria-label', 'Open a random Benjamin portrait');
    galleryOpen.addEventListener('click', () => {
      renderRandomPortrait();
      galleryDialog.showModal();
    });
  }

  const rabbitItems = [
    { type: 'old essay', title: 'Why I was wrong to call John Seddon ‘you old bastard’', note: 'An old argument about systems thinking, practice, disagreement, and being less impressed by one’s own certainty.', href: 'https://medium.com/@antlerboy/why-i-was-wrong-to-call-john-seddon-you-old-bastard-even-though-he-probably-deserved-it-1e80989c9eff' },
    { type: 'old essay', title: 'Meta-contextuality, Bongard games, systems thinking, consultancy, transformation', note: 'Pattern recognition, context, and the difficulty of transferring a practice without flattening what made it work.', href: 'https://medium.com/@antlerboy/meta-contextuality-bongard-games-systems-thinking-consultancy-transformation-226b6b4341dc' },
    { type: 'organisation oddity', title: 'The pinball organisation', note: 'What signposting and referral can feel like when the organisation optimises the hand-off rather than the help.', href: 'https://www.linkedin.com/posts/antlerboy_the-pinball-organisation-doing-the-wrong-activity-6878604568263974912-Urc1' },
    { type: 'organisational force field', title: 'The Force in organisational life', note: 'An attempt to name something that is obvious when you feel it and surprisingly difficult to describe.', href: 'https://www.linkedin.com/posts/antlerboy_the-force-in-organisational-life-the-story-activity-6704281264242860033-sQi5' },
    { type: 'recording rescued from history', title: 'Ackoff at Bell Labs; the “tape”', note: 'Russell Ackoff in full flow. One of those things worth finding before the link disappears again.', href: 'https://www.linkedin.com/posts/antlerboy_tape-of-ackoffs-bell-lab-lecture-activity-6837624850144735232-iIkr/' },
    { type: 'syscoi rabbit hole', title: 'Growing an economy of death', note: 'Death, organisations, economic assumptions, and the things systems quietly optimise for.', href: 'https://stream.syscoi.com/2024/02/05/growing-an-economy-of-death/' },
    { type: 'archive', title: 'Years of SCiO systems practice resources', note: 'A large, uneven, excellent pile of talks, papers, methods, and people. Deliberately not curated down to ten favourites.', href: 'https://www.systemspractice.org/resources' },
    { type: 'reading list', title: 'systems | complexity | cybernetics reading', note: 'A broad working list, including things I agree with, things I don’t, classics, peculiarities, and useful starting points.', href: 'https://link.redquadrant.com/systemscomplexitycyberneticsreading' },
    { type: 'living atlas', title: 'The Necessary Tangle', note: 'People, traditions, practices, lineages, methods, and the many different kinds of relation between them.', href: 'https://antlerboy.github.io/the-necessary-tangle/' },
    { type: 'ridiculous', title: 'Accredited systems thinker: £500 and a three-day open-book exam', note: 'A serious contribution to the professionalisation of systems thinking. Published on 1 April.', href: 'https://www.linkedin.com/posts/antlerboy_systemsthinking-personaldevelopment-leadership-activity-7312753090766557184-hESh' },
    { type: 'workshop object', title: 'The human knot', note: 'A silly physical exercise that can become a surprisingly useful way of noticing what groups do under constraint.', href: 'https://www.linkedin.com/posts/antlerboy_wikihow-hilarious-and-excellent-illustrations-activity-6826053924018094080-1pKB' },
    { type: 'small system in the wild', title: 'Desire paths', note: 'A path, a broken arm, a threat to sue, and the gap between an official answer and what people are actually doing.', href: 'https://www.linkedin.com/posts/antlerboy_desire-paths-and-responses-to-them-activity-6853215754695901184-LkpZ' },
    { type: 'diagram', title: 'Rich pictures', note: 'A page about drawing the situation before pretending to know what the problem is.', href: 'https://www.redquadrant.com/designrichpictures' },
    { type: 'conference recording', title: 'Complexity Live', note: 'A longer conversation about complexity, systems, and public service transformation.', href: 'https://www.youtube.com/watch?v=Cyt5BpLeC1A' },
    { type: 'unfinished idea', title: 'Hierarchy is toxic in the same way that purpose is toxic', note: 'There are easily-accessed toxic versions of hierarchy, purpose, passion, and care. They do real harm. There are constructive versions too, and they require effort, focus, and vigilance.' },
    { type: 'unfinished idea', title: 'Marketing is an unbounded problem', note: 'Authentic white salmon. Elvis’ fainting fans. Politics. Cybersecurity. The boundaries of the problem move when you act on it.' }
  ];

  const rabbitButton = document.getElementById('rabbit-button');
  const rabbitType = document.getElementById('rabbit-type');
  const rabbitTitle = document.getElementById('rabbit-title');
  const rabbitNote = document.getElementById('rabbit-note');
  const rabbitOpen = document.getElementById('rabbit-open');
  const rabbitHeading = rabbitButton ? rabbitButton.closest('section')?.querySelector('h2.section-title') : null;
  let lastRabbit = -1;

  function surprise() {
    let next = randomIndex(rabbitItems.length);
    if (rabbitItems.length > 1 && next === lastRabbit) next = (next + 1) % rabbitItems.length;
    lastRabbit = next;
    const item = rabbitItems[next];
    rabbitType.textContent = item.type;
    rabbitTitle.textContent = item.title;
    rabbitNote.textContent = item.note;
    if (item.href) {
      rabbitOpen.href = item.href;
      rabbitOpen.classList.add('visible');
    } else {
      rabbitOpen.removeAttribute('href');
      rabbitOpen.classList.remove('visible');
    }
  }

  if (rabbitButton) {
    rabbitButton.addEventListener('click', surprise);
    surprise();
  }

  if (rabbitHeading) {
    rabbitHeading.setAttribute('role', 'button');
    rabbitHeading.setAttribute('tabindex', '0');
    rabbitHeading.setAttribute('aria-label', 'Show me another unexpected thing');
    rabbitHeading.setAttribute('title', 'Click for another unexpected thing');
    rabbitHeading.style.cursor = 'pointer';
    rabbitHeading.addEventListener('click', surprise);
    rabbitHeading.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        surprise();
      }
    });
  }

  document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  });
})();
