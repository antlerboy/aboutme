const fields = [...document.querySelectorAll('.prompt textarea')];
const printFields = fields.map(field => {
  const value = document.createElement('div');
  value.className = 'print-value';
  value.setAttribute('aria-hidden', 'true');
  field.after(value);
  return value;
});

function preparePrint() {
  fields.forEach((field, index) => {
    printFields[index].textContent = field.value;
  });
  // A long response can span more than one printed page in the stacked layout.
  const needsMoreRoom = fields.some(field =>
    field.value.length > 320 || field.value.split('\n').length > 5
  );
  document.body.classList.toggle('long-notes', needsMoreRoom);
}

const printButton = document.querySelector('.print-button');
printButton.hidden = false;
document.body.classList.add('print-ready');
window.addEventListener('beforeprint', preparePrint);
printButton.addEventListener('click', () => {
  preparePrint();
  window.print();
});
