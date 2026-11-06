const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const root = path.resolve(process.env.ESTATE_ROOT || '_site');
const out = path.resolve(process.env.ESTATE_REPORTS || 'validation/practice-library');
const data = require('../content/delphi-experiment.json');
fs.mkdirSync(out, { recursive: true });
let browserServer, server;
const report = { status: 'running', checks: [] };
async function main() {
  let base = process.env.LIBRARY_BASE_URL;
  if (!base) {
    server = http.createServer((req, res) => {
      let file = path.resolve(root, '.' + new URL(req.url, 'http://test').pathname);
      try {
        if (!file.startsWith(root + path.sep) && file !== root) throw Error('path');
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        res.setHeader('Content-Type', { '.html': 'text/html', '.css': 'text/css' }[path.extname(file)] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } catch { res.writeHead(404); res.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  }
  browserServer = await chromium.launchServer({ headless: true });
  const browser = await chromium.connect(browserServer.wsEndpoint());
  const context = await browser.newContext();
  const page = await context.newPage();
  await context.route('https://transduction.systems/events/**', route => route.abort());
  for (const width of [1365, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + '/', { waitUntil: 'load' });
    assert.equal(await page.locator('#delphi-experiment a[href="/delphi/"]').count(), 1);
    assert((await page.locator('#delphi-experiment').textContent()).includes('AI experiment'));
    const requests = [];
    const observe = request => requests.push(request.url());
    page.on('request', observe);
    await page.goto(base + '/delphi/', { waitUntil: 'networkidle' });
    page.off('request', observe);
    assert.equal(await page.locator('h1').innerText(), data.title);
    assert.equal(await page.locator('iframe,script,form,input,textarea').count(), 0);
    assert.equal(await page.locator('[data-delphi-link]').getAttribute('href'), data.url);
    assert((await page.locator('main').textContent()).includes(data.accessNote));
    const feedback = new URL(await page.locator('[data-delphi-feedback]').getAttribute('href'));
    assert.equal(feedback.protocol, 'mailto:');
    assert.equal(feedback.pathname, data.feedbackEmail);
    assert.equal(feedback.searchParams.get('subject'), data.feedbackSubject);
    assert.equal(feedback.searchParams.get('body'), data.feedbackBody);
    assert.equal(requests.filter(url => !url.startsWith(base + '/')).length, 0, JSON.stringify(requests));
    assert((await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).includes("connect-src 'none'"));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.screenshot({ path: path.join(out, 'delphi-' + width + '.png'), fullPage: true });
  }
  await context.close();
  report.checks = ['Homepage invitation labels the AI experiment', 'External chat is a visitor-chosen link with no embed or background requests', 'Feedback email preserves its recipient, subject, and comparison prompts', 'No script, form, or automatic sending', 'Desktop and mobile contain the text'];
  report.status = 'passed';
}
main().catch(error => { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(out, 'delphi-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (server) { server.closeAllConnections(); server.close(); }
  if (browserServer) {
    await Promise.race([browserServer.kill().catch(() => {}), new Promise(resolve => setTimeout(resolve, 5000))]);
    browserServer.process()?.kill('SIGKILL');
  }
  process.exit(process.exitCode || 0);
});
