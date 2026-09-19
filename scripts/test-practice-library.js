const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve('_site'),out=path.resolve('validation/practice-library');
fs.mkdirSync(out,{recursive:true});
const meta=JSON.parse(fs.readFileSync('content/systems-methods-practice.json','utf8'));
let browser,server;const report={status:'running',checks:[],base:process.env.LIBRARY_BASE_URL||'built site'};
async function main(){
 let base=process.env.LIBRARY_BASE_URL;
 if(!base){server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://test').pathname);try{if(!file.startsWith(root+path.sep)&&file!==root)throw Error('path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1365,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.DEPLOY_COMMIT){const response=await context.request.get(base+'/library/practice-publication.json');assert.equal(response.status(),200);assert.equal((await response.json()).commit,process.env.DEPLOY_COMMIT);report.checks.push('live deployment commit');}
 for(const width of [1365,390]){await page.setViewportSize({width,height:900});const response=await page.goto(base+'/library/systems-methods-practice/',{waitUntil:'networkidle'});assert.equal(response.status(),200);assert(await page.locator('.alpha-notice').isVisible());assert.equal(await page.locator('.practice-directory a').count(),26);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:path.join(out,'practice-library-'+width+'.png'),fullPage:true});}
 report.checks.push('all 26 case links','visible alpha and craft framing','desktop and mobile layout');
 for(const width of [1365,390]){
  await page.setViewportSize({width,height:900});
  const response=await page.goto(base+'/library/public-service-writing/',{waitUntil:'load'});assert.equal(response.status(),200);
  assert.equal(await page.locator('tbody tr').count(),11);
  assert.equal(await page.getByRole('columnheader',{name:'Access and review',exact:true}).count(),1);
  assert.equal(await page.locator('tbody tr').filter({hasText:'News report quoting Benjamin Taylor'}).count(),1);
  assert(await page.getByText('Public article read; quoted participant, not credited as author',{exact:true}).isVisible());
  const region=page.getByRole('region',{name:'Public-service bibliography'});await region.focus();
  assert(await region.evaluate(el=>document.activeElement===el));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.screenshot({path:path.join(out,'bibliography-'+width+'.png'),fullPage:true});
 }
 report.checks.push('bibliography credit and access notes; keyboard scroll region; desktop and mobile containment');
 const methods=JSON.parse(fs.readFileSync('content/large-group-methods.json','utf8'));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  const response=await page.goto(base+'/library/large-group-processes/',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  assert.equal(await page.locator('.method').count(),methods.count);
  const query=page.getByRole('searchbox',{name:'Find a method or model'}),visible=page.locator('.method:not([hidden])');
  await query.fill('cafe');assert.equal(await visible.count(),4,'Accent-insensitive individual café methods');
  await query.fill('no-such-method-zz');assert.equal(await visible.count(),0);assert(await page.locator('#method-empty').isVisible());
  await query.fill('Syntegration');assert.equal(await visible.count(),1);
  await visible.locator('summary').click();assert(await visible.getByRole('link',{name:'Large-group processes, Benjamin Taylor (2024)'}).isVisible());
  await page.getByRole('button',{name:'Reset search'}).click();assert.equal(await visible.count(),methods.count);
  await page.getByLabel('Collection',{exact:true}).selectOption('Overview');assert.equal(await visible.count(),methods.overview_count);
  await page.getByLabel('Complexity',{exact:true}).selectOption('Structural');
  await page.getByLabel('Purpose',{exact:true}).selectOption('Solutions design');assert.equal(await visible.count(),11);
  await page.getByRole('button',{name:'Reset search'}).click();assert.equal(await visible.count(),methods.count);
  assert(await query.evaluate(el=>document.activeElement===el),'Reset restores keyboard focus');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.screenshot({path:path.join(out,'large-group-'+width+'.png')});
 }
 report.checks.push('complete individual-method count, accents, empty-search recovery, independent filters, source links, keyboard reset, desktop and mobile layout');
 const plain=await browser.newContext({javaScriptEnabled:false});const plainPage=await plain.newPage();await plainPage.goto(base+'/library/large-group-processes/');assert.equal(await plainPage.locator('.method').count(),methods.count);await plain.close();
 for(const route of ['','publications/','talks-and-sessions/','systems-leadership-change-practice/','viable-system-model/','facilitation-and-systems-consulting/','visual-models/']){const response=await page.goto(base+'/library/'+route,{waitUntil:'load'});assert.equal(response.status(),200);assert.equal(await page.locator('#systems-methods-practice').count(),1);assert(await page.locator('#systems-methods-practice a[href="/library/systems-methods-practice/"]').count()>0);}
 report.checks.push('seven existing entry routes');
 for(const route of ['catalogue','search']){const response=await context.request.get(base+'/library/'+route+'/catalogue.json');assert.equal(response.status(),200);const catalogue=await response.json();const urls=new Set(catalogue.documents.map(x=>x.url));assert(urls.has('/library/systems-methods-practice/'));for(const lab of meta.labs)assert(urls.has(meta.url+lab.id+'/'),route+': '+lab.id);for(const suffix of ['', 'coverage/','resources/','worksheets/','answers/','tutor-notes/','downloads/systems-methods-practice.zip'])assert(urls.has(meta.url+suffix));}
 report.checks.push('collection and all 33 resources in local and global catalogues');
 await page.goto(base+'/library/search/',{waitUntil:'networkidle'});await page.locator('#catalogue-query').fill('systemic systems methods practice');await page.waitForSelector('a[href="/library/systems-methods-practice/"]',{timeout:15000});report.checks.push('reader search result');
 const nojs=await browser.newContext({javaScriptEnabled:false});const np=await nojs.newPage();await np.goto(base+'/library/systems-methods-practice/');assert.equal(await np.locator('.practice-directory a').count(),26);await nojs.close();report.checks.push('no-script directory');assert.equal(errors.length,0,JSON.stringify(errors));report.status='passed';
}
main().catch(e=>{report.status='failed';report.error=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));});
