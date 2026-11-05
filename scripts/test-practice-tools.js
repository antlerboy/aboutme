'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const model = require('../arms-lengthiness/model.js');
const root = path.resolve('_site');
const out = path.resolve('validation/practice-tools');
fs.mkdirSync(out, { recursive: true });
const report = { status: 'running', checks: [], base: process.env.TOOLS_BASE_URL || 'built site' };
let browser, server;

function routes(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? routes(file) : entry.name === 'index.html' ? [file] : [];
  });
}

async function main() {
  // Invalid or incomplete requirements must never be silently interpreted as zero.
  for (const scores of [[], Array(21), Array(21).fill(null), Array(20).fill(5), [...Array(20).fill(5), NaN], [...Array(20).fill(5), 11]]) {
    assert.equal(model.valid(scores), false);
    assert.deepEqual(model.rank(scores), []);
  }
  assert.equal(model.criteria.length, 21);
  assert.equal(model.profiles.length, 11);
  report.checks.push('21 criteria and 11 profiles; incomplete, sparse, and out-of-range requirements rejected');
  let base = process.env.TOOLS_BASE_URL;
  if (!base) {
    server = http.createServer((req, res) => {
      try {
        let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://test').pathname));
        if (!file.startsWith(root + path.sep)) throw Error('path');
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.pdf': 'application/pdf' };
        res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } catch (_) { res.writeHead(404); res.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (process.env.DEPLOY_COMMIT) {
    const response = await context.request.get(base + '/practice-tools-publication.json');
    assert.equal(response.status(), 200);
    assert.equal((await response.json()).commit, process.env.DEPLOY_COMMIT);
    report.checks.push('live deployment commit');
  }
  const routeRoot = process.env.TOOLS_BASE_URL ? process.cwd() : root;
  const pages = ['four-dynamics', 'arms-lengthiness'].flatMap(slug => routes(path.join(routeRoot, slug)));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const file of pages) {
      const route = '/' + path.relative(routeRoot, path.dirname(file)).split(path.sep).join('/') + '/';
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator('h1').count(), 1, route);
      assert.equal(await page.locator('nav [aria-current="page"]').count(), 1, route);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), route + ': mobile overflow');
      assert.equal(await page.locator('script[src*="analytics"]').count(), 0, route + ': no tool beacon');
      if (['/four-dynamics/', '/arms-lengthiness/'].includes(route)) {
        await page.screenshot({ path: path.join(out, route.split('/')[1] + '-' + width + '.png'), fullPage: true });
      }
    }
  }
  report.checks.push(pages.length + ' guide pages at desktop and mobile sizes; navigation, metadata, and overflow');
  for (const collection of ['catalogue', 'search']) {
    const response = await context.request.get(base + '/library/' + collection + '/catalogue.json');
    assert.equal(response.status(), 200);
    const urls = new Set((await response.json()).documents.map(item => item.url));
    for (const route of ['/four-dynamics/', '/four-dynamics/diagnose/', '/arms-lengthiness/', '/arms-lengthiness/tool/']) {
      assert(urls.has(route), collection + ': missing tool record ' + route);
    }
  }
  report.checks.push('both microsites and working tools appear in the library and global search catalogues');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/four-dynamics/diagnose/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Show prompts for action' }).click();
  assert((await page.locator('#diagnosis-results').innerText()).includes('Gather a recent example'));
  await page.locator('#segment-state').selectOption('high');
  await page.getByRole('button', { name: 'Show prompts for action' }).click();
  assert((await page.locator('#diagnosis-results').innerText()).includes('Add an event or observation'));
  await page.locator('#segment-evidence').fill('Teams rejected three handovers. <script>test</script>');
  await page.locator('#blend-state').selectOption('mixed');
  await page.locator('#blend-evidence').fill('Senior staff can share; new starters cannot.');
  await page.locator('#stop').fill('Stop if the routine becomes another approval gate.');
  await page.getByRole('button', { name: 'Show prompts for action' }).click();
  const prompts = await page.locator('#diagnosis-results').innerText();
  assert(prompts.includes('Direct:') && prompts.includes('Diagonal:') && prompts.includes('Vertical:'));
  assert(prompts.includes('Keep the difference visible.'));
  assert(prompts.includes('<script>test</script>'));
  assert.equal(await page.locator('#diagnosis-results script').count(), 0);
  await page.screenshot({ path: path.join(out, 'four-dynamics-prompts.png'), fullPage: true });
  const fourDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my notes' }).click();
  const fourNotes = fs.readFileSync(await (await fourDownload).path(), 'utf8');
  assert(fourNotes.includes('Teams rejected three handovers.') && fourNotes.includes('approval gate'));
  await page.getByRole('button', { name: 'Clear this page' }).click();
  assert(await page.locator('#diagnosis-results').isHidden());
  assert.equal(await page.locator('#segment-evidence').inputValue(), '');
  report.checks.push('four-dynamics uncertainty, evidence gate, relationship prompts, safe text, download, and reset');

  await page.goto(base + '/arms-lengthiness/tool/', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#score-fields input[type="number"]').count(), 21);
  assert.equal(await page.locator('#tool-results').isHidden(), true);
  const requests = [];
  page.on('request', req => requests.push({ method: req.method(), url: req.url() }));
  await page.getByText('Resume work or inspect an illustrative profile', { exact: true }).click();
  await page.locator('#load-profile').selectOption('contracting');
  await page.locator('#assessment-form button[type="submit"]').click();
  assert(await page.locator('#tool-results').isVisible());
  assert((await page.locator('#result-summary').innerText()).includes('Contracting variants'));
  assert((await page.locator('#ranking article').first().innerText()).includes('100.0%'));
  assert.equal(await page.locator('#ranking article').count(), 11);
  assert.equal(await page.locator('#comparison tbody tr').count(), 21);
  await page.locator('#compare-model').selectOption('mutual');
  assert((await page.locator('#comparison h3').innerText()).includes('mutual'));
  await page.locator('#service').fill('A generic service');
  // Recalculate after edits to ensure a saved record and visible results agree.
  await page.locator('#assessment-form button[type="submit"]').click();
  const jsonDownload = page.waitForEvent('download');
  await page.locator('#download-json').click();
  const downloaded = await jsonDownload;
  const assessmentPath = await downloaded.path();
  const saved = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));
  assert.equal(saved.tool, 'arms-lengthiness');
  assert.deepEqual(saved.scores, model.profiles.find(p => p.id === 'contracting').scores);
  assert.equal(saved.notes.service, 'A generic service');
  await page.locator('#grip').fill('4');
  assert(await page.locator('#tool-results').isHidden());
  await page.locator('#import-assessment').setInputFiles(assessmentPath);
  assert.equal(await page.locator('#grip').inputValue(), '3');
  await page.locator('#assessment-form button[type="submit"]').click();
  assert((await page.locator('#ranking article').first().innerText()).includes('100.0%'));
  await page.setViewportSize({ width: 390, height: 900 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await page.screenshot({ path: path.join(out, 'arms-lengthiness-results-mobile.png'), fullPage: true });
  await page.locator('#clear-assessment').click();
  assert(await page.locator('#tool-results').isHidden());
  assert.equal(await page.locator('#grip').inputValue(), '');
  assert.equal(requests.filter(req => !req.url.startsWith('blob:')).length, 0, 'Tool interactions must not send network requests');
  report.checks.push('delivery-model exact reference match, 11 rankings, 21 gaps, comparison, export/import, stale-result invalidation, mobile results, reset, and no network submission');
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const np = await nojs.newPage();
  for (const slug of ['four-dynamics', 'arms-lengthiness']) {
    await np.goto(base + '/' + slug + '/');
    assert(await np.locator('main').innerText());
    assert(await np.locator('nav a').count() >= 4);
  }
  await nojs.close();
  assert.deepEqual(errors, []);
  report.checks.push('no-script guide navigation; no browser JavaScript errors');
  report.status = 'passed';
}
main().catch(e => { report.status = 'failed'; report.error = e.stack; console.error(e); process.exitCode = 1; })
  .finally(async () => {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  });
