(function(){
  'use strict';
  const M=window.ArmsLengthModel;
  const P=window.ArmsLengthPresentation;
  const $=s=>document.querySelector(s);
  const form=$('#assessment-form');
  if(!form||!M||!P)return;
  const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const fields=$('#score-fields');
  let lastGroup='',set,latest=null;
  M.criteria.forEach((c,i)=>{
    if(c.group!==lastGroup){set=make('fieldset');set.append(make('legend',c.group));fields.append(set);lastGroup=c.group;}
    const row=make('div',undefined,'criterion');
    const label=make('label',(i+1)+'. '+c.label);label.htmlFor=c.id;row.append(label,make('p',c.prompt));
    const line=make('div',undefined,'score-line');
    const range=make('input');Object.assign(range,{type:'range',min:'0',max:'10',step:'1',value:'5'});range.setAttribute('aria-label',c.label+' slider; move to choose a score');
    range.setAttribute('aria-describedby',c.id+'-ends');
    const number=make('input');Object.assign(number,{type:'number',id:c.id,name:c.id,min:'0',max:'10',step:'1',required:true});number.setAttribute('aria-describedby',c.id+'-ends');number.setAttribute('aria-label',c.label+' score, 0 to 10');
    line.append(range,number);row.append(line);
    const ends=make('div',undefined,'endpoints');ends.id=c.id+'-ends';ends.append(make('span','0 — '+c.low),make('span','10 — '+c.high));row.append(ends);
    const state=make('p','No score chosen','score-value');state.id=c.id+'-state';row.append(state);
    range.addEventListener('input',()=>{number.value=range.value;state.textContent='Chosen score: '+range.value;invalidate();});
    number.addEventListener('input',()=>{if(number.value!==''&&number.validity.valid)range.value=number.value;state.textContent=number.value===''?'No score chosen':'Chosen score: '+number.value;invalidate();});
    set.append(row);
  });
  function scores(){return M.criteria.map(c=>$('#'+c.id).value===''?null:$('#'+c.id).valueAsNumber);}
  function invalidate(){latest=null;$('#tool-results').hidden=true;$('#progress').textContent=M.criteria.filter(c=>$('#'+c.id).value!==''&&$('#'+c.id).validity.valid).length+' of 21 scores chosen. Calculate when ready.';}
  function record(){const notes={},readiness={};document.querySelectorAll('[data-note]').forEach(e=>notes[e.id]=e.value);form.querySelectorAll('[data-readiness]').forEach(e=>readiness[e.id]=e.value);return {tool:'arms-lengthiness',version:M.version,date:new Date().toISOString(),scores:scores(),notes,readiness};}
  function printRecord(){const out=$('#print-record');out.replaceChildren(make('h3','Your assessment'));const labels={service:'Service or purpose being considered',purpose:'Purpose and service boundary',constraints:'Requirements that cannot be traded away',evidence:'Reasons and evidence',assumptions:'Assumptions and uncertainties',dissent:'Disagreements and views still missing',decision:'Decision and reasons',nextstep:'Next action, owner, and review date'};Object.entries(labels).forEach(([id,label])=>out.append(make('h4',label),make('p',record().notes[id]?.trim()||'Not recorded')));out.append(make('h4','Capability and feasibility'));form.querySelectorAll('[data-readiness]').forEach(e=>out.append(make('p',e.dataset.readiness+': '+e.options[e.selectedIndex].textContent)));}
  document.addEventListener('input',e=>{if(e.target.hasAttribute('data-note'))printRecord();});
  form.querySelectorAll('[data-readiness]').forEach(e=>e.addEventListener('change',invalidate));
  function table(headers,rows){const wrap=make('div',undefined,'table-wrap');const t=make('table');const head=make('thead');const tr=make('tr');headers.forEach(h=>{const th=make('th',h);th.scope='col';tr.append(th);});head.append(tr);t.append(head);const b=make('tbody');rows.forEach(row=>{const r=make('tr');row.forEach((v,i)=>{const cell=make(i===0?'th':'td',String(v));if(i===0)cell.scope='row';r.append(cell);});b.append(r);});t.append(b);wrap.append(t);return wrap;}
  function renderComparison(id){const p=latest.find(p=>p.id===id);const out=$('#comparison');out.replaceChildren(make('h3','Where your requirements differ from '+p.name.toLowerCase()));out.append(table(['Criterion','Your score','Model profile','Gap'],p.gaps.map(g=>[g.criterion.label,g.desired,g.profile,g.gap>5?g.gap+' — examine':g.gap])));}
  form.addEventListener('submit',e=>{
    e.preventDefault();if(!form.reportValidity())return;
    latest=M.rank(scores());if(!latest.length)return;
    const output=$('#ranking');output.replaceChildren();
    const best=latest[0];const leaders=latest.filter(p=>Math.abs(p.fit-best.fit)<1e-9);
    $('#result-summary').textContent=leaders.length>1?'Equal closest profiles: '+leaders.map(p=>p.name).join(', ')+'.':best.name+' is the closest of the 11 profiles to these requirements.';
    latest.forEach(p=>{
      const card=make('article',undefined,'result');const h=make('div',undefined,'result-head');const title=make('h3');const link=make('a',p.rank+'. '+p.name);link.href='/arms-lengthiness/models/#'+p.id;title.append(link);h.append(title,make('span',p.fit.toFixed(1)+'% relative fit','fit'));card.append(h);
      const bar=make('div',undefined,'fit-bar');bar.setAttribute('aria-hidden','true');const fill=make('span');fill.style.width=p.fit+'%';bar.append(fill);card.append(bar);
      const big=p.gaps.filter(g=>g.gap>5);card.append(make('p',big.length?big.length+' gap'+(big.length===1?'':'s')+' above five points: '+big.map(g=>g.criterion.label+' ('+g.gap+')').join(', ')+'.':'No individual gap exceeds five points. Smaller gaps can still rule this option out.'));
      output.append(card);
    });
    const select=$('#compare-model');select.replaceChildren();latest.forEach(p=>{const o=make('option',p.name);o.value=p.id;select.append(o);});renderComparison(best.id);
    const readiness=Array.from(form.querySelectorAll('[data-readiness]'));const unfinished=readiness.filter(e=>e.value!=='ready');
    $('#readiness-result').textContent=unfinished.length?'Capability still needs examination: '+unfinished.map(e=>e.dataset.readiness).join(', ')+'. A close profile does not resolve these gaps.':'You have marked all four capability areas ready. Record the evidence and test it with those who will carry the responsibility.';
    let trials=0,changes=0;const touched=new Set();const initial=leaders.map(p=>p.id).sort().join('|');
    scores().forEach((v,i)=>{[-1,1].forEach(d=>{if(v+d<0||v+d>10)return;const trial=scores();trial[i]=v+d;const r=M.rank(trial);const top=r.filter(p=>Math.abs(p.fit-r[0].fit)<1e-9).map(p=>p.id).sort().join('|');trials++;if(top!==initial){changes++;touched.add(M.criteria[i].label);}});});
    $('#sensitivity').textContent='Changing one score by one point changes the leading profile or tie in '+changes+' of '+trials+' possible changes.'+(touched.size?' Revisit uncertain judgements about '+Array.from(touched).join(', ')+'.':' This only tests small changes to one score at a time; it does not establish that the choice is sound.');
    $('#heatmap').innerHTML=P.heatmap(M.criteria,scores(),latest);
    printRecord();
    $('#tool-results').hidden=false;$('#result-heading').focus();$('#progress').textContent='Calculated from all 21 scores. Edits to scores will clear this result.';
  });
  $('#compare-model').addEventListener('change',e=>renderComparison(e.target.value));
  function download(name,type,body){const blob=new Blob([body],{type});const a=make('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  $('#download-json').addEventListener('click',()=>download('arms-lengthiness-assessment.json','application/json',JSON.stringify(record(),null,2)));
  function csv(v){let s=String(v??'');if(/^[\t\r\n ]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
  $('#download-csv').addEventListener('click',()=>{
    const r=record();const lines=[['Arms-lengthiness assessment','Version '+M.version],['Relative fit','100 × (1 − sum of absolute score differences / 210)'],['Weights','All 21 criteria have equal weight'],[],['Criterion','Your requirement','0 means','10 means'],...M.criteria.map((c,i)=>[c.label,r.scores[i],c.low,c.high]),[],['Model family','Relative fit (%)','Gaps above five points'],...(M.rank(r.scores).map(p=>[p.name,p.fit.toFixed(1),p.gaps.filter(g=>g.gap>5).map(g=>g.criterion.label+': '+g.gap).join('; ')])),[],['Capability and feasibility'],...Object.entries(r.readiness),[],['Assessment notes'],...Object.entries(r.notes)];download('arms-lengthiness-assessment.csv','text/csv;charset=utf-8','\uFEFF'+lines.map(row=>row.map(csv).join(',')).join('\r\n'));
  });
  $('#print-assessment').addEventListener('click',()=>{printRecord();window.print();});
  $('#download-summary').addEventListener('click',()=>{
    if(!latest)return;
    const r=record(),readiness=Array.from(form.querySelectorAll('[data-readiness]')).map(e=>({label:e.dataset.readiness,value:e.options[e.selectedIndex].textContent}));
    download(r.date.slice(0,10)+' Arms-lengthiness decision summary v1.1 BT.html','text/html;charset=utf-8',P.report(r,M.criteria,latest,readiness,$('#sensitivity').textContent));
  });
  $('#clear-assessment').addEventListener('click',()=>{form.reset();M.criteria.forEach(c=>{$('#'+c.id).value='';$('#'+c.id+'-state').textContent='No score chosen';});invalidate();$('#service').focus();});
  $('#import-assessment').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>1000000)throw Error('This file is too large.');const r=JSON.parse(await file.text());if(!r||typeof r!=='object'||r.tool!=='arms-lengthiness'||r.version!==M.version||!Array.isArray(r.scores)||r.scores.length!==21||r.scores.some(v=>v!==null&&(typeof v!=='number'||!Number.isInteger(v)||v<0||v>10)))throw Error('The file is not a compatible assessment.');M.criteria.forEach((c,i)=>{const el=$('#'+c.id);el.value=r.scores[i]===null?'':r.scores[i];el.dispatchEvent(new Event('input'));});document.querySelectorAll('[data-note]').forEach(el=>el.value=typeof r.notes?.[el.id]==='string'?r.notes[el.id].slice(0,20000):'');form.querySelectorAll('[data-readiness]').forEach(el=>el.value=['unknown','develop','ready'].includes(r.readiness?.[el.id])?r.readiness[el.id]:'unknown');invalidate();printRecord();$('#file-status').textContent='Assessment loaded. Check the scores, then calculate.';}catch(err){$('#file-status').textContent=err.message||'The file could not be read.';}finally{e.target.value='';}
  });
  $('#load-profile').addEventListener('change',e=>{const p=M.profiles.find(p=>p.id===e.target.value);if(!p)return;M.criteria.forEach((c,i)=>{const el=$('#'+c.id);el.value=p.scores[i];el.dispatchEvent(new Event('input'));});$('#file-status').textContent='Loaded the '+p.name.toLowerCase()+' reference profile. These are illustrative model scores, not an assessment of your service.';e.target.value='';});
  invalidate();
}());
