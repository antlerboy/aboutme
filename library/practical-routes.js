(() => {
  document.querySelectorAll('[data-download-note]').forEach(button => {
    button.addEventListener('click', () => {
      const route = button.closest('[data-route]');
      const text = `${route.querySelector('h2').textContent}\n\n${route.querySelector('textarea').value}`;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${route.dataset.route}-working-note.txt`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      route.querySelector('[role="status"]').textContent = 'Your working note has been downloaded.';
    });
  });
})();
