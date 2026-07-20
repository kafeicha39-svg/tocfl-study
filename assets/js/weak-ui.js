(function(){
  const storage = window.tocflStudyStorage;
  if(!storage) return;

  function updateButton(button){
    const word = button.dataset.word;
    const active = storage.isWeak(word);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? '★ 苦手から解除' : '☆ 苦手に追加';
  }

  function addButtons(){
    document.querySelectorAll('.word').forEach(wordElement => {
      const card = wordElement.closest('.card');
      if(!card || card.querySelector('.weak-toggle')) return;
      const word = wordElement.textContent.trim();
      if(!word) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'weak-toggle';
      button.dataset.word = word;
      button.addEventListener('click', () => {
        if(storage.isWeak(word)) storage.resolve(word);
        else storage.addManual(word);
        updateButton(button);
      });
      const anchor = card.querySelector('.pinyin') || wordElement;
      anchor.insertAdjacentElement('afterend', button);
      updateButton(button);
    });
  }

  addButtons();
  window.addEventListener('tocfl-study-updated', () => {
    document.querySelectorAll('.weak-toggle').forEach(updateButton);
  });
})();
