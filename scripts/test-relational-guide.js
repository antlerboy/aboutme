'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const assert = require('assert/strict');
const {chromium} = require('playwright');
const out = path.resolve('validation/relational');
const expectedHash = '34981a69cad81b153b59117e5b548877ba5edbc71c7fdf492bf6f5b33f96dc93';
const route = '/sysprac26/relational/';
const stem = '2026-10-08 RedQuadrant relational public services combined infographic v0.02 BT';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
let server, browser;
(async () => {
  fs.mkdirSync(out,{recursive:true});
  let base = process.env.RELATIONAL_BASE_URL;
  if (!base) {
    const root = path.resolve('_site');
    server = http.createServer((req,res) => {
      try {
        let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
        let filename = path.resolve(root,'.'+pathname);
        if (!filename.startsWith(root+path.sep) && filename!==root) throw Error('Invalid path');
        if (fs.statSync(filename).isDirectory()) filename=path.join(filename,'index.html');
        const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpeg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.json':'application/json'};
        res.setHeader('Content-Type',types[path.extname(filename)] || 'application/octet-stream');
        res.end(fs.readFileSync(filename));
      } catch(e) {res.statusCode=404;res.end('Not found');}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    base='http://127.0.0.1:'+server.address().port;
  }
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({acceptDownloads:true});
  const api=context.request;
  let manifest;
  for(let attempt=0;attempt<12;attempt++) {
    try {
      const response=await api.get(base+route+'publication.json?check='+Date.now(),{timeout:30000});
      assert.equal(response.status(),200);
      manifest=await response.json();
      if(process.env.DEPLOY_COMMIT) assert.equal(manifest.commit,process.env.DEPLOY_COMMIT);
      assert.equal(manifest.original_image_sha256,expectedHash);
      break;
    } catch(error) {
      if(attempt===11 || !process.env.RELATIONAL_BASE_URL) throw error;
      await sleep(10000);
    }
  }
  const original=await api.get(base+route+'trip26-original.jpeg');
  assert.equal(original.status(),200);
  assert.equal(hash(await original.body()),expectedHash,'Original TRIP26 bytes changed');
  const svg=await api.get(base+route+'ordinary-map.svg');
  assert.equal(svg.status(),200);
  const svgText=await svg.text();
  const embedded=svgText.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/);
  assert.ok(embedded,'Combined SVG does not contain the original image');
  assert.equal(hash(Buffer.from(embedded[1],'base64')),expectedHash);
  for(const ext of ['pdf','png']) {
    const asset=await api.get(base+route+encodeURIComponent(stem+'.'+ext));
    assert.equal(asset.status(),200,ext+' download missing');
    assert.ok((await asset.body()).length>10000);
  }
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.setViewportSize({width:1440,height:1000});
  const response=await page.goto(base+route,{waitUntil:'networkidle',timeout:60000});
  assert.equal(response.status(),200,'Canonical page is unavailable');
  await page.locator('h1').filter({hasText:'Making relational public services ordinary'}).waitFor();
  await page.locator('#steps button').first().waitFor();
  assert.equal(await page.locator('#steps button').count(),9);
  const image=page.locator('#visual img');
  await image.scrollIntoViewIfNeeded();
  assert.equal(await image.evaluate(el=>el.complete&&el.naturalWidth>0),true);
  await image.evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-80));
  await page.screenshot({path:path.join(out,'desktop-visual.png')});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(out,'desktop-top.png')});
  await page.locator('#load-example').click();
  const examplePurpose=await page.locator('#field-purpose').inputValue();
  assert.match(examplePurpose,/keep her job/i);
  assert.equal(await page.locator('#remember').isChecked(),false);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export-json').click();
  const download=await downloadPromise;
  assert.ok(!download.suggestedFilename().includes('%20'));
  const saved=path.join(out,'example-record.json');
  await download.saveAs(saved);
  const record=JSON.parse(fs.readFileSync(saved,'utf8'));
  assert.equal(record.schema,'redquadrant-relational-workbench');
  assert.equal(record.example,true);
  assert.equal(record.values.purpose,examplePurpose);
  await page.locator('#new-record').click();
  assert.equal(await page.locator('#field-purpose').inputValue(),'');
  await page.locator('#import-file').setInputFiles(saved);
  await page.waitForFunction(expected=>document.querySelector('#field-purpose').value===expected,examplePurpose);
  await page.locator('#steps button').last().click();
  assert.ok((await page.locator('#step-panel').innerText()).includes(examplePurpose));
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(out,'mobile-top.png')});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'Mobile overflow');
  assert.deepEqual(errors,[],'Browser runtime errors');
  const result={status:'passed',base,commit:manifest.commit,originalImageSHA256:expectedHash,checks:['canonical page returns 200','verified original embedded intact','SVG, PNG, and PDF downloads','desktop and mobile layout','nine-step tool','Asha example','export and import round trip','no browser runtime errors']};
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'failure.txt'),error.stack);console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
