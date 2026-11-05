/* Four dynamics: reflection prompts, with no scoring, tracking, or remote calls. */
'use strict';
(() => {
  const form = document.getElementById('diagnosis-form');
  if (!form) return;
  const output = document.getElementById('diagnosis-results');
  const status = document.getElementById('diagnosis-status');
  const names = { segment: 'Segment', blend: 'Blend', empower: 'Empower', harmonise: 'Harmonise' };
  const states = { unclear: 'Not yet clear', low: 'Too little', workable: 'Workable for this task', high: 'Too much', mixed: 'Mixed across people or situations' };
  const prompts = {
    segment: {
      low: ['What expertise or responsibility needs a protected home?', 'Try protected specialist work, a community of practice, or clearer responsibility for one task. Preserve cross-team contact and a way to contribute to the whole.'],
      high: ['What makes a useful boundary become a defended territory?', 'Direct: could reciprocal visits or shared work strengthen blend? Vertical: can an individual question their team’s line? Diagonal: could a shared undertaking connect the groups without erasing their expertise? Check local targets and resource competition before adding a routine.']
    },
    blend: {
      low: ['Where would understanding another group’s actual work change a decision?', 'Try a reciprocal visit, a shared meal, a practical demonstration, or one jointly examined handover. Keep specialist responsibilities visible. A new mixed team will need permission to address old disputes.'],
      high: ['What is compulsory consultation preventing people from doing?', 'Direct: would clearer specialist responsibility strengthen segment? Vertical: does the conversation need a common purpose and commitments? Diagonal: should a named individual be authorised to decide? Keep useful knowledge sharing as you reduce involvement.']
    },
    empower: {
      low: ['Which real decision could someone take without further permission?', 'Try one delegated decision with clear limits, resources, and backing. Direct: protect dissent from pressure to harmonise. Vertical: ask whether the team identity suppresses personal judgement. Diagonal: could relationships across groups help a person use their freedom?'],
      high: ['What do individual choices cost other people or the common undertaking?', 'Direct: could shared priorities and mutual commitments strengthen harmonise? Vertical: would a specialist practice help isolated people learn together? Diagonal: could cross-group relationships reveal the consequences of personal choices? Preserve discretion where it serves the work.']
    },
    harmonise: {
      low: ['What purpose and commitments would make separate contributions useful together?', 'Try an agreement about one shared outcome, contributions, and dependencies. Protect judgement and dissent. Vertical: turn existing exchanges into coordinated action. Diagonal: connect specialist teams through the undertaking.'],
      high: ['What difference is currently too costly to voice?', 'Direct: could a protected decision or dissenting contribution strengthen empower? Vertical: could genuine exchange replace performed agreement? Diagonal: should distinct groups develop and articulate different capabilities? Watch for withdrawal or rebellion as a response to enforced unity.']
    }
  };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const read = () => Object.fromEntries(new FormData(form).entries());
  let generated = false;
  const notesLines = () => {
    const data = read();
    const lines = ['Four team dynamics — working notes', 'https://antlerboy.com/four-dynamics/', '', 'These are personal observations and an experiment to discuss, rather than a validated assessment.', ''];
    const labels = { situation:'Situation and boundary', purpose:'Purpose and people served', rhythm:'Rhythm', voices:'Different or missing experiences', constraints:'Conditions maintaining the pattern', experiment:'Proposed change', support:'Owner, authority, and resources', counterpart:'Useful dynamic to preserve', dose:'Dose and rhythm of the experiment', effects:'Expected observations', stop:'Change or stop conditions', review:'Review date or cycle' };
    ['situation', 'purpose'].forEach(key => lines.push(labels[key] + ':', data[key] || '(not entered)', ''));
    Object.keys(names).forEach(key => lines.push(names[key] + ': ' + states[data[key + '-state']], 'Evidence and alternative explanation: ' + (data[key + '-evidence'] || '(not entered)'), ''));
    Object.keys(labels).filter(key => !['situation','purpose'].includes(key)).forEach(key => lines.push(labels[key] + ':', data[key] || '(not entered)', ''));
    return lines;
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = read();
    const cards = Object.keys(names).map(key => {
      const state = data[key + '-state'];
      const evidence = (data[key + '-evidence'] || '').trim();
      let content;
      if (state === 'unclear') {
        content = '<p>Gather a recent example before choosing a change. Ask someone whose experience may differ from yours, and look at what happens when work is under pressure.</p>';
      } else if (!evidence) {
        content = '<p>Add an event or observation to support this judgement, and a possible different explanation. Compare it with the experience of someone affected before selecting an intervention.</p>';
      } else if (state === 'mixed') {
        content = '<p>Keep the difference visible. Compare roles, situations, authority, and timing. A general increase or decrease could improve conditions for one group while making them worse for another. Choose one boundary or work cycle to examine more closely.</p>';
      } else if (state === 'workable') {
        content = '<p>Keep what is helping the task. Check who benefits from the current arrangement, whether others experience it differently, and what may happen when the task or pressure changes.</p>';
      } else {
        const [question, action] = prompts[key][state];
        content = '<p><strong>' + question + '</strong></p><p>' + action + '</p>';
      }
      return '<article class="result ' + key + '"><h3>' + names[key] + ' · ' + states[state] + '</h3>' + (evidence ? '<p class="evidence"><strong>Your observation:</strong> ' + escape(evidence) + '</p>' : '') + content + '</article>';
    });
    const hasEvidence = Object.keys(names).some(key => data[key + '-state'] !== 'unclear' && (data[key + '-evidence'] || '').trim());
    output.innerHTML = '<h2>Questions for your experiment</h2><p>These prompts follow your judgements. They don’t establish a diagnosis. Check the observations and agree a change with the people involved.</p>' + cards.join('') + '<div class="note"><h3>' + (hasEvidence ? 'Choose a bounded change' : 'Begin with the missing evidence') + '</h3><p>' + (hasEvidence ? 'Compare the relationships, then choose one credible experiment. Complete the experiment fields above: owner and authority, dose and rhythm, the counterpart to protect, observable effects, a review, and a stop condition.' : 'Use a recent event, compare experiences, and consider other explanations. You can still record an initial experiment above, but don’t treat an untested impression as an agreed account.') + '</p><p><a href="/four-dynamics/intervene/#relationships">Read the six relationships</a> · <a href="/four-dynamics/intervene/#dose">Check dose, timing, and rebound</a></p></div>';
    output.hidden = false;
    generated = true;
    status.textContent = 'Prompts generated. Review them below; complete or revise your experiment above.';
    output.focus();
  });

  form.addEventListener('input', () => {
    if (generated) status.textContent = 'Your notes have changed. Show prompts again to update them.';
  });
  form.addEventListener('change', () => {
    if (generated) status.textContent = 'Your judgements have changed. Show prompts again to update them.';
  });
  form.addEventListener('reset', () => {
    output.hidden = true;
    output.replaceChildren();
    generated = false;
    status.textContent = 'Entries and generated prompts cleared from this page.';
  });

  document.getElementById('download-diagnosis').addEventListener('click', () => {
    const blob = new Blob([notesLines().join('\n')], { type:'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'four-dynamics-working-notes.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Working notes downloaded. Keep the file somewhere suitable for the information it contains.';
  });
  let printNotes;
  window.addEventListener('beforeprint', () => {
    if (!printNotes) {
      printNotes = document.createElement('section');
      printNotes.className = 'print-notes';
      printNotes.setAttribute('aria-label', 'Your complete working notes');
      form.insertAdjacentElement('afterend', printNotes);
    }
    printNotes.textContent = notesLines().join('\n');
    form.classList.add('print-snapshot-ready');
  });
  document.getElementById('print-diagnosis').addEventListener('click', () => window.print());
})();
