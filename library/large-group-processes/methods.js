(() => {
  const ids=['method-query','method-collection','method-complexity','method-focus'];
  const [query,collection,complexity,focus]=ids.map(id=>document.getElementById(id));
  const cards=[...document.querySelectorAll('.method')];
  const normalise=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const text=new Map(cards.map(card=>[card,normalise(card.textContent)]));
  function apply(){
    const words=normalise(query.value).trim().split(/\s+/).filter(Boolean);
    let count=0;
    for(const card of cards){
      const shown=words.every(word=>text.get(card).includes(word))&&(!collection.value||card.dataset.collection===collection.value)&&(!complexity.value||card.dataset.complexity===complexity.value)&&(!focus.value||card.dataset.focus===focus.value);
      card.hidden=!shown;if(shown)count++;
    }
    document.getElementById('method-count').textContent=`${count} of ${cards.length} entries shown`;
    document.getElementById('method-empty').hidden=count!==0;
  }
  query.addEventListener('input',apply);
  [collection,complexity,focus].forEach(control=>control.addEventListener('change',apply));
  document.getElementById('method-reset').addEventListener('click',()=>{for(const id of ids)document.getElementById(id).value='';apply();query.focus();});
  apply();
})();
