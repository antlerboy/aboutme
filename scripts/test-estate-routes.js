const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const root = path.resolve(process.env.ESTATE_ROOT || '_site');
const catalogueRoot = process.env.ESTATE_CATALOGUES ? path.resolve(process.env.ESTATE_CATALOGUES) : null;
const out = path.resolve(process.env.ESTATE_REPORTS || 'validation/practice-library');
fs.mkdirSync(out, { recursive: true });
let browser, server;
const report = { status: 'running', checks: [] };
async function main() {
  let base = process.env.LIBRARY_BASE_URL;
  if (!base) {
    server = http.createServer((req, res) => {
      const route = new URL(req.url, 'http://test').pathname;
      let file = path.resolve(root, '.' + route);
      try {
        if (!file.startsWith(root + path.sep) && file !== root) throw Error('path');
        if (catalogueRoot && /^\/library\/[^/]+\/catalogue\.json$/.test(route)) file = path.join(catalogueRoot, route.split('/')[2], 'catalogue.json');
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        const type = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css' };
        res.setHeader('Content-Type', type[path.extname(file)] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.join(root, '404.html')));
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1365, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + '/library/use/', { waitUntil: 'load' });
    assert.equal(await page.locator('[data-route]').count(), 6);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    const route = page.locator('[data-route="difficult-conversation"]');
    await route.locator('summary').click();
    await route.locator('textarea').fill('A private working note: <not submitted>.');
    const [download] = await Promise.all([page.waitForEvent('download'), route.getByRole('button', { name: 'Download your note' }).click()]);
    assert.equal(download.suggestedFilename(), 'difficult-conversation-working-note.txt');
    const downloadPath = await download.path();
    assert(fs.readFileSync(downloadPath, 'utf8').includes('A private working note: <not submitted>.'));
    await page.reload({ waitUntil: 'load' });
    assert(!(await route.locator('textarea').inputValue()).includes('A private working note'));
    await page.screenshot({ path: path.join(out, 'practical-routes-' + width + '.png'), fullPage: true });
  }
  report.checks.push('six routes; desktop and mobile containment; editable local note downloads; notes not retained after reload');
  const params = new URLSearchParams({ q: 'relational public services', source: 'library', topic: 'public-services', match: 'all', sort: 'relevance' });
  await page.goto(base + '/library/search/?' + params, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('#catalogue-status').textContent.includes('Loading'));
  assert.equal(await page.locator('#catalogue-query').inputValue(), 'relational public services');
  assert.equal(await page.locator('#catalogue-source').inputValue(), 'library');
  assert.equal(await page.locator('#catalogue-match').inputValue(), 'all');
  assert(await page.locator('.catalogue-result').count() > 0);
  assert(await page.locator('.source-badge').first().innerText().then(text => text.includes('Curated library entry')));
  assert.equal(await page.locator('#catalogue-link').getAttribute('href'), page.url());
  await page.locator('#catalogue-query').fill('relational xzz-no-matching-token');
  assert.equal(await page.locator('.catalogue-result').count(), 0);
  await page.locator('#catalogue-match').selectOption('any');
  assert(await page.locator('.catalogue-result').count() > 0);
  const shared = page.url();
  await page.goto(shared, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#catalogue-match').inputValue(), 'any');
  assert.equal(await page.locator('#catalogue-query').inputValue(), 'relational xzz-no-matching-token');
  await page.locator('#catalogue-clear').click();
  assert.equal(await page.locator('#catalogue-query').inputValue(), '');
  assert.equal(new URL(page.url()).search, '');
  assert(await page.locator('#catalogue-query').evaluate(el => el === document.activeElement));
  await page.goto(base + '/library/search/?q=%3Cscript%3E&year=invalid&source=invalid&topic=invalid', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#catalogue-year').inputValue(), 'all');
  assert.equal(await page.locator('#catalogue-source').inputValue(), 'all');
  assert.equal(await page.locator('script:not([src])').count(), 0);
  report.checks.push('shared query and filter restoration; source/type labels; all/any matching; reset and focus; invalid filters and escaped input');
  for (const width of [1365, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const missing = '/library/relational-public-services-zz-moved.html?token=private-query#private-fragment';
    const response = page.url() === base + missing
      ? await page.reload({ waitUntil: 'networkidle' })
      : await page.goto(base + missing, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 404);
    assert.equal(await page.locator('h1').innerText(), 'Not here.');
    assert.equal(await page.locator('[data-missing-page]').innerText(), missing.split('?')[0]);
    assert.equal(await page.locator('#catalogue-query').inputValue(), 'relational public services zz moved');
    assert.equal(await page.locator('#catalogue-match').inputValue(), 'any');
    assert(await page.locator('.catalogue-result').count() > 0);
    assert.equal(page.url(), base + missing, 'The missing URL remains visible');
    const searchLink = new URL(await page.locator('#catalogue-link').getAttribute('href'));
    assert.equal(searchLink.pathname, '/library/search/');
    assert.equal(searchLink.searchParams.get('q'), 'relational public services zz moved');
    assert(!searchLink.href.includes('private-'), 'Do not carry query strings or fragments into search');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.locator('#catalogue-query').fill('cybernetics');
    await page.locator('#catalogue-query').press('Enter');
    assert(await page.locator('.catalogue-result').count() > 0);
    assert.equal(page.url(), base + missing);
    await page.screenshot({ path: path.join(out, 'missing-page-' + width + '.png'), fullPage: true });
  }
  await page.goto(base + '/library/relational%20public_services/index.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#catalogue-query').inputValue(), 'relational public services');
  assert(await page.locator('.catalogue-result').count() > 0);
  // Hosting layers may reject malformed or HTML-like addresses before serving 404.html.
  if (server) {
    await page.goto(base + '/relational%20public_services%ZZ.html', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#catalogue-query').inputValue(), 'relational%20public services%ZZ');
    await page.goto(base + '/%3Cimg%20src=x%20onerror=alert(1)%3E.html', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-missing-page] img').count(), 0);
    assert.equal(await page.locator('[data-missing-page]').innerText(), '/%3Cimg%20src=x%20onerror=alert(1)%3E.html');
  }
  await page.goto(base + '/404.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#catalogue-query').inputValue(), '');
  assert(await page.getByText('Enter a word or phrase to search, or browse the', { exact: false }).isVisible());
  report.checks.push('real nested 404 retains missing path and automatically searches; editable keyboard search; desktop/mobile; encoded and malformed paths; no query/fragment leakage or HTML injection; direct 404 recovery');
  await page.goto(base + '/library/search/?q=relational', { waitUntil: 'networkidle' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await page.screenshot({ path: path.join(out, 'shared-search-mobile.png'), fullPage: true });
  const record = JSON.parse(fs.readFileSync('content/leading-transformation.json', 'utf8'));
  await page.goto(base + '/toolshed/', { waitUntil: 'load' });
  assert.equal(await page.locator('#curriculum li').count(), 24);
  assert.equal(await page.locator('meta[name="programme-record-version"]').getAttribute('content'), record.version);
  for (const module of record.modules) assert.equal(await page.getByRole('heading', { name: module.title, exact: true, includeHidden: true }).count(), 1);
  await page.locator('#curriculum summary').first().click();
  assert(await page.getByRole('heading', { name: record.modules[0].title, exact: true }).isVisible());
  assert.equal(await page.getByRole('link', { name: 'Explore Leading Transformation through the PSTA' }).getAttribute('href'), record.routes.psta.url);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await page.screenshot({ path: path.join(out, 'toolshed-mobile.png'), fullPage: true });
  report.checks.push('24 current module titles; programme source version and the PSTA route; mobile curriculum layout');
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await nojs.newPage();
  await plain.goto(base + '/library/use/');
  assert.equal(await plain.locator('[data-route]').count(), 6);
  await plain.goto(base + '/library/search/');
  assert(await plain.locator('noscript').isVisible());
  await plain.goto(base + '/missing-without-javascript/');
  assert.equal(await plain.locator('h1').innerText(), 'Not here.');
  assert(await plain.locator('noscript').isVisible());
  assert.equal(await plain.locator('a[href="/"]').count(), 3);
  await nojs.close();
  report.checks.push('routes and source links usable without JavaScript');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await context.close();
  report.status = 'passed';
}
main().catch(error => { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(out, 'estate-routes-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (browser) await browser.close();
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
