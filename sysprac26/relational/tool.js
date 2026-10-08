'use strict';
(() => {
  const STORAGE = 'rq-relational-workbench-v1';
  const SCHEMA = 'redquadrant-relational-workbench';
  const MAX = 12000;
  const steps = [
    {name:'The person', title:'What is this person trying to make possible?', output:'One anonymised account in the person\'s terms.', note:'Start with their purpose, not the service you happen to provide. A short account is enough. Don\'t add a diagnosis, infer a motive, or enter identifying details.', fields:[
      ['title','A short anonymous title','For example: repair appointments and working hours','input'],
      ['purpose','The person\'s account','Use their words where available. Separate a direct account from your interpretation.']
    ]},
    {name:'The route',title:'How does the situation become an organisational decision?',output:'One route from contact to the next encounter.',note:'Follow the same situation throughout. These stages are prompts, not a prescribed sequence. Record repeated or parallel stages in the relevant field. Write unknown where you cannot establish a connection.', fields:[
      ['contact','Contact','Where, when, and through which channel does the person ask for help?'],
      ['account','Account received','What does the worker or service actually hear?'],
      ['response','Response','What action, advice, assessment, or referral follows?'],
      ['record','Record','What is entered into the record, and what is not?'],
      ['measure','Measure','What counts as success in the report or dashboard?'],
      ['decision','Decision','What decision follows from this account of success?'],
      ['nextContact','Next encounter','What is known about the next encounter? Mark a prediction as a prediction.']
    ]},
    {name:'The loss',title:'Where is something necessary for a useful response lost?',output:'One consequential loss, with the burden it creates.',note:'Choose one point on the route. This is more specific than saying that services do not communicate. Name what is lost and why a response would be different if it remained visible.',fields:[
      ['lost','The consequential loss','Name the translation or decision and the missing part of the person\'s account.'],
      ['integration','Who carries the joining-up work?','Record the additional chasing, explaining, waiting, coordination, or risk. Distinguish evidence from a plausible inference.']
    ]},
    {name:'The decision',title:'Who can change the response at that point?',output:'A decision-owning role, with the status of its authority.',note:'Responsibility, expertise, and authority are not the same. Name a role rather than a person. A workshop cannot grant permission on behalf of an absent organisation.',fields:[
      ['decisionRole','Role with decision authority','Use unknown rather than guessing who can approve the change.','input'],
      ['decisionChange','The decision that needs to change','Next time, this role must be able to change...'],
      ['permission','Status of permission','Proposed does not mean authorised.','select',['Unknown','Proposed; not yet agreed','Agreed within stated limits','Not available']]
    ]},
    {name:'The constraint',title:'What prevents that decision from changing?',output:'One governing condition and the roles needed to examine it.',note:'Use the six dimensions to locate a constraint, not to score an organisation. A strategy ceiling is a boundary beyond which the current work cannot question rules, priorities, or resources. Describe what you can establish; do not diagnose people\'s motives.',fields:[
      ['condition','The main dimension','Pick the most consequential constraint for this case.','select',['Unknown','Boundary','Demand','Authority','Capability','Measurement','Sustainment']],
      ['constraint','The limiting condition','Name a specific rule, permission, resource, measure, or responsibility.'],
      ['constraintEvidence','Evidence and uncertainty','What shows that this condition is holding the pattern in place? What remains an assumption?'],
      ['participants','The necessary participants','Include affected people as well as formal authority, resource, and relevant expertise. Mark missing voices or access not yet agreed.']
    ]},
    {name:'The learning loop',title:'What arrangement would let evidence change a decision?',output:'One proposed loop with authority, assurance, and a return to the person.',note:'A feedback meeting is not enough. Follow the information into an actual decision, an action, and the next encounter. State what happens when the evidence challenges the rule itself. All arrangements remain proposals until the relevant people agree.',fields:[
      ['loopEvidence','Evidence entering the review','What account of the situation and its effects will be considered, and with whom?'],
      ['authority','Decision agreement','[Role] can decide [what] within [limits]. Name resource and support as well as permission.'],
      ['assurance','Assurance','How will those responsible know whether the work is lawful, fair, safe, resourced, and useful? Use actual agreed requirements, not a generic promise.'],
      ['changedResponse','Changed response and return','Who does what differently, and how does the person learn what happened? How can they disagree or seek review?'],
      ['ruleChange','When the rule is the problem','Where can evidence go to change the rule, measure, or budget? Name who can make that decision and how the outcome returns.']
    ]},
    {name:'The experiment',title:'What bounded test could examine the proposed change?',output:'An operational hypothesis and an institutional experiment, with a review.',note:'The operational test asks whether the changed work helps. The institutional test asks whether its conditions can be authorised and sustained. Success in one does not establish success in the other.',fields:[
      ['operational','Operational hypothesis','If we change [work], we expect [effect for the person], which we will observe through [evidence].'],
      ['institutional','Institutional experiment','For this practice to endure, [condition] must change. We will invite [roles] to test [arrangement].'],
      ['scope','Scope and permission before starting','Record the limited scope, owner, resources, duration, and permissions still needed.'],
      ['reviewDate','Review date','Leave blank if it has not been agreed.','date'],
      ['evidence','Evidence for the review','Include the person\'s experience, outcome, displaced work, repeat demand, and possible harm. Fewer contacts alone do not establish improvement.'],
      ['stop','Stop or revise conditions','What would require a pause or revision? Who can act when that happens?']
    ]},
    {name:'Make it ordinary',title:'What would allow this practice to continue without special protection?',output:'A sustainment check and one next conversation.',note:'Test the arrangement, not the heroic qualities of its current sponsor. A useful experiment may reveal a need to change the proposal or its boundary.',fields:[
      ['sustain','If the worker, sponsor, or special funding leaves','What remains in ordinary roles, budgets, supervision, measures, and learning? What is still dependent on a particular person?'],
      ['excluded','What does this map or intervention leave out?','Name an excluded voice, a cost moved elsewhere, or an assumption made harder to question.'],
      ['nextConversation','The next conversation','Who needs to speak with whom, by when, to make the proposed test possible? No identifiable case details.']
    ]},
    {name:'Your working record',title:'Review the proposal before taking it into work',output:'One editable and printable record of your thinking.',note:'This record is not an approval, an evaluation, or a validated diagnosis. Blank fields and unknown permissions remain unresolved. Use it to prepare the next conversation.',fields:[]}
  ];
  const allFields = steps.flatMap(s => s.fields);
  const allowed = new Set(allFields.map(f => f[0]));
  let values = {}, position = 0, example = false;
  const $ = id => document.getElementById(id);
  function el(tag,text,cls) { const node=document.createElement(tag); if(text!==undefined)node.textContent=text; if(cls)node.className=cls; return node; }
  function status(message,error=false) { $('tool-status').textContent=message; $('tool-status').classList.toggle('error',error); }
  function hasWork(){return Object.values(values).some(v=>v.trim());}
  function persist(){ if(!$('remember').checked)return; try{ localStorage.setItem(STORAGE,JSON.stringify(payload())); }catch(e){$('remember').checked=false;status('Device storage is unavailable. Save an editable file to keep this record.',true);} }
  function payload(){return {schema:SCHEMA,version:1,savedAt:new Date().toISOString(),example,values};}
  function filename(ext){return new Date().toISOString().slice(0,10)+' RedQuadrant relational public services working record v0.01 BT.'+ext;}
  function file(text,type,extension){const a=el('a');const url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=filename(extension);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function reportNode(){
    const root=el('div');root.append(el('h2','Relational public services: working record'));
    root.append(el('p',values.title||'Untitled anonymised situation'));
    root.append(el('p',example?'Fictional Asha teaching example, with proposed arrangements. Not a real case, agreed authority, or empirical result.':'Working proposal. Not an approval, evaluation, or validated diagnosis.'));
    root.append(el('p','Prepared '+new Date().toLocaleDateString('en-GB')+'. Source method: Benjamin P Taylor / RedQuadrant, 8 October 2026.'));
    steps.slice(0,-1).forEach((step,i)=>{const section=el('section');section.append(el('h3',(i+1)+'. '+step.name));step.fields.forEach(f=>{section.append(el('h4',f[1]));const text=values[f[0]];const p=el('p',text&&text.trim()?text:'Not yet recorded / unknown');p.style.whiteSpace='pre-wrap';section.append(p);});root.append(section);});
    const unresolved=allFields.filter(f=>!values[f[0]]||!values[f[0]].trim()||values[f[0]]==='Unknown');
    const section=el('section');section.append(el('h3','Before proceeding'));
    const permission=values.permission||'Unknown';section.append(el('p','Permission status: '+permission+'. Verify it with the authorised role; this tool cannot establish it.'));
    if(unresolved.length)section.append(el('p','Not yet recorded or marked unknown: '+unresolved.map(f=>f[1]).join('; ')+'.'));
    section.append(el('p','Check affected people\'s involvement, the intended benefit, resources, rights, risks, review arrangements, and stop conditions before any real test.'));
    root.append(section);return root;
  }
  function reportText(){const node=reportNode();return Array.from(node.querySelectorAll('h2,h3,h4,p')).map(n=>n.textContent).join('\n\n');}
  function renderReport(){
    const panel=$('step-panel');
    const actions=el('div',undefined,'actions');
    const print=el('button','Print working record');print.type='button';print.addEventListener('click',()=>{document.body.classList.remove('print-guide');$('print-report').replaceChildren(reportNode());window.print();});
    const copy=el('button','Copy plain text','secondary');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(reportText());status('Working record copied. Paste it only into an appropriate destination.');}catch(e){const area=el('textarea');area.value=reportText();area.setAttribute('aria-label','Select and copy the working record');area.rows=12;panel.append(area);area.focus();area.select();status('Automatic copy is unavailable. The plain text is selected below.');}});
    const save=el('button','Save text record','secondary');save.type='button';save.addEventListener('click',()=>file(reportText(),'text/plain;charset=utf-8','txt'));
    actions.append(print,copy,save);panel.append(actions);
    const report=reportNode();report.className='report';panel.append(report);
  }
  function render(focus=false){
    const nav=$('steps');nav.replaceChildren();steps.forEach((s,i)=>{const b=el('button',(i+1)+'. '+s.name);b.type='button';b.setAttribute('aria-current',i===position?'step':'false');b.addEventListener('click',()=>{position=i;render(true);});nav.append(b);});
    const panel=$('step-panel');panel.replaceChildren();const step=steps[position];
    const h=el('h3',step.title);h.id='current-step-title';h.tabIndex=-1;panel.append(el('p','Step '+(position+1)+' of '+steps.length,'label'),h,el('p',step.note),el('p','Output: '+step.output,'output'));
    if(example)panel.append(el('p','Fictional teaching example. Later entries illustrate proposals, not actions or permissions that have been agreed.','hint'));
    step.fields.forEach(f=>{const [key,label,hint,type,options]=f;const group=el('div',undefined,'field');const lab=el('label',label);lab.htmlFor='field-'+key;group.append(lab);const helper=el('p',hint,'hint');helper.id='hint-'+key;group.append(helper);let input;
      if(type==='select'){input=el('select');options.forEach(o=>{const opt=el('option',o);opt.value=o;input.append(opt);});}
      else if(type==='input'||type==='date'){input=el('input');input.type=type==='date'?'date':'text';}
      else{input=el('textarea');input.rows=3;}
      input.id='field-'+key;input.name=key;input.setAttribute('aria-describedby',helper.id);input.autocomplete='off';input.maxLength=MAX;input.value=values[key]||(type==='select'?'Unknown':'');
      input.addEventListener('input',()=>{values[key]=input.value;persist();});group.append(input);panel.append(group);
    });
    if(position===steps.length-1)renderReport();
    $('previous').disabled=position===0;$('next').disabled=position===steps.length-1;$('progress').textContent=(position+1)+' / '+steps.length;
    if(focus)h.focus({preventScroll:false});
  }
  $('previous').addEventListener('click',()=>{if(position>0){position--;render(true);}});
  $('next').addEventListener('click',()=>{if(position<steps.length-1){position++;render(true);}});
  $('export-json').addEventListener('click',()=>{file(JSON.stringify(payload(),null,2),'application/json','json');status('Editable record saved as a file. It contains your entries; keep it appropriately.');});
  $('remember').addEventListener('change',()=>{if($('remember').checked){persist();if($('remember').checked)status('Device storage enabled for this browser. This is not encrypted case storage.');}else{try{localStorage.removeItem(STORAGE);}catch(e){}status('Stored copy removed. Your current tab still contains the record.');}});
  $('new-record').addEventListener('click',()=>{if(hasWork()&&!confirm('Clear this working record and its stored copy? Export first to keep it.'))return;values={};example=false;position=0;$('remember').checked=false;try{localStorage.removeItem(STORAGE);}catch(e){}render(true);status('Record cleared. No device copy is retained by this tool.');});
  const asha={
    title:'Repair appointments and working hours',
    purpose:'Fictional case. Asha wants to keep her job and stay near her sister. Damp is making her son\'s breathing worse. Repair appointments clash with her shifts. She has told three teams and still does not know who can help.',
    contact:'Asha has contacted three teams. The exact channels and chronology are not specified in the teaching case.',
    account:'The account connects housing, work, health, family support, and repeated unsuccessful contact.',
    response:'A repair appointment is offered and then rearranged. A housing advice referral is made. Asha is advised to contact the GP about respiratory concerns.',
    record:'Damp repair logged; tenant unavailable; appointment rearranged; housing advice referral made; advice to contact GP.',
    measure:'Repair request responded to within target. Advice referral completed. No unresolved action assigned to this team.',
    decision:'Case closed in the fictional management report.',
    nextContact:'Prediction, not an observed outcome: Asha may need to contact services again. A later request may be treated as a fresh case.',
    lost:'The translation from Asha\'s connected account into task completion loses the clash between work and appointments and does not establish that the repair has been completed.',
    integration:'Inference from the case: Asha, a relative, or a helpful worker may have to chase and connect the separate responses. The amount of work is unknown.',
    decisionRole:'Unknown. Identify the roles responsible for repairs scheduling and the closure measure.',
    decisionChange:'Distinguish an appointment being offered from the repair being completed, and respond to the clash with working hours.',
    permission:'Proposed; not yet agreed',condition:'Measurement',
    constraint:'The illustrated management account permits closure when a request has been responded to and a referral completed, without showing resolution.',
    constraintEvidence:'The fictional management report records completion of actions. It does not establish repair completion. Actual performance rules, permissions, and constraints would need to be checked in a real service.',
    participants:'Proposed: the affected person, the worker handling contact, repairs scheduling, and the role authorised to change reporting and closure arrangements. Confirm whether others are needed and whether participation is agreed.',
    loopEvidence:'Proposed: review the original account, repair status, appointment constraints, and the person\'s experience together rather than considering a closed-task count alone.',
    authority:'Proposed: an authorised repairs role can vary appointment arrangements within an explicitly agreed resource and safety boundary. The actual role, limits, and permission remain to be established.',
    assurance:'Proposed: review completion, appointment reliability, fairness of access, resource use, and the person\'s account. Apply the service\'s actual safety and accountability requirements.',
    changedResponse:'Proposed: offer a workable appointment where possible, record unresolved work distinctly, and tell the person what will happen next. Agree a route for disagreement, non-response, or further review.',
    ruleChange:'Proposed: the role owning closure and reporting reviews repeated mismatches and can decide whether to revise the measure or rule. Record the decision and return it to staff and affected people.',
    operational:'If appointment arrangements can fit working hours, we expect fewer failed visits and less disruption to work. Examine completed repairs and the person\'s experience; do not assume this has already happened.',
    institutional:'Invite scheduling and performance-reporting roles to test whether ordinary booking and closure arrangements can change, rather than approving a one-off favour.',
    scope:'No real test is authorised by this example. Agree the owner, limited scope, resources, duration, safety boundaries, and permissions first.',
    evidence:'Completed repairs; repeat contact; disruption to work; burden transferred to the person, another team, or future budgets; unintended exclusion; evidence that the authorised rule or measure changed.',
    stop:'Proposed: pause if an agreed safety limit is crossed, necessary permission is absent, or the arrangement displaces unacceptable burden. Name a responsible role before starting.',
    sustain:'Test whether the change is reflected in ordinary scheduling, reporting, roles, supervision, and resourcing. A sponsor\'s personal permission alone will not answer this question.',
    excluded:'Asha is fictional and has not participated in this analysis. The case does not establish clinical facts, legal duties, actual budgets, or every relevant relationship.',
    nextConversation:'Ask the roles responsible for scheduling and reporting what evidence and authority would be needed to examine the closure arrangement. No meeting or date is agreed in this example.'
  };
  $('load-example').addEventListener('click',()=>{if(hasWork()&&!confirm('Replace the current record with the fictional Asha example? Export first to keep your work.'))return;values={...asha};example=true;position=0;persist();render(true);status('Fictional example loaded. Proposed arrangements are explicitly unagreed.');});
  function validated(data){
    if(!data||typeof data!=='object'||Array.isArray(data)||data.schema!==SCHEMA||data.version!==1||!data.values||typeof data.values!=='object'||Array.isArray(data.values))throw Error('This is not a supported working-record file.');
    const clean={};for(const [k,v] of Object.entries(data.values)){if(!allowed.has(k)||typeof v!=='string'||v.length>MAX)throw Error('The file contains an unsupported field or value.');const f=allFields.find(f=>f[0]===k);if(f[3]==='select'&&!f[4].includes(v))throw Error('The file contains an invalid selection.');if(f[3]==='date'&&v&&!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('The review date is invalid.');clean[k]=v;}
    return {values:clean,example:data.example===true};
  }
  $('import-button').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async event=>{const f=event.target.files[0];event.target.value='';if(!f)return;try{if(f.size>1000000)throw Error('The file is too large for an anonymised working record.');const data=validated(JSON.parse(await f.text()));if(hasWork()&&!confirm('Replace this working record with the imported file? Export first to keep the current work.'))return;values=data.values;example=data.example;position=0;persist();render(true);status('Working record imported. Check its contents and permission status before use.');}catch(e){status('Import stopped: '+(e.message||'The file could not be read.'),true);}});
  $('focus-button').addEventListener('click',()=>{const active=document.body.classList.toggle('focus-mode');$('focus-button').setAttribute('aria-pressed',String(active));$('focus-button').textContent=active?'Show the whole guide':'Focus on the tool';if(active)$('workbench').scrollIntoView();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('focus-mode'))$('focus-button').click();});
  $('expand-guide').addEventListener('click',()=>{const items=Array.from($('guide-details').querySelectorAll('details'));const open=items.some(d=>!d.open);items.forEach(d=>d.open=open);$('expand-guide').textContent=open?'Close all explanations':'Open all explanations';});
  let printOpen=[];
  $('print-guide').addEventListener('click',()=>{printOpen=Array.from($('guide-details').querySelectorAll('details')).map(d=>d.open);$('guide-details').querySelectorAll('details').forEach(d=>d.open=true);document.body.classList.add('print-guide');window.print();});
  window.addEventListener('afterprint',()=>{if(document.body.classList.contains('print-guide')){$('guide-details').querySelectorAll('details').forEach((d,i)=>d.open=!!printOpen[i]);document.body.classList.remove('print-guide');}});
  try{const saved=localStorage.getItem(STORAGE);if(saved){const data=validated(JSON.parse(saved));values=data.values;example=data.example;$('remember').checked=true;status('Restored the record previously saved on this device. Untick device storage to remove that copy.');}}catch(e){status('A stored record could not be restored. You can start again or import an exported file.',true);}
  render();
})();
