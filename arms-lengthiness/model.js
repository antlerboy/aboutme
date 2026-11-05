(function (root) {
  'use strict';
  const criteria = [
    ['grip','Control','Direct control','A tight grip is essential','Broad direction only','How tightly should the commissioning organisation steer day-to-day delivery? Would tighter grip improve outcomes, or create comfort?'],
    ['accountability','Control','Accountability for results','Entirely with us','Entirely elsewhere','Who must answer for the results, including when things go wrong?'],
    ['ownership','Control','Ownership of the delivery body','Entirely with us','Entirely elsewhere','Who should own the body that delivers? This is separate from ownership of service assets.'],
    ['responsibility','Control','Responsibility for delivery','Entirely with us','Entirely elsewhere','Who should carry the responsibility for doing the work?'],
    ['authority','Control','Decision-making authority','We make all decisions','We make no decisions','Who should have authority to decide how delivery works?'],
    ['finance','Control','Financial control','Entirely with us','Entirely elsewhere','Who should control budgets, spending, and financial choices?'],
    ['competition','Competition and contestability','Competition','None','Full and open competition','How much competition should there be to win the work?'],
    ['contestability','Competition and contestability','Contestability','None','Full contestability throughout','How much transparency and credible possibility of replacement should keep provision open to challenge?'],
    ['failback','If delivery fails','Fail back','We must take responsibility for continuity','Provision may cease','If the provider fails, must we pick up delivery, or can this provision end?'],
    ['stepin','If delivery fails','Step-in rights','We can intervene at any time','We have no right to intervene','What rights should we have to intervene in a delivery body? Capability to intervene is a further question.'],
    ['rollback','If delivery fails','Roll back','We can bring delivery back at any time','We cannot bring delivery back','What should we be able to bring back, and how readily?'],
    ['assets','Commercial possibilities','Ownership of assets','We retain the assets','Assets transfer and cannot be recovered','What happens to the assets needed for the service?'],
    ['funding','Commercial possibilities','Attracting other funding','Irrelevant or undesirable','A central purpose of the model','How strongly should access to grants, investment, or other funding shape this choice?'],
    ['trade','Commercial possibilities','Trading','No trading required','A central purpose of the model','How strongly should the freedom to trade shape this choice?'],
    ['legal','Other implications','Legal structure','Simple and easily managed','As complex as needed','How much independence and complexity of legal form are we prepared to accommodate?'],
    ['people','Other implications','Recruitment and retention','Existing arrangements are sufficient','A central purpose of the model','How strongly should access to different employment arrangements and labour markets shape this choice?'],
    ['market','Other implications','Market shaping','Not a purpose of this change','A central purpose of the model','How strongly should developing future provision and the wider market guide this choice?'],
    ['sponsor','Governance','Sponsor involvement','Full oversight','No involvement','How much involvement should the commissioning organisation retain in governance? Higher scores mean less sponsor involvement.'],
    ['community','Governance','Community involvement','None','Full involvement','How much involvement should the community have in governance? Higher scores mean more involvement.'],
    ['users','Governance','Service-user involvement','None','Full involvement','How much involvement should people using the service have in governance?'],
    ['employees','Governance','Employee involvement','None','Full involvement','How much involvement should employees have in governance?']
  ].map(([id,group,label,low,high,prompt]) => ({id,group,label,low,high,prompt}));
  const profiles = [
    ['contracting','Contracting variants',[3,0,0,8,0,0,10,4,0,6,2,0,4,5,0,7,5,0,2,2,2]],
    ['grouped','Grouped models',[3,0,0,4,7,0,10,7,3,6,3,0,2,2,2,7,4,0,2,2,2]],
    ['shared','Shared arrangements',[5,2,4,4,4,3,3,4,4,4,5,0,0,2,4,9,2,3,0,0,0]],
    ['joint','Joint ventures',[5,2,4,3,3,4,10,0,5,6,4,3,8,8,5,9,4,0,2,2,2]],
    ['bodies','Arm’s-length bodies',[5,4,6,3,5,5,0,2,3,3,0,4,6,10,4,6,5,4,2,2,2]],
    ['community','Community-led provision',[8,8,8,7,9,4,0,3,5,8,6,8,10,8,5,7,8,8,10,10,7]],
    ['enabling','Enabling and making the market',[10,6,7,8,10,10,10,8,8,9,8,8,5,5,8,8,10,8,5,10,2]],
    ['release','Giving up control',[10,10,10,10,10,10,0,10,10,10,10,10,8,7,8,8,8,10,5,5,5]],
    ['mutual','Mutual models',[8,8,8,6,8,10,3,8,7,10,8,8,10,9,7,9,6,10,6,7,10]],
    ['social','Socially focused models',[7,7,8,9,8,10,6,3,8,8,5,6,9,6,4,9,4,7,7,7,4]],
    ['venture','Venture approaches',[8,3,7,7,7,7,6,5,5,7,9,6,10,7,8,5,10,6,5,2,2]]
  ].map(([id,name,scores]) => ({id,name,scores}));
  function valid(scores) {
    return Array.isArray(scores) && scores.length === 21 && Array.from(scores).every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10);
  }
  function rank(scores) {
    if (!valid(scores)) return [];
    const ranked = profiles.map(p => {
      const gaps = p.scores.map((v,i) => ({criterion:criteria[i],desired:scores[i],profile:v,gap:Math.abs(v-scores[i])})).sort((a,b)=>b.gap-a.gap);
      return {...p,fit:100*(1-gaps.reduce((s,g)=>s+g.gap,0)/210),gaps};
    }).sort((a,b)=>b.fit-a.fit);
    let position=0;
    ranked.forEach((p,i)=>{if(i===0 || Math.abs(p.fit-ranked[i-1].fit)>1e-9)position=i+1;p.rank=position;});
    return ranked;
  }
  const api={criteria,profiles,valid,rank,version:'1.0'};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.ArmsLengthModel=api;
}(typeof window !== 'undefined' ? window : globalThis));
