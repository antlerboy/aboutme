'use strict';

const copyButton = document.getElementById('copy-mentor');
const instructions = document.getElementById('mentor-instructions');
const instructionsPanel = document.getElementById('mentor-prompt');
const copyStatus = document.getElementById('copy-status');

if (copyButton && instructions && instructionsPanel && copyStatus) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(instructions.value);
      copyStatus.textContent = 'Copied. Paste the instructions into your AI assistant, then add your situation.';
    } catch {
      instructionsPanel.open = true;
      instructions.focus();
      instructions.select();
      copyStatus.textContent = 'Automatic copy is unavailable. The instructions are selected below; use your usual Copy command, or download the text file.';
    }
  });
}
