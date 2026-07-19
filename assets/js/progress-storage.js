(function(){
  const progressPrefix = 'tocfl_';

  function isProgressKey(key){
    return typeof key === 'string' && key.startsWith(progressPrefix);
  }

  window.tocflProgressStorage = {
    getItem(key){
      return localStorage.getItem(key);
    },

    setItem(key, value){
      const stringValue = String(value);
      const previousValue = localStorage.getItem(key);
      localStorage.setItem(key, stringValue);

      if(isProgressKey(key) && previousValue !== stringValue){
        window.dispatchEvent(new CustomEvent('tocfl-progress-local-change', {
          detail: {key, value: stringValue}
        }));
      }
    }
  };
})();
